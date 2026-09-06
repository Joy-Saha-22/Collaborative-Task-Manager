// src/utils/socket.js
import { io } from "socket.io-client";
import { BASE_URL } from "./apiPaths";

const socket = io(BASE_URL, {
  auth: {
    token: localStorage.getItem("token"),
  },
  autoConnect: false, // don't connect until we explicitly say so
});

export const connectSocket = () => {
  socket.auth.token = localStorage.getItem("token"); // re-read the latest token
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export default socket;