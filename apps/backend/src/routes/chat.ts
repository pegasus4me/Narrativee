import { Router, Request, Response } from "express";
import OpenAI from "openai";
import multer from "multer";
import { parse as parseCSV } from "papaparse";
import { toCSVString } from "../utils/tools";
import { verifyAuth, AuthRequest } from "../middleware/auth";
import { getChatConfig } from "../config/llm.config";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Chat endpoint - requires authentication
router.post("/", verifyAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Verify user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "Please log in to use the chat feature",
      });
    }

    const { question, reportContent, reportId, requestType } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: "Question is required",
      });
    }

    console.log("💬 Chat request received:", {
      question: question.substring(0, 100),
      reportId,
      requestType,
      reportContentLength: reportContent?.length || 0,
    });

    // Get LLM config based on request type
    const llmConfig = getChatConfig(requestType === "question" ? "question" : "edit");

    console.log(`🤖 Using ${llmConfig.model} for ${requestType}`);

    // Get API key from environment
    const apiKey = process.env[llmConfig.apiKeyEnv];
    if (!apiKey) {
      throw new Error(`${llmConfig.apiKeyEnv} not found in environment variables`);
    }

    // Initialize OpenAI client with config
    const client = new OpenAI({
      apiKey,
      baseURL: llmConfig.baseURL,
      ...(llmConfig.provider === 'openrouter' && {
        defaultHeaders: {
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3000",
          "X-Title": "Narrativee",
        },
      }),
    });

    // Build context-aware prompt based on request type
    let systemPrompt = "";
    let userPrompt = question;

    if (requestType === "edit") {
      // For edit requests, generate new content
      systemPrompt = `You are an AI assistant helping users expand their data analysis reports.

      The user wants to ADD NEW CONTENT to their existing report. Generate ONLY the new markdown content that should be added - do not rewrite the entire report.

      **Current Report:**
      ${reportContent || "No report content available."}

      **Your Task:**
      - Generate NEW markdown content based on the user's request
      - Use appropriate markdown formatting (# ## ### for headings, **bold**, *italic*, > for quotes)
      - Make it consistent with the existing report's style and tone
      - Output ONLY the new content to be added, nothing else
      - Keep it concise and data-focused

      **CHART SYNTAX (IMPORTANT):**
      If adding charts, use this EXACT format:

      \`\`\`chart:line
      title: Descriptive Title
      x: column_name
      y: column_name
      data: [
        {"column_name": "value1", "column_name": 123},
        {"column_name": "value2", "column_name": 456}
      ]
      \`\`\`

      Supported chart types: chart:line, chart:bar, chart:pie, chart:scatter
      - Use column names from the report data
      - Include actual data array (10-15 points max)
      - Format MUST be \`\`\`chart:TYPE not \`\`\`chart TYPE:

      **User Request:**
      ${question}`;

      userPrompt = "Generate the new markdown content as requested above.";
    } else {
      // For questions, provide answers
      systemPrompt = `You are an AI assistant helping users understand their data analysis reports.

      You have access to the user's report content below. Use this content to answer their questions accurately and helpfully.

      **Guidelines:**
      - Reference specific data, insights, and findings from the report
      - Be concise but thorough
      - If the user asks about something not in the report, politely say so
      - Provide actionable insights when appropriate
      - Use a friendly, professional tone

      **Report Content:**
      ${reportContent || "No report content available."}`;
    }

    console.log("🤖 Calling LLM for chat response...");

    // Call LLM with appropriate settings
    const messages: any[] = [
      {
        role: "system",
        content: llmConfig.provider === 'xai'
          ? systemPrompt // Grok uses simple string
          : [
              {
                type: "text",
                text: systemPrompt,
                cache_control: { type: "ephemeral" }, // Claude caching
              },
            ],
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    const completion = await client.chat.completions.create({
      messages,
      model: llmConfig.model,
      temperature: llmConfig.temperature,
      max_tokens: llmConfig.maxTokens,
    });

    console.log("📦 API Response:", JSON.stringify(completion, null, 2));

    if (!completion || !completion.choices || completion.choices.length === 0) {
      console.error("❌ Invalid API response structure:", completion);
      throw new Error("Invalid response from AI - no choices returned");
    }

    const answer = completion.choices[0]?.message?.content;

    if (!answer) {
      console.error("❌ No content in message:", completion.choices[0]);
      throw new Error("No response content from AI");
    }

    // Log token usage
    const usage = completion.usage;
    if (usage) {
      console.log("💰 Token Usage:", {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        cachedTokens: (usage as any).prompt_tokens_details?.cached_tokens || 0,
      });

      // Calculate cost savings from caching
      const cachedTokens =
        (usage as any).prompt_tokens_details?.cached_tokens || 0;
      if (cachedTokens > 0) {
        const savingsPercent = (
          (cachedTokens / usage.prompt_tokens) *
          100
        ).toFixed(1);
        console.log(
          `📊 Cache Performance: ${cachedTokens} tokens cached (${savingsPercent}% savings)`
        );
      }
    }

    console.log("✅ Chat response generated");

    const response: any = {
      success: true,
      answer: answer.trim(),
    };

    // If edit request, also include the generated content separately
    if (requestType === "edit") {
      response.generatedContent = answer.trim();
    }

    return res.json(response);
  } catch (error: any) {
    console.error("❌ Chat error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process chat request",
    });
  }
});

