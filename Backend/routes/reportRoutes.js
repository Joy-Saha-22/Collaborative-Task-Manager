const express = require("express");
const { adminOnly, protect } = require("../middlewares/authMiddleware");
const { exportTasksReport, exportUsersReport } = require("../controllers/reportController");
const router = express.Router();

router.get("/export/tasks", protect, adminOnly, exportTasksReport);  //Export all tasks as excel or pdf
router.get("/export/users", protect, adminOnly,exportUsersReport);  //export user-task report


module.exports = router;