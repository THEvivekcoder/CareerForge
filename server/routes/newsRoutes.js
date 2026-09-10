import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { getNews } from "../controllers/newsController.js";

const newsRouter = express.Router();

// GET /api/news?category=technology&q=keyword
newsRouter.get("/", protect, getNews);

export default newsRouter;