// Regenerate endpoint - handle CSV upload and generate new content (requires auth)
router.post(
  "/regenerate",
  verifyAuth,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      // Verify user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
          message: "Please log in to use the regenerate feature",
        });
      }

      const { question, reportContent, reportId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "CSV file is required",
        });
      }

      console.log("📤 Regenerate request received:", {
        filename: file.originalname,
        question: question?.substring(0, 100),
      });

      // Parse CSV
      const csvText = file.buffer.toString("utf-8");
      const parsed = parseCSV(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid CSV format",
        });
      }

      const csvData = parsed.data;
      const columns = csvData.length > 0 ? Object.keys(csvData[0]) : [];

      console.log(
        `📊 CSV parsed: ${csvData.length} rows, ${columns.length} columns`
      );

      // Get LLM config for regeneration
      const llmConfig = getChatConfig("regenerate");

      const apiKey = process.env[llmConfig.apiKeyEnv];
      if (!apiKey) {
        throw new Error(`${llmConfig.apiKeyEnv} not found`);
      }

      const openai = new OpenAI({
        apiKey,
        baseURL: llmConfig.baseURL,
        defaultHeaders: {
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3000",
          "X-Title": "Narrativee",
        },
      });

      // Build prompt for generating new content based on new data
      const dataLimit = 500;
      const dataToAnalyze =
        csvData.length > dataLimit ? csvData.slice(0, dataLimit) : csvData;

      const systemPrompt = `You are a data analyst generating NEW insights based on newly uploaded data.

**Existing Report:**
${reportContent || "No previous report"}

**New Data Uploaded:**
File: ${file.originalname}
Rows: ${csvData.length}
Columns: ${columns.join(", ")}

**CSV Data:**
${toCSVString(dataToAnalyze)}

**User's Request:**
${question || "Generate insights from this new data"}

**Your Task:**
- Analyze the new data
- Generate a NEW SECTION for the report in markdown format
- Focus on insights, trends, and patterns in the new data
- Compare with existing report if relevant
- Use markdown formatting (##, ###, **bold**, *italic*, > quotes)
- Keep it concise (300-500 words)
- Output ONLY the new markdown section

**CHART SYNTAX (IMPORTANT):**
If adding charts, use this EXACT format:

\`\`\`chart:line
title: Descriptive Title
x: ${columns[0] || "column_name"}
y: ${columns[1] || "column_name"}
data: [
  {"${columns[0] || "col1"}": "value1", "${columns[1] || "col2"}": 123},
  {"${columns[0] || "col1"}": "value2", "${columns[1] || "col2"}": 456}
]
\`\`\`

Supported types: chart:line, chart:bar, chart:pie, chart:scatter
Available columns: ${columns.join(", ")}
Format MUST be \`\`\`chart:TYPE not \`\`\`chart TYPE:`;

      console.log("🤖 Generating new content from uploaded data...");

      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: systemPrompt,
                cache_control: { type: "ephemeral" }
              }
            ] as any,
          },
          {
            role: "user",
            content:
              "Generate the new report section based on the uploaded data.",
          },
        ],
        model: llmConfig.model,
        temperature: llmConfig.temperature,
        max_tokens: llmConfig.maxTokens,
      });

      const newContent = completion.choices[0]?.message?.content;

      if (!newContent) {
        throw new Error("No content generated");
      }

      // Log token usage
      const usage = completion.usage;
      if (usage) {
        console.log("💰 Token Usage (Regenerate):", {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          cachedTokens:
            (usage as any).prompt_tokens_details?.cached_tokens || 0,
        });

        // Calculate cost savings from caching
        const cachedTokens =
          (usage as any).prompt_tokens_details?.cached_tokens || 0;
        if (cachedTokens > 0) {
          const savingsPercent = (
            (cachedTokens / usage.prompt_tokens) *
            100
          ).toFixed(1);
          console.log(
            `📊 Cache Performance: ${cachedTokens} tokens cached (${savingsPercent}% savings)`
          );
        }
      }

      console.log("✅ New content generated from CSV");

      return res.json({
        success: true,
        message: `Generated new insights from ${file.originalname}`,
        newContent: newContent.trim(),
        answer: `I've analyzed ${file.originalname} (${csvData.length} rows) and added a new section to your report with key insights.`,
      });
    } catch (error: any) {
      console.error("❌ Regenerate error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to process file upload",
      });
    }
  }
);

export default router;
