import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import TaskStatusTabs from "../../components/layouts/TaskStatusTabs";
import TaskCard from "../../components/Cards/TaskCard";
import { useTaskSocket } from "../../hooks/useTaskSocket";

const MyTasks = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const getAllTasks = useCallback(async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
        params: {
          status: filterStatus === "All" ? "" : filterStatus,
          page: currentPage,
          limit: 9,
        },
      });
      setAllTasks(response.data?.tasks?.length > 0 ? response.data.tasks : []);

      const statusSummary = response.data?.statusSummary || {};
      const statusArray = [
        { label: "All", count: statusSummary.all || 0 },
        { label: "Pending", count: statusSummary.pendingTasks || 0 },
        { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
        { label: "Completed", count: statusSummary.completedTasks || 0 },
      ];
      setTabs(statusArray);

      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error Fetching Users: ", error);
    }
  }, [filterStatus, currentPage]);

  const handleClick = (taskId) => {
    navigate(`/user/task-details/${taskId}`);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  useEffect(() => {
    getAllTasks();
    return () => { };
  }, [getAllTasks]);

  useTaskSocket({
    onTaskCreated: getAllTasks,
    onTaskUpdated: getAllTasks,
    onTaskDeleted: getAllTasks,
    onTaskStatusUpdated: getAllTasks,
    onTaskChecklistUpdated: getAllTasks,
  });

  return (
    <DashboardLayout activeMenu="My Tasks">
      <div className="my-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <h2 className="text-xl md:text-xl font-medium">My Tasks</h2>
          {tabs?.[0]?.count > 0 && (
            <TaskStatusTabs tabs={tabs} activeTab={filterStatus} setActiveTab={setFilterStatus} />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {allTasks?.map((item) => (
            <TaskCard
              key={item._id}
              title={item.title}
              description={item.description}
              priority={item.priority}
              status={item.status}
              progress={item.progress}
              createdAt={item.createdAt}
              dueDate={item.dueDate}
              assignedTo={item.assignedTo?.map((item) => item.profileImageUrl)}
              attachmentCount={item.attachments?.length || 0}
              completedTodoCount={item.completedTodoCount || 0}
              todoChecklist={item.todoChecklist || []}
              onClick={() => {
                handleClick(item._id);
              }}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <LuChevronLeft /> Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <LuChevronRight />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
export default MyTasks;