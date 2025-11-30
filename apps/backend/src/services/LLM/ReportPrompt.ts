import { CSVRow } from "../../utils/csv/csvParser";

// Define the valid styles
export type ReportStyle = 'executive' | 'story' | 'detailed';

interface GenerateReportInput {
   story: string;
   audience: string;
   fileName: string;
   dataSummary: {
      rowCount: number;
      columns: string[];
      rawCSVContent: string;
      isPartialData: boolean;
   };
   reportStyle: ReportStyle;
}

export function promptTemplate({ story, audience, fileName, dataSummary, reportStyle }: GenerateReportInput): string {
   const dataContext = dataSummary.isPartialData
      ? `NOTE: Due to size limits, only the first ${dataSummary.rowCount} rows are provided below. Analyze these as a representative sample.`
      : `NOTE: The FULL dataset is provided below. You have access to every single row for accurate analysis.`;

   // Define specific instructions for each style with mandatory structure
   const styleInstructions = {
      executive: `
-----------------------------------------
📌 TARGET STYLE: The Strategic Narrative (Executive)
-----------------------------------------
**Style:** Concise but impactful. CEO briefing memo format.
**Focus:** Bottom-line insights and strategic implications.
**Tone:** Professional, direct, action-oriented.

**MANDATORY STRUCTURE:**
1. **Executive Summary** - One powerful opening paragraph with the most critical finding
2. **Context & Scope** - What this data represents, timeframe, analytical approach (2-3 paragraphs)
3. **Data Overview** - Dataset description: key metrics, columns, data quality notes
4. **Key Findings** - 3-5 major insights with specific numbers and 1-2 strategic charts
5. **Trend Analysis** - Temporal patterns or performance trends with visualizations
6. **Strategic Implications** - What these findings mean for decision-makers
7. **Recommendations** - 3-5 concrete, actionable next steps

**Requirements:**
- Length: 1500-2000 words
- Charts: 2-4 strategic visualizations
- Each finding must cite specific data points
- End every major section with a clear takeaway
`,
      story: `
-----------------------------------------
📌 TARGET STYLE: The Feature Story (Narrative)
-----------------------------------------
**Style:** Magazine feature with narrative arc.
**Focus:** The human/contextual story behind the numbers.
**Tone:** Engaging, accessible, story-driven.

**MANDATORY STRUCTURE:**
1. **The Hook** - Open with a vivid contrast, surprising insight, or compelling scene (1-2 paragraphs)
2. **Setting the Stage** - Introduce the data landscape and why it matters (context)
3. **The Dataset Story** - Describe what we're analyzing: columns, metrics, what each represents (make it engaging, not dry)
4. **First Discoveries** - Initial exploratory analysis with 2-3 foundational charts revealing patterns
5. **The Journey Through Time** - Temporal trends, year-by-year evolution, or period analysis with visualizations
6. **The Landscape of Categories** - Genre/type/regional distributions with charts showing proportions and comparisons
7. **The Outliers' Tale** - Special cases, anomalies, record-breakers, and what makes them unique
8. **Connecting the Dots** - Synthesize patterns, correlations, strategic insights
9. **The Resolution** - Conclude with implications, recommendations, and future outlook

**Requirements:**
- Length: 2000-2800 words
- Charts: 4-6 narrative-supporting visualizations
- Use entities as "characters" in the story
- Make every number tell part of the larger narrative
- Build tension and resolve it with insights
`,
      detailed: `
-----------------------------------------
📌 TARGET STYLE: The Deep Dive Analysis (Analytical)
-----------------------------------------
**Style:** Comprehensive white paper / research report.
**Focus:** Methodology, statistical rigor, comprehensive analysis.
**Tone:** Academic but readable, thorough, evidence-based.

**MANDATORY STRUCTURE:**
1. **Introduction**
   - Context and background (what is this data about?)
   - Research questions or analytical objectives
   - Scope and limitations
   - Report structure overview

2. **Data Description & Methodology**
   - Dataset overview (source, size, time period, ${dataSummary.rowCount} rows)
   - Column definitions and data types (explain each column: ${dataSummary.columns.join(", ")})
   - Data quality assessment (missing values, outliers, cleaning steps)
   - Analytical methods employed

3. **Exploratory Data Analysis**
   - Descriptive statistics (means, medians, ranges, standard deviations)
   - Distribution analysis with appropriate charts
   - Initial patterns and observations
   - 2-3 foundational visualizations

4. **Temporal Analysis** (if time-based data exists)
   - Year-over-year trends or period-over-period changes
   - Growth rates and velocity analysis
   - Seasonality or cyclical patterns
   - Trend forecasting or trajectory analysis
   - 2-3 time-series visualizations

5. **Categorical & Segmentation Analysis**
   - Breakdown by key dimensions (genre, type, region, category)
   - Comparative analysis across segments
   - Distribution charts (pie, stacked bar) showing proportions
   - Performance leaders vs. laggards by category
   - 2-3 categorical comparison charts

6. **Outlier Analysis & Special Cases**
   - Statistical outlier identification (values beyond 2-3 standard deviations)
   - Deep dive into anomalies and edge cases
   - What makes these cases unique or exceptional
   - Lessons from the extremes

7. **Correlation & Multivariate Analysis**
   - Relationships between variables
   - Scatter plots showing correlations
   - Pattern synthesis across multiple dimensions
   - Complex insights from intersecting data

8. **Key Findings & Strategic Insights**
   - Synthesize all analysis into 5-7 major findings
   - Business implications and strategic value
   - Actionable intelligence for decision-makers

9. **Conclusion & Recommendations**
   - Summary of most critical insights
   - Data-driven recommendations (3-5 specific actions)
   - Limitations of this analysis
   - Suggestions for future research or data collection

**Requirements:**
- Length: 3000-4500 words
- Charts: 6-10 comprehensive visualizations covering all analytical dimensions
- Include statistical measures where relevant
- Every claim backed by specific data
- Professional, thorough, publication-ready quality
`
   };

   // Select the instruction block based on the user's choice
   const selectedInstruction = styleInstructions[reportStyle];

   const prompt = `
You are an elite **Data Analyst and Report Writer** tasked with creating a comprehensive, publication-ready report.

============================================================
🎯 YOUR MISSION
============================================================
Create a **SINGLE, COMPLETE REPORT** that follows the exact structure specified below. This must be thorough, well-researched, and grounded entirely in the provided data.

**Critical Success Factors:**
1. **Follow the structure religiously** - Every section listed must appear in your report
2. **Ground every claim in data** - Cite specific numbers from the CSV
3. **Create meaningful visualizations** - Charts must illuminate insights, not just display data
4. **Write for ${audience}** - Adjust technical depth and tone accordingly
5. **Make it actionable** - Insights should lead to understanding and decisions

============================================================
🎭 WRITING STANDARDS
============================================================
**Quality Markers:**
- **Clarity over complexity** - Make sophisticated analysis accessible
- **Active voice** - "Revenue grew 45%" not "There was a 45% growth in revenue"
- **Smooth integration of data** - Weave numbers into prose naturally
- **Varied sentence structure** - Mix short impact statements with detailed explanations
- **Logical flow** - Each paragraph should connect to the next

**Avoid:**
- ❌ Generic statements without data support
- ❌ Repetitive phrasing ("The data shows... The data indicates...")
- ❌ Charts without clear purpose or insight
- ❌ Skipping required sections from the structure
- ❌ Inventing or estimating numbers not in the dataset
- ❌ Dont use En dash and Em dash in the report

============================================================
📊 CHART EXCELLENCE STANDARDS
============================================================
**Every chart must:**
1. **Have a clear purpose** - Answer a specific question or reveal a pattern
2. **Use exact column names** from the CSV data
3. **Include real data** extracted from the provided rows
4. **Have a descriptive title** that telegraphs the insight
5. **Support the narrative** - Appear where they advance understanding

**Chart Types & When to Use:**
- **bar** - Comparing categories or entities (top 10 performers, category breakdown)
- **line** - Showing trends over time (year-by-year growth, temporal patterns)
- **pie** - Showing proportions of a whole (market share, category distribution)
- **scatter** - Revealing correlations between two variables

**Chart Data Requirements:**
- Extract 10-15 most relevant data points
- Use exact column names as they appear in CSV
- Format as valid JSON array of objects
- Include all necessary fields for the chart type

============================================================
📄 YOUR DATA CONTEXT
============================================================
**Core Story/Question:** ${story}
**Target Audience:** ${audience}
**Dataset:** ${fileName}
**Row Count:** ${dataSummary.rowCount} rows
**Columns Available:** ${dataSummary.columns.join(", ")}

${dataContext}

**THE ACTUAL DATA:**
[BEGIN CSV DATA]
${dataSummary.rawCSVContent}
[END CSV DATA]

============================================================
📋 YOUR SPECIFIC ASSIGNMENT
============================================================
${selectedInstruction}

**YOU MUST INCLUDE EVERY SECTION LISTED ABOVE.**
Do not skip any section. Do not merge sections unless explicitly told to.
Each section should be substantive (multiple paragraphs where appropriate).

============================================================
📝 OUTPUT FORMAT: MARKDOWN
============================================================
**Document Structure:**
\`\`\`
# [Compelling Report Title]

[Opening paragraph if appropriate for style]

## 1. [First Required Section Title]

[Content with data, analysis, and insights]

[More paragraphs as needed]

> **Key Insight:** [Standout finding from this section]

\`\`\`chart:bar
title: [Descriptive Chart Title That Reveals The Insight]
x: exact_column_name_from_csv
y: exact_column_name_from_csv
data: [
  {"exact_column_name": "value1", "exact_column_name": 123.45},
  {"exact_column_name": "value2", "exact_column_name": 678.90}
]
\`\`\`

[Continue analysis after the chart]

## 2. [Second Required Section Title]

[Continue through all required sections...]
\`\`\`

**Formatting Rules:**
- Use **#** for report title (only one H1)
- Use **##** for major sections (the numbered structure points)
- Use **###** for subsections within major sections
- Use **> Key Insight:** for important callouts
- Use **bold** for emphasis on key terms or findings
- Use *italics* sparingly for dramatic effect
- Use \`\`\`chart:type for visualizations
- Use standard Markdown lists:
  - Unordered: \`- Item\` or \`* Item\`
  - Ordered: \`1. Item\`

**Chart Block Template:**
\`\`\`chart:bar
title: Exact Descriptive Title
x: column_name_exactly_as_in_csv
y: column_name_exactly_as_in_csv
data: [
  {"column_name": "Category A", "column_name": 100},
  {"column_name": "Category B", "column_name": 250}
]
\`\`\`

============================================================
⚠️ CRITICAL REQUIREMENTS - READ CAREFULLY
============================================================
1. **Output ONLY Markdown** - No JSON wrapper, no meta-commentary, no code blocks around the whole thing
2. **Start with # [Title]** - First line should be your H1 title
3. **Follow the structure exactly** - Include every required section for your assigned style
4. **Use real data only** - Every number must come from the CSV provided
5. **Create required number of charts** - Match the chart count specified for your style
6. **Cite specific values** - "Revenue reached $2.4M in 2023" not "Revenue was high"
7. **Make it substantial** - Hit the word count target for your style
8. **Write for the audience** - Adjust complexity and tone for ${audience}
9. **End with actionable insights** - Recommendations should be specific and data-driven
10. **Proofread mentally** - Ensure smooth flow and professional quality

============================================================
✅ QUALITY CHECKLIST (Verify Before Submitting)
============================================================
- [ ] All required sections from the structure are present
- [ ] Every major claim is supported by specific data from the CSV
- [ ] Required number of charts are included with real data
- [ ] Charts use exact column names from: ${dataSummary.columns.join(", ")}
- [ ] Writing is clear, engaging, and appropriate for ${audience}
- [ ] Document flows logically from introduction to conclusion
- [ ] Insights are actionable and grounded in analysis
- [ ] Word count meets the target for ${reportStyle} style
- [ ] No sections are skipped or merged inappropriately
- [ ] Format is clean Markdown starting with # title

============================================================
🚀 BEGIN REPORT GENERATION NOW
============================================================`;

   return prompt;
}
