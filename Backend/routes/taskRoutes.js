const express = require("express");
const {protect, adminOnly} = require("../middlewares/authMiddleware");
const { getDashboardData, getUserDashboardData, getTasks, getTaskById, createTask, updateTask, deleteTask, updateTaskStatus, updateTaskCheckList } = require("../controllers/taskController");

const router = express.Router();

router.get("/dashboard-data", protect, getDashboardData);  
router.get("/user-dashboard-data", protect, getUserDashboardData);  
router.get("/", protect, getTasks); // Get all tasks (admin : all, user : assigned) 
router.get("/:id", protect, getTaskById); //get task by id
router.post("/", protect, adminOnly, createTask); //create a task(admin only)
router.put("/:id", protect, updateTask); //update task details
router.delete("/:id", protect, adminOnly, deleteTask); //delete a task (admin only)
router.put("/:id/status", protect, updateTaskStatus); //update task status  
router.put("/:id/todo", protect, updateTaskCheckList); //update task checklist

module.exports = router;