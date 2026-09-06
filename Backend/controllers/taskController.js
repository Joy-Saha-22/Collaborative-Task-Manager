const { array } = require("../middlewares/uploadMiddleware");
const Task = require("../models/Task");

const getTasks = async (req, res) => {
    try {
        const { status } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9; // 9 fits a 3-column grid cleanly
        const skip = (page - 1) * limit;

        let filter = {};

        if (status) {
            filter.status = status;
        }

        const roleFilter = req.user.role === "admin" ? {} : { assignedTo: req.user._id };
        const combinedFilter = { ...filter, ...roleFilter };

        // Total count for THIS filter (status + role) — needed to calculate total pages
        const totalFilteredTasks = await Task.countDocuments(combinedFilter);

        let tasks = await Task.find(combinedFilter)
            .populate("assignedTo", "name email profileImageUrl")
            .sort({ createdAt: -1 }) // most recent first — adjust if you sort differently elsewhere
            .skip(skip)
            .limit(limit);

        // Add completed todoChecklist count to each task
        tasks = await Promise.all(
            tasks.map(async (task) => {
                const completedCount = task.todoChecklist.filter(
                    (item) => item.completed
                ).length;
                return { ...task._doc, completedTodoCount: completedCount };
            })
        );

        // status summary counts — unaffected by pagination, always reflect the FULL set
        const allTasks = await Task.countDocuments(
            req.user.role === "admin" ? {} : { assignedTo: req.user._id }
        );

        const pendingTasks = await Task.countDocuments({
            ...filter,
            status: "Pending",
            ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
        });

        const inProgressTasks = await Task.countDocuments({
            ...filter,
            status: "In Progress",
            ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
        });
        const completedTasks = await Task.countDocuments({
            ...filter,
            status: "Completed",
            ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
        });

        res.json({
            tasks,
            statusSummary: {
                all: allTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks,
            },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalFilteredTasks / limit),
                totalTasks: totalFilteredTasks,
                limit,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate(
            "assignedTo",
            "name image profileImageUrl",
        );
        if (!task) return res.status(404).json({ message: "Task not found" });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            attachments,
            todoChecklist
        } = req.body;

        if (!Array.isArray(assignedTo)) {
            return res.status(400).json({ message: "assignedTo must be an array of user ID's" });
        }

        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            createdBy: req.user._id,
            todoChecklist,
            attachments,
        });

        // Notify every assigned user's dashboard in real time
        const io = req.app.get("io");
        assignedTo.forEach((userId) => {
            io.to(userId.toString()).emit("taskCreated", { ...task.toObject(), triggeredBy: req.user._id.toString() });
        });
        io.to("admins").emit("taskCreated", { ...task.toObject(), triggeredBy: req.user._id.toString() });

        res.status(201).json({ message: "Task Created Successfully", task });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });
        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
        task.attachments = req.body.attachments || task.attachments;

        if (req.body.assignedTo) {
            if (!Array.isArray(req.body.assignedTo)) {
                return res
                    .status(400)
                    .json({ message: "assignedTo must be an array of user IDs" });
            }
            task.assignedTo = req.body.assignedTo;
        }
        const updatedTask = await task.save();

        // Notify every currently assigned user's dashboard in real time
        const io = req.app.get("io");
        const payload = { ...updatedTask.toObject(), triggeredBy: req.user._id.toString() };
        updatedTask.assignedTo.forEach((userId) => {
            io.to(userId.toString()).emit("taskUpdated", payload);
        });
        io.to("admins").emit("taskUpdated", payload);

        res.json({ message: "Task Updated Successfully", updatedTask });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        // Capture assignees before deleting — the doc is gone from the DB after this,
        // but `task` still holds the data in memory since we already fetched it
        const assignedUsers = task.assignedTo.map(id => id.toString());
        const taskId = task._id;

        await task.deleteOne();

        // Notify everyone who had this task on their dashboard
        const io = req.app.get("io");
        assignedUsers.forEach((userId) => {
            io.to(userId).emit("taskDeleted", { taskId, triggeredBy: req.user._id.toString() });
        });
        io.to("admins").emit("taskDeleted", { taskId, triggeredBy: req.user._id.toString() });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const updateTaskStatus = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });
        const isAssigned = task.assignedTo.some(
            (userId) => userId.toString() === req.user._id.toString()
        );
        if (!isAssigned && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized" });
        }
        task.status = req.body.status || task.status;

        if (task.status === "Completed") {
            task.todoChecklist.forEach((item) => (item.completed = true));
            task.progress = 100;
        }
        await task.save();

        // Notify every assignee's dashboard, and admins, that status/progress changed
        const io = req.app.get("io");
        const payload = {
            taskId: task._id,
            status: task.status,
            progress: task.progress,
            todoChecklist: task.todoChecklist,
            triggeredBy: req.user._id.toString()
        };
        task.assignedTo.forEach((userId) => {
            io.to(userId.toString()).emit("taskStatusUpdated", payload);
        });
        io.to("admins").emit("taskStatusUpdated", payload);

        res.json({ message: "Task status updated", task })
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const updateTaskCheckList = async (req, res) => {
    try {
        const { todoChecklist } = req.body;
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        const isAssigned = task.assignedTo.some(
            (userId) => userId.toString() === req.user._id.toString()
        );
        if (!isAssigned && req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Not authorized to update checklist" });
        }

        task.todoChecklist = todoChecklist; //replace with updated checklist
        // auto-update progress based on checklist completion
        const completedCount = task.todoChecklist.filter(
            (item) => item.completed
        ).length;
        const totalItems = task.todoChecklist.length;
        task.progress = totalItems > 0 ? Math.round((completedCount / totalItems * 100)) : 0;
        //auto-mark task as completed if all items are checked
        if (task.progress === 100) {
            task.status = "Completed";
        } else if (task.progress > 0) {
            task.status = "In Progress";
        } else {
            task.status = "Pending";
        }
        await task.save();
        const updatedTask = await Task.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
        );

        const io = req.app.get("io");
        const payload = {
            taskId: updatedTask._id,
            todoChecklist: updatedTask.todoChecklist,
            progress: updatedTask.progress,
            status: updatedTask.status,
            triggeredBy: req.user._id.toString()
        };
        updatedTask.assignedTo.forEach((user) => {
            io.to(user._id.toString()).emit("taskChecklistUpdated", payload);
        });
        io.to("admins").emit("taskChecklistUpdated", payload);

        res.json({ message: "Task checklist updated", task: updatedTask });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const getDashboardData = async (req, res) => {
    try {
        //Fetch Statistics
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: "Completed" });
        const pendingTasks = await Task.countDocuments({ status: "Pending" });
        const overdueTasks = await Task.countDocuments({
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() }
        });
        // Ensure all possible statuses are included
        const taskStatuses = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);
        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, ""); //Remove spaces for response keys
            acc[formattedKey] =
                taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks; // Add total count to taskDistribution

        //Ensure all priority levels are included
        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 },
                },
            },
        ]);
        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] =
                taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
            return acc;
        }, {});
        // Fetch recent 10 tasks
        const recentTasks = await Task.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select("title status priority dueDate createdAt");
        res.status(200).json({
            statistics: {
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,

        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;  //only fetch data for the logged-in user
        //fetch statistics for user-specific tasks
        const totalTasks = await Task.countDocuments({ assignedTo: userId });
        const completedTasks = await Task.countDocuments({ assignedTo: userId, status: "Completed" });
        const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: "Pending" });
        const overdueTasks = await Task.countDocuments({
            assignedTo: userId,
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() }
        });

        // Task Distribution by status
        const taskStatuses = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] =
                taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks;
        // task distribution by priority
        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]);
        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] =
                taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
            return acc;
        }, {});
        // fetch recent 10 tasks for the logged-in user
        const recentTasks = await Task.find({ assignedTo: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("title status priority dueDate createdAt");
        res.status(200).json({
            statistics: {
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getTasks, getTaskById, createTask, updateTask, deleteTask, updateTaskStatus, updateTaskCheckList, getDashboardData, getUserDashboardData
}