const express = require("express");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
require("dotenv").config();
const cors = require("cors");
const path = require("path");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reportRoutes = require("./routes/reportRoutes");
const User = require("./models/User");
const { authLimiter, generalLimiter } = require("./middlewares/rateLimiter");
const app = express();
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

connectDB();
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", generalLimiter, userRoutes);
app.use("/api/tasks", generalLimiter, taskRoutes);
app.use("/api/reports", generalLimiter, reportRoutes);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
    }
});

io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) return next(new Error("User not found"));

        socket.userId = user._id.toString();
        socket.role = user.role;
        next();
    } catch (err) {
        next(new Error("Invalid token"));
    }
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id, "| userId:", socket.userId, "| role:", socket.role);
        socket.join(socket.userId);
        if (socket.role === "admin") socket.join("admins");
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
});
app.set("io", io);
const PORT = process.env.PORT || 8000;
server.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);