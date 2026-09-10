import Interview from "../models/Interview.js";
import ai from "../configs/ai.js";

// ─── helpers ───────────────────────────────────────────────────────────────

const DIFFICULTY_MAP = {
    fresher:      ["easy", "easy", "medium", "medium", "medium", "medium", "hard", "medium", "hard", "hard"],
    junior:       ["easy", "medium", "medium", "medium", "hard", "medium", "hard", "hard", "hard", "hard"],
    intermediate: ["medium", "medium", "hard", "hard", "hard", "hard", "hard", "hard", "hard", "hard"],
    senior:       ["hard", "hard", "hard", "hard", "hard", "hard", "hard", "hard", "hard", "hard"],
};

const TYPE_CONTEXT = {
    hr:            "behavioural and HR interview — focus on teamwork, communication, conflict resolution, career goals, and situational questions",
    technical:     "technical coding interview — focus on data structures, algorithms, system concepts, frameworks, and practical coding scenarios",
    "system-design": "system design interview — focus on scalability, architecture, databases, caching, load balancing, and real-world system design problems",
};

// ─── POST /api/interview/start ──────────────────────────────────────────────

export const startInterview = async (req, res) => {
    try {
        const { role, type, experience, resumeText } = req.body;
        const userId = req.userId;

        if (!role || !type || !experience) {
            return res.status(400).json({ message: "role, type and experience are required" });
        }

        const interview = await Interview.create({
            userId,
            role,
            type,
            experience,
            resumeText: resumeText || "",
            status: "in-progress",
            totalQuestions: 10,
            questions: [],
        });

        return res.status(201).json({ interviewId: interview._id });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// ─── POST /api/interview/question ──────────────────────────────────────────

export const generateQuestion = async (req, res) => {
    try {
        const { interviewId } = req.body;
        const userId = req.userId;

        const interview = await Interview.findOne({ _id: interviewId, userId });
        if (!interview) return res.status(404).json({ message: "Interview session not found" });
        if (interview.status === "completed") return res.status(400).json({ message: "Interview already completed" });

        const questionNumber  = interview.questions.length + 1;
        const difficulty      = DIFFICULTY_MAP[interview.experience]?.[questionNumber - 1] ?? "medium";
        const typeContext     = TYPE_CONTEXT[interview.type] ?? TYPE_CONTEXT.technical;

        // Build history so AI doesn't repeat topics
        const previousTopics = interview.questions.map(q => q.topic).filter(Boolean);

        // Determine adaptive difficulty from last answer score
        let adaptedDifficulty = difficulty;
        if (interview.questions.length >= 2) {
            const lastTwo = interview.questions.slice(-2);
            const avgScore = lastTwo.reduce((s, q) => s + (q.evaluation?.overall ?? 0), 0) / 2;
            if (avgScore >= 8.5)      adaptedDifficulty = "hard";
            else if (avgScore <= 4.5) adaptedDifficulty = "easy";
        }

        const resumeSection = interview.resumeText
            ? `\nCANDIDATE RESUME:\n${interview.resumeText.slice(0, 3000)}\n`
            : "";

        const systemInstruction = `You are a senior ${interview.role} interviewer conducting a ${typeContext}.
Generate ONE interview question at a time. Return ONLY valid JSON — no markdown, no backticks.`;

        const userPrompt = `Generate question #${questionNumber} of 10 for this ${interview.type} interview.

ROLE: ${interview.role}
EXPERIENCE LEVEL: ${interview.experience}
DIFFICULTY FOR THIS QUESTION: ${adaptedDifficulty}
${resumeSection}
PREVIOUSLY COVERED TOPICS (do NOT repeat): ${previousTopics.length ? previousTopics.join(", ") : "none yet"}

Rules:
- If resume is provided, make the question specific to the candidate's actual skills or projects when relevant.
- Do NOT ask multiple questions at once.
- Match difficulty to the experience level and the ${adaptedDifficulty} setting.
- For HR type: ask behavioural/situational questions only.
- For system-design type: ask architecture/design questions only.

Return ONLY this JSON:
{
  "question": "<the full interview question>",
  "topic": "<short topic label, e.g. Java, REST API, Teamwork>",
  "difficulty": "${adaptedDifficulty}",
  "hint": "<optional 1-sentence hint — leave empty string if not needed>"
}`;

        const response = await ai.models.generateContent({
            model: process.env.OPENAI_MODEL,
            contents: userPrompt,
            config: { systemInstruction, responseMimeType: "application/json" },
        });

        const parsed = JSON.parse(response.text.trim());

        // Push question stub into session (answer + evaluation filled later)
        interview.questions.push({
            question:   parsed.question,
            topic:      parsed.topic,
            difficulty: parsed.difficulty || adaptedDifficulty,
            answer:     "",
        });
        await interview.save();

        return res.status(200).json({
            questionNumber,
            totalQuestions: interview.totalQuestions,
            question:   parsed.question,
            topic:      parsed.topic,
            difficulty: parsed.difficulty || adaptedDifficulty,
            hint:       parsed.hint || "",
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// ─── POST /api/interview/evaluate ──────────────────────────────────────────

export const evaluateAnswer = async (req, res) => {
    try {
        const { interviewId, answer } = req.body;
        const userId = req.userId;

        const interview = await Interview.findOne({ _id: interviewId, userId });
        if (!interview) return res.status(404).json({ message: "Interview session not found" });

        const qIndex = interview.questions.length - 1;
        if (qIndex < 0) return res.status(400).json({ message: "No question to evaluate" });

        const currentQ = interview.questions[qIndex];
        const typeContext = TYPE_CONTEXT[interview.type] ?? TYPE_CONTEXT.technical;

        const systemInstruction = `You are evaluating a candidate's answer in a ${typeContext} for the role of ${interview.role}.
Score fairly and constructively. Return ONLY valid JSON — no markdown, no backticks.`;

        const userPrompt = `Evaluate this interview answer.

ROLE: ${interview.role}
EXPERIENCE LEVEL: ${interview.experience}
QUESTION: ${currentQ.question}
TOPIC: ${currentQ.topic}
DIFFICULTY: ${currentQ.difficulty}
CANDIDATE ANSWER: ${answer || "(no answer provided)"}

Score each dimension from 0–10. Return ONLY this JSON:
{
  "technicalAccuracy": <0-10>,
  "completeness": <0-10>,
  "clarity": <0-10>,
  "depth": <0-10>,
  "overall": <0-10 float, weighted average>,
  "strengths": ["<what candidate did well>"],
  "missing": ["<key concepts not mentioned>"],
  "improvement": "<1-2 sentence coaching tip>",
  "idealAnswer": "<concise model answer in 3-5 sentences>"
}

Be strict but fair. If answer is blank or off-topic, score accordingly.`;

        const response = await ai.models.generateContent({
            model: process.env.OPENAI_MODEL,
            contents: userPrompt,
            config: { systemInstruction, responseMimeType: "application/json" },
        });

        const evaluation = JSON.parse(response.text.trim());

        // Store answer and evaluation on the question
        interview.questions[qIndex].answer = answer || "";
        interview.questions[qIndex].evaluation = evaluation;
        await interview.save();

        const isLastQuestion = interview.questions.length >= interview.totalQuestions;

        return res.status(200).json({
            evaluation,
            isLastQuestion,
            questionsAnswered: interview.questions.length,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// ─── POST /api/interview/report ────────────────────────────────────────────

export const generateReport = async (req, res) => {
    try {
        const { interviewId } = req.body;
        const userId = req.userId;

        const interview = await Interview.findOne({ _id: interviewId, userId });
        if (!interview) return res.status(404).json({ message: "Interview session not found" });
        if (interview.questions.length === 0) return res.status(400).json({ message: "No questions answered yet" });

        // Compute aggregate scores from stored evaluations
        const answered = interview.questions.filter(q => q.evaluation?.overall !== undefined);
        const avg = (key) => answered.length
            ? Math.round(answered.reduce((s, q) => s + (q.evaluation[key] ?? 0), 0) / answered.length * 10) / 10
            : 0;

        const overallScore       = avg("overall");
        const technicalScore     = avg("technicalAccuracy");
        const communicationScore = avg("clarity");
        const problemSolvingScore= avg("depth");

        // Build a per-question summary for Gemini to produce coaching feedback
        const qSummary = interview.questions.map((q, i) =>
            `Q${i + 1} [${q.topic}/${q.difficulty}]: score=${q.evaluation?.overall ?? 0}/10`
        ).join("\n");

        const systemInstruction = `You are a senior hiring manager giving post-interview feedback.
Return ONLY valid JSON — no markdown, no backticks.`;

        const userPrompt = `Generate a final interview report summary.

ROLE: ${interview.role}
TYPE: ${interview.type}
EXPERIENCE: ${interview.experience}
TOTAL QUESTIONS: ${interview.questions.length}

PER-QUESTION SCORES:
${qSummary}

AGGREGATE SCORES:
Overall: ${overallScore}/10
Technical Accuracy: ${technicalScore}/10
Communication/Clarity: ${communicationScore}/10
Problem Solving/Depth: ${problemSolvingScore}/10

Return ONLY this JSON:
{
  "summary": "<3-4 sentence overall assessment of the candidate>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "recommendedTopics": ["<topic to study 1>", "<topic 2>", "<topic 3>", "<topic 4>", "<topic 5>"]
}`;

        const response = await ai.models.generateContent({
            model: process.env.OPENAI_MODEL,
            contents: userPrompt,
            config: { systemInstruction, responseMimeType: "application/json" },
        });

        const aiReport = JSON.parse(response.text.trim());

        // Save final report to DB
        interview.status = "completed";
        interview.finalReport = {
            overallScore:       Math.round(overallScore * 10),   // convert to /100
            technicalScore:     Math.round(technicalScore * 10),
            communicationScore: Math.round(communicationScore * 10),
            problemSolvingScore:Math.round(problemSolvingScore * 10),
            ...aiReport,
        };
        await interview.save();

        return res.status(200).json({ report: interview.finalReport, questions: interview.questions });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// ─── GET /api/interview/history ────────────────────────────────────────────

export const getInterviewHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const sessions = await Interview.find({ userId })
            .select("role type experience status totalQuestions finalReport.overallScore createdAt")
            .sort({ createdAt: -1 })
            .limit(10);
        return res.status(200).json({ sessions });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
