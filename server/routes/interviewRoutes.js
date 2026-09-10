import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
    startInterview,
    generateQuestion,
    evaluateAnswer,
    generateReport,
    getInterviewHistory,
} from "../controllers/interviewController.js";

const interviewRouter = express.Router();

interviewRouter.post("/start",    protect, startInterview);
interviewRouter.post("/question", protect, generateQuestion);
interviewRouter.post("/evaluate", protect, evaluateAnswer);
interviewRouter.post("/report",   protect, generateReport);
interviewRouter.get("/history",   protect, getInterviewHistory);

export default interviewRouter;
