// hooks/useTaskSocket.js
import { useContext, useEffect } from "react";
import toast from "react-hot-toast";
import socket from "../utils/socket";
import { UserContext } from "../context/userContext";

export function useTaskSocket({
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskStatusUpdated,
  onTaskChecklistUpdated,
  showToasts = true,
}) {
  const { user } = useContext(UserContext);

  useEffect(() => {
    const isOwnAction = (payload) => user && payload.triggeredBy === user._id;

    const handleTaskCreated = (task) => {
      if (showToasts && !isOwnAction(task)) toast.success(`New task created: "${task.title}"`);
      onTaskCreated?.(task);
    };

    const handleTaskUpdated = (task) => {
      if (showToasts && !isOwnAction(task)) toast(`Task updated: "${task.title}"`, { icon: "✏️" });
      onTaskUpdated?.(task);
    };

    const handleTaskDeleted = (payload) => {
      if (showToasts && !isOwnAction(payload)) toast(`A task was deleted`, { icon: "🗑️" });
      onTaskDeleted?.(payload);
    };

    const handleTaskStatusUpdated = (payload) => {
      if (showToasts && !isOwnAction(payload)) toast(`Task status changed to "${payload.status}"`, { icon: "🔄" });
      onTaskStatusUpdated?.(payload);
    };

    const handleTaskChecklistUpdated = (payload) => {
      if (showToasts && !isOwnAction(payload)) toast(`Task checklist updated`, { icon: "✅" });
      onTaskChecklistUpdated?.(payload);
    };

    if (onTaskCreated) socket.on("taskCreated", handleTaskCreated);
    if (onTaskUpdated) socket.on("taskUpdated", handleTaskUpdated);
    if (onTaskDeleted) socket.on("taskDeleted", handleTaskDeleted);
    if (onTaskStatusUpdated) socket.on("taskStatusUpdated", handleTaskStatusUpdated);
    if (onTaskChecklistUpdated) socket.on("taskChecklistUpdated", handleTaskChecklistUpdated);

    return () => {
      if (onTaskCreated) socket.off("taskCreated", handleTaskCreated);
      if (onTaskUpdated) socket.off("taskUpdated", handleTaskUpdated);
      if (onTaskDeleted) socket.off("taskDeleted", handleTaskDeleted);
      if (onTaskStatusUpdated) socket.off("taskStatusUpdated", handleTaskStatusUpdated);
      if (onTaskChecklistUpdated) socket.off("taskChecklistUpdated", handleTaskChecklistUpdated);
    };
  }, [onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskStatusUpdated, onTaskChecklistUpdated, showToasts, user]);
}