import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { enhanceJobDescription, enhanceProfessionalSummary, uploadResume, atsCheck, recommendRoles, analyzeNews, salaryPredict } from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.post('/enhance-pro-sum', protect, enhanceProfessionalSummary)
aiRouter.post('/enhance-job-desc', protect, enhanceJobDescription)
aiRouter.post('/upload-resume', protect, uploadResume)
aiRouter.post('/ats-check', protect, atsCheck)
aiRouter.post('/recommend-roles', protect, recommendRoles)
aiRouter.post('/analyze-news', protect, analyzeNews)
aiRouter.post('/salary-predict', protect, salaryPredict)

export default aiRouter