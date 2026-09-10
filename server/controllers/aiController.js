import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";

// controller for enhancing a resume's professional summary
// POST: /api/ai/enhance-pro-sum
export const enhanceProfessionalSummary = async (req, res) => {
    try {
        const { userContent } = req.body;

        if (!userContent) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const response = await ai.models.generateContent({
            model: process.env.OPENAI_MODEL,
            contents: userContent,
            config: {
                systemInstruction: "You are an expert in resume writing. Your task is to enhance the professional summary of a resume. The summary should be 1-2 sentences also highlighting key skills, experience, and career objectives. Make it compelling and ATS-friendly. and only return text no options or anything else.",
            },
        });

        const enhancedContent = response.text;
        return res.status(200).json({ enhancedContent });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// controller for enhancing a resume's job description
// POST: /api/ai/enhance-job-desc
export const enhanceJobDescription = async (req, res) => {
    try {
        const { userContent } = req.body;

        if (!userContent) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const response = await ai.models.generateContent({
            model: process.env.OPENAI_MODEL,
            contents: userContent,
            config: {
                systemInstruction: "You are an expert in resume writing. Your task is to enhance the job description of a resume. The job description should be only in 1-2 sentence also highlighting key responsibilities and achievements. Use action verbs and quantifiable results where possible. Make it ATS-friendly. and only return text no options or anything else.",
            },
        });

        const enhancedContent = response.text;
        return res.status(200).json({ enhancedContent });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// controller for uploading a resume to the database
// POST: /api/ai/upload-resume
export const uploadResume = async (req, res) => {
    try {
        const { resumeText, title } = req.body;
        const userId = req.userId;

        if (!resumeText) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const systemInstruction = "You are an expert AI Agent to extract data from resume.";

        const userPrompt = `extract data from this resume: ${resumeText}
        
        Provide data in the following JSON format with no additional text before or after:

        {
        professional_summary: { type: String, default: '' },
        skills: [{ type: String }],
        personal_info: {
            image: {type: String, default: '' },
            full_name: {type: String, default: '' },
            profession: {type: String, default: '' },
            email: {type: String, default: '' },
            phone: {type: String, default: '' },
            location: {type: String, default: '' },
            linkedin: {type: String, default: '' },
            website: {type: String, default: '' },
        },
        experience: [
            {
                company: { type: String },
                position: { type: String },
                start_date: { type: String },
                end_date: { type: String },
                description: { type: String },
                is_current: { type: Boolean },
            }
        ],
        project: [
            {
                name: { type: String },
                type: { type: String },
                description: { type: String },
            }
        ],
        education: [
            {
                institution: { type: String },
                degree: { type: String },
                field: { type: String },
                graduation_date: { type: String },
                gpa: { type: String },
            }
        ],          
        }
        `;

        const response = await ai.models.generateContent({
            model: process.env.OPENAI_MODEL,
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const extractedData = response.text;
        const parsedData = JSON.parse(extractedData);
        const newResume = await Resume.create({ userId, title, ...parsedData });

        res.json({ resumeId: newResume._id });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// controller for ATS resume check against a job description
// POST: /api/ai/ats-check
export const atsCheck = async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;

        if (!resumeText || !jobDescription) {
            return res.status(400).json({ message: 'Resume text and job description are required' });
        }

        const systemInstruction = `You are an expert ATS (Applicant Tracking System) resume analyzer with deep knowledge of recruitment and hiring practices.
Analyze the provided resume against the job description and return ONLY a valid JSON object — no markdown, no backticks, no extra text.`;

        const userPrompt = `Analyze this resume against the job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY a valid JSON object in this exact structure:
{
  "atsScore": <number 0-100>,
  "scoreBreakdown": {
    "skillMatch": <number 0-100>,
    "keywordMatch": <number 0-100>,
    "experienceMatch": <number 0-100>,
    "educationMatch": <number 0-100>,
    "formatScore": <number 0-100>
  },
  "summary": "<2-3 sentence overall assessment>",
  "matchedKeywords": ["<keyword1>", "<keyword2>"],
  "missingKeywords": ["<keyword1>", "<keyword2>"],
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "suggestions": ["<actionable suggestion1>", "<actionable suggestion2>", "<actionable suggestion3>"]
}

IMPORTANT: Only flag a skill or technology as missing if it is explicitly required or strongly preferred in the job description. Only suggest adding a skill if the candidate might genuinely have it based on their background.`;

        const response = await ai.models.generateContent({
            model: process.env.OPENAI_MODEL,
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const rawText = response.text.trim();
        const result = JSON.parse(rawText);

        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// controller for AI job role recommendations based on resume
// POST: /api/ai/recommend-roles
export const recommendRoles = async (req, res) => {
    try {
        const { resumeText } = req.body;

        if (!resumeText) {
            return res.status(400).json({ message: 'Resume text is required' });
        }

        const systemInstruction = `You are an expert career advisor and resume analyst. Analyze resumes and recommend the most suitable technology job roles.
Return ONLY a valid JSON object — no markdown, no backticks, no extra text.`;

        const userPrompt = `Analyze this resume and identify the 5 most suitable technology job roles for this candidate.

RESUME:
${resumeText}

Consider:
- Technical skills and technologies mentioned
- Project types and complexity
- Work experience and responsibilities
- Education background
- Domain knowledge
- Seniority level indicators

Return ONLY a valid JSON object in this exact structure:
{
  "candidateSummary": "<2-3 sentence summary of the candidate's profile>",
  "experienceLevel": "<Fresher | Junior | Mid-level | Senior | Lead>",
  "roles": [
    {
      "title": "<Job Title>",
      "match": <number 0-100>,
      "reason": "<2 sentence explanation of why this role fits>",
      "matchedSkills": ["<skill1>", "<skill2>"],
      "skillGaps": ["<gap1>", "<gap2>"],
      "topSkillsToLearn": ["<skill1>", "<skill2>"]
    }
  ]
}

Rank roles from highest to lowest match percentage. Be realistic and grounded in what the resume actually shows.`;

        const response = await ai.models.generateContent({
            model: process.env.OPENAI_MODEL,
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const rawText = response.text.trim();
        const result = JSON.parse(rawText);

        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// controller for AI analysis of a news article's career/market impact
// POST: /api/ai/analyze-news
export const analyzeNews = async (req, res) => {
    try {
        const { title, description, content } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Article title is required' });
        }

        const articleText = [title, description, content].filter(Boolean).join("\n\n");

        const systemInstruction = `You are an expert technology industry and career analyst. 
Analyze news articles and return structured JSON about their potential impact on the tech industry, job market, and careers.
Return ONLY valid JSON — no markdown, no backticks, no extra text.
Never present analysis as guaranteed facts. Frame all impacts as AI-estimated scenarios based on available evidence.`;

        const userPrompt = `Analyze this tech/business news article and estimate its potential impact.

ARTICLE:
${articleText}

Return ONLY a valid JSON object in this exact structure:
{
  "summary": "<2-3 sentence plain-English summary of what happened>",
  "whyItMatters": "<2-3 sentence explanation of why this is significant for the tech industry>",
  "impactScores": {
    "marketImpact": "<Low | Medium | High | Very High>",
    "technologyImpact": "<Low | Medium | High | Very High>",
    "jobImpact": "<Low | Medium | High | Very High>",
    "startupImpact": "<Low | Medium | High | Very High>"
  },
  "jobsGrowing": ["<role1>", "<role2>", "<role3>"],
  "jobsAtRisk": ["<role1>", "<role2>"],
  "skillsInDemand": ["<skill1>", "<skill2>", "<skill3>"],
  "keyTakeaway": "<1 sentence career advice for tech professionals based on this news>",
  "disclaimer": "This is an AI-generated scenario analysis based on the article content. It is not a confirmed forecast."
}

Be realistic and grounded. If the article does not clearly imply job impact, return empty arrays for jobsGrowing and jobsAtRisk.`;

        const response = await ai.models.generateContent({
            model: process.env.OPENAI_MODEL,
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            },
        });

        const result = JSON.parse(response.text.trim());
        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// controller for salary prediction from resume text
// POST: /api/ai/salary-predict
export const salaryPredict = async (req, res) => {
    try {
        const { resumeText } = req.body;
        if (!resumeText) {
            return res.status(400).json({ message: 'Resume text is required' });
        }

        // ── Step 1: extract structured candidate profile ──────────────────
        const extractSystem = `You are an expert resume parser. Extract structured candidate information from resumes.
Return ONLY valid JSON — no markdown, no backticks, no extra text.`;

        const extractPrompt = `Extract a structured candidate profile from the resume below.

RESUME:
${resumeText.slice(0, 4000)}

Return ONLY this JSON:
{
  "fullName": "<name or empty string>",
  "jobRole": "<primary job role / target role>",
  "yearsOfExperience": <number — 0 if fresher>,
  "experienceLevel": "<Fresher | Junior | Mid-level | Senior | Lead>",
  "skills": ["<skill1>", "<skill2>"],
  "topSkills": ["<3-5 strongest or most in-demand skills from the resume>"],
  "education": "<highest degree>",
  "location": "<city or country — empty string if not found>",
  "certifications": ["<cert1>"],
  "domains": ["<domain1 e.g. Web Development, Data Science, DevOps>"]
}`;

        const extractResp = await ai.models.generateContent({
            model: process.env.OPENAI_MODEL,
            contents: extractPrompt,
            config: { systemInstruction: extractSystem, responseMimeType: "application/json" },
        });
        const profile = JSON.parse(extractResp.text.trim());

        // ── Step 2: salary intelligence ───────────────────────────────────
        const salarySystem = `You are a senior compensation analyst with deep knowledge of technology job markets in India and globally.
Provide realistic, data-grounded salary estimates. Return ONLY valid JSON — no markdown, no backticks.`;

        const salaryPrompt = `Estimate the salary range for this candidate based on real Indian IT job market data (2024-2025).

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

Provide a realistic, nuanced salary analysis. Consider:
- Indian IT market benchmarks (Bangalore, Hyderabad, Pune, Delhi, Mumbai, remote)
- Years of experience and seniority
- Specific skills and their current market demand
- Education background
- Demand premium for top skills (e.g. AI/ML, cloud, system design)

Return ONLY this JSON:
{
  "salaryRange": {
    "min": <number in LPA e.g. 8>,
    "max": <number in LPA e.g. 12>,
    "currency": "INR",
    "unit": "LPA"
  },
  "medianEstimate": <number in LPA>,
  "confidenceScore": <number 0-100>,
  "marketDemand": "<Low | Medium | High | Very High>",
  "locationImpact": {
    "label": "<e.g. Bangalore Premium | Tier-2 City | Remote-friendly>",
    "adjustment": "<e.g. +15% vs national average>"
  },
  "skillImpact": [
    { "skill": "<skill>", "impact": "<Low | Medium | High | Very High>", "premiumNote": "<1 short sentence>" }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "skillsToImprove": [
    { "skill": "<skill>", "reason": "<why it increases salary>", "potentialUplift": "<e.g. +1-2 LPA>" }
  ],
  "growthRoadmap": [
    { "timeframe": "0-3 months",  "action": "<specific action>", "impact": "<expected outcome>" },
    { "timeframe": "3-6 months",  "action": "<specific action>", "impact": "<expected outcome>" },
    { "timeframe": "6-12 months", "action": "<specific action>", "impact": "<expected outcome>" }
  ],
  "targetSalaryAt12Months": <number in LPA — realistic target if roadmap followed>,
  "marketInsight": "<2-3 sentence paragraph on current market conditions for this role/skill set>",
  "disclaimer": "Salary estimates are based on Indian IT market data and AI analysis. Actual offers vary by company, negotiation, and market conditions."
}`;

        const salaryResp = await ai.models.generateContent({
            model: process.env.OPENAI_MODEL,
            contents: salaryPrompt,
            config: { systemInstruction: salarySystem, responseMimeType: "application/json" },
        });
        const salaryData = JSON.parse(salaryResp.text.trim());

        return res.status(200).json({ profile, ...salaryData });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
