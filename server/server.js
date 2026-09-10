import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import resumeRouter from "./routes/resumeRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import newsRouter from "./routes/newsRoutes.js";
import interviewRouter from "./routes/interviewRoutes.js";

const app = express();
const PORT = process.env.PORT || 3001;

await connectDB();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => res.send("Server is live..."));

app.use("/api/users", userRouter);
app.use("/api/resumes", resumeRouter);
app.use("/api/ai", aiRouter);
app.use("/api/news", newsRouter);
app.use("/api/interview", interviewRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
