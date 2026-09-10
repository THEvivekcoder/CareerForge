import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
    question:   { type: String, required: true },
    topic:      { type: String, default: "" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    answer:     { type: String, default: "" },
    evaluation: {
        technicalAccuracy: { type: Number, default: 0 },
        completeness:      { type: Number, default: 0 },
        clarity:           { type: Number, default: 0 },
        depth:             { type: Number, default: 0 },
        overall:           { type: Number, default: 0 },
        strengths:         [{ type: String }],
        missing:           [{ type: String }],
        improvement:       { type: String, default: "" },
        idealAnswer:       { type: String, default: "" },
    },
}, { _id: false });

const InterviewSchema = new mongoose.Schema({
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role:           { type: String, required: true },
    type:           { type: String, enum: ["hr", "technical", "system-design"], default: "technical" },
    experience:     { type: String, enum: ["fresher", "junior", "intermediate", "senior"], default: "fresher" },
    resumeText:     { type: String, default: "" },
    status:         { type: String, enum: ["in-progress", "completed"], default: "in-progress" },
    totalQuestions: { type: Number, default: 10 },
    questions:      [QuestionSchema],
    finalReport: {
        overallScore:      { type: Number, default: 0 },
        technicalScore:    { type: Number, default: 0 },
        communicationScore:{ type: Number, default: 0 },
        problemSolvingScore:{ type: Number, default: 0 },
        strengths:         [{ type: String }],
        weaknesses:        [{ type: String }],
        recommendedTopics: [{ type: String }],
        summary:           { type: String, default: "" },
    },
}, { timestamps: true });

const Interview = mongoose.model("Interview", InterviewSchema);
export default Interview;
