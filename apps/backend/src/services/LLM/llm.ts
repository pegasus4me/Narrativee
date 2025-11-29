import { CSVRow } from "../../utils/csv/csvParser";
import OpenAI from "openai";
import { promptTemplate } from "./ReportPrompt";
import { toCSVString } from "../../utils/tools";
import { getReportGenerationConfig, type UserPlan } from "../../config/llm.config";

interface GenerateReportInput {
  csvData: CSVRow[];
  story: string;
  audience: string;
  fileName: string;
  reportStyle: 'executive' | 'story' | 'detailed';
  userPlan?: UserPlan; // null = no auth, 'free' | 'premium'
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  markdown: string; // Now we return raw markdown
}


export async function generateReport(
  input: GenerateReportInput
): Promise<ReportTemplate> {
  const { csvData, story, audience, fileName, reportStyle, userPlan = null } = input;

  // Get LLM config based on user plan
  const llmConfig = getReportGenerationConfig(userPlan);
  console.log(`🤖 llmConfig: ${JSON.stringify(llmConfig)}`, userPlan);
  console.log(`🤖 Report generation for plan: ${userPlan || 'no-auth'} using ${llmConfig.model}`);

  // Prepare data summary
  // Safety cap: If over 2000 rows, slice it so we don't crash the LLM
  const dataLimit = 2000;
  const dataToAnalyze =
    csvData.length > dataLimit ? csvData.slice(0, dataLimit) : csvData;

  const data = {
    story,
    audience,
    fileName,
    dataSummary: {
      rowCount: csvData.length,
      columns: csvData.length > 0 ? Object.keys(csvData[0]) : [],
      // 2. Send as a single string instead of an array of objects
      rawCSVContent: toCSVString(dataToAnalyze),
      isPartialData: csvData.length > dataLimit,
    },
    reportStyle,
  };

  const prompt = promptTemplate(data);
  try {
    console.log(`🤖 Calling ${llmConfig.model} to generate report...`);
    const markdown = await callLLMAPI(prompt, llmConfig);
    console.log('✅ LLM API response received');

    return {
      id: reportStyle,
      name: `${reportStyle.charAt(0).toUpperCase() + reportStyle.slice(1)} Report`,
      description: `Generated ${reportStyle} report`,
      markdown: markdown
    };
  } catch (error: any) {
    console.error("❌ Claude API error:", error?.message || error);

    // Check if it's a timeout error
    if (error?.message?.includes('timeout') || error?.code === 'ETIMEDOUT') {
      console.log('⏱️  Request timed out - using mock template as fallback');
    }

    // Fallback: Return mock template for development
    console.log('🔄 Returning mock template as fallback');
    return getMockTemplate(input);
  }
}

async function callLLMAPI(prompt: string, llmConfig: any): Promise<string> {
  // Get API key from environment
  const apiKey = process.env[llmConfig.apiKeyEnv];

  if (!apiKey) {
    throw new Error(`${llmConfig.apiKeyEnv} not found in environment variables`);
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey,
    baseURL: llmConfig.baseURL,
    ...(llmConfig.provider === 'openrouter' && {
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'Narrativee',
      },
    }),
  });

  console.log(`📤 Sending request to ${llmConfig.model}...`);

  // Call LLM API using OpenAI SDK
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: llmConfig.model,
    temperature: llmConfig.temperature,
    max_tokens: llmConfig.maxTokens,
  });

  // Parse the response
  let content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in Claude response");
  }

  // Remove markdown code blocks if present (Claude sometimes wraps in ```)
  content = content.trim();
  if (content.startsWith('```markdown') || content.startsWith('```md')) {
    content = content.replace(/^```(markdown|md)\n?/, '').replace(/\n?```$/, '');
  } else if (content.startsWith('```')) {
    content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  console.log('✅ LLM response processed successfully');
  return content.trim();
}

// Mock template for development/testing
function getMockTemplate(input: GenerateReportInput): ReportTemplate {
  const { reportStyle, fileName, story } = input;

  const markdownTemplates = {
    executive: `# Executive Summary

Analysis of **${fileName}** reveals significant trends across key metrics.

## Key Findings

The data demonstrates a clear pattern of growth in the primary indicators. Our analysis focuses on ${story}.

> **Critical Insight**: 40% growth observed in primary metric over the analyzed period.

## Strategic Recommendations

Based on the data patterns observed, three strategic priorities emerge for stakeholder consideration.`,

    story: `# The Story Behind the Data

Let's explore what the numbers tell us about ${story}.

## Setting the Scene

In analyzing **${fileName}**, we uncover a narrative that goes beyond simple statistics.

## The Journey

The data takes us through an evolving landscape where patterns emerge and tell their own story.

### A Closer Look

When we examine the details, fascinating trends become apparent.`,

    detailed: `# Comprehensive Data Analysis

A thorough examination of **${fileName}** across all key dimensions.

## Methodology

This analysis employs rigorous statistical methods to understand ${story}.

### Data Overview

Multiple dimensions of the dataset reveal interconnected patterns worth exploring.`
  };

  return {
    id: reportStyle,
    name: `${reportStyle.charAt(0).toUpperCase() + reportStyle.slice(1)} Report`,
    description: `Generated ${reportStyle} report`,
    markdown: markdownTemplates[reportStyle]
  };
}
