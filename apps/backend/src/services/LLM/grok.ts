import { CSVRow } from "../../utils/csv/csvParser";
import OpenAI from "openai";
import { promptTemplate } from "./ReportPrompt";
import { toCSVString } from "../../utils/tools";
console.log("hello");
interface GenerateReportInput {
  csvData: CSVRow[];
  story: string;
  audience: string;
  fileName: string;
  reportStyle: 'executive' | 'story' | 'detailed';
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
  const { csvData, story, audience, fileName, reportStyle } = input;

  // Prepare data summary for Grok
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
    console.log('🤖 Calling Grok API to generate report...');
    const markdown = await callGrokAPI(prompt);
    console.log('✅ Grok API response received');

    return {
      id: reportStyle,
      name: `${reportStyle.charAt(0).toUpperCase() + reportStyle.slice(1)} Report`,
      description: `Generated ${reportStyle} report`,
      markdown: markdown
    };
  } catch (error: any) {
    console.error("❌ Grok API error:", error?.message || error);

    // Check if it's a timeout error
    if (error?.message?.includes('timeout') || error?.code === 'ETIMEDOUT') {
      console.log('⏱️  Request timed out - using mock template as fallback');
    }

    // Fallback: Return mock template for development
    console.log('🔄 Returning mock template as fallback');
    return getMockTemplate(input);
  }
}

async function callGrokAPI(prompt: string): Promise<string> {
  const GROK_API_KEY = process.env.GROK_API_KEY;
  console.log("GROK_API_KEY", GROK_API_KEY);
  if (!GROK_API_KEY) {
    throw new Error("GROK_API_KEY not found in environment variables");
  }

  // Initialize OpenAI client with Liona's Grok provider
  const openai = new OpenAI({
    apiKey: GROK_API_KEY,
    baseURL: "https://api.x.ai/v1",
  });

  // Call Grok via OpenAI SDK with increased timeout
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
          You are an expert data analyst creating story-driven narrative reports from CSV data.

          IMPORTANT: Respond ONLY with clean Markdown. No JSON, no code blocks, just pure markdown content.

          Use markdown syntax:
          - # for H1 (main sections)
          - ## for H2 (subsections)
          - ### for H3 (deep dives)
          - Regular paragraphs for content
          - > for insight/quote callouts

          Your goal is to tell a **cohesive story with the data**, highlighting key trends, comparisons, and insights.
          Tailor the narrative and tone to the audience described in the user message.

          Do NOT include chart placeholders or visualizations in the markdown - the system will add those separately.
        `,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "grok-4-1-fast-reasoning",
    temperature: 0.5,
    // timeout: 120000, // 2 minutes timeout
  });

  // Parse the response
  let content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in Grok response");
  }

  // Remove markdown code blocks if present (Grok sometimes wraps in ```)
  content = content.trim();
  if (content.startsWith('```markdown') || content.startsWith('```md')) {
    content = content.replace(/^```(markdown|md)\n?/, '').replace(/\n?```$/, '');
  } else if (content.startsWith('```')) {
    content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

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
