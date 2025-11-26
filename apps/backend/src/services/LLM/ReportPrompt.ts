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

  // Define specific instructions for each style
  const styleInstructions = {
    executive: `
-----------------------------------------
📌 TARGET STYLE: The Strategic Narrative (Executive)
-----------------------------------------
- **ID:** "executive"
- **Style:** Concise but impactful. Think "CEO Briefing Memo" written by a skilled communicator.
- **Focus:** The "Bottom Line" and Strategic Implications.
- **Structure:**
  1. **The Lead:** A single, powerful paragraph summarizing the most critical insight/tension.
  2. **The Evidence:** A narrative explanation of the key data drivers (citing specific high/low performers).
  3. **The "Why" Analysis:** A section explaining the potential causes visible in the data patterns.
  4. **The Path Forward:** Strategic recommendations woven into the conclusion.
`,
    story: `
-----------------------------------------
📌 TARGET STYLE: The Feature Story (Narrative)
-----------------------------------------
- **ID:** "story"
- **Style:** Magazine Feature. Immersive, character-driven (using countries/entities as characters).
- **Focus:** The Human Story behind the numbers.
- **Structure:**
  1. **The Hook:** Open with a vivid contrast or a surprising data point (e.g., "In the data, two worlds collide...").
  2. **The Journey:** Walk the reader through the global landscape—the peaks, the valleys, and the middle ground.
  3. **The Conflict:** Analyze the "tension" in the data (e.g., wealthy nations failing vs. rising stars).
  4. **The Resolution:** What this means for the future.
`,
    detailed: `
-----------------------------------------
📌 TARGET STYLE: The Deep Dive Analysis (Analytical)
-----------------------------------------
- **ID:** "detailed"
- **Style:** Intellectual & Thorough. Think "White Paper" but written by a great author.
- **Focus:** Methodology, Distributions, and Correlations.
- **Structure:**
  1. **The Context:** Set the stage with the global aggregate numbers and what they represent.
  2. **The Mechanics:** Explain the *distribution*—is it top-heavy? Uniform?
  3. **The Outliers:** Dedicate a section to the extremes (highest vs lowest) and what they tell us about the reality.
  4. **The Synthesis:** A deep, concluding look at the correlations implied by the data.
`
  };

  // Select the instruction block based on the user's choice
  const selectedInstruction = styleInstructions[reportStyle];

  const prompt = `
You are an elite **Data Journalist and Storyteller**. 
Your goal is to create a SINGLE, deep, publication-ready report based on the specific style requested below.

We need the perfect equilibrium:
1. **Deep Data Explanations:** You must explain *why* the numbers look the way they do.
2. **Narrative Story:** The report must flow like a high-quality magazine feature.

============================================================
🎭 WRITING STYLE: THE "PLEASURE TO READ" STANDARD
============================================================
- **Avoid "Robot Lists":** Never write: "The data shows X. The data shows Y."
- **Use Active Verbs:** Instead of "There is a difference between A and B," write "Country A diverges sharply from Country B..."
- **Weave Stats into Prose:** Don't let numbers interrupt the flow. 
  * *Bad:* "Denmark has a GII of 0.003. Yemen has 0.838."
  * *Good:* "While Denmark approaches near-parity at 0.003, Yemen stands at the opposite extreme (0.838), illustrating a global chasm in equality."
- **Length:** Since you are only writing ONE report, make it substantial (1500+ words).

============================================================
🔒 DATA GROUNDING
============================================================
1. **Do not invent numbers.** Use the provided CSV rows.
2. **Cite your sources.** When you make a claim, back it up with a specific number from the rows.

============================================================
📄 CONTEXT
============================================================
**Core Story:** ${story}
**Audience:** ${audience}
**Dataset:** ${fileName} (${dataSummary.rowCount} rows)
**Columns:** ${dataSummary.columns.join(", ")}

${dataContext}

[BEGIN CSV DATA]
${dataSummary.rawCSVContent}
[END CSV DATA]

============================================================
📘 TASK
============================================================
Generate **1 complete report** strictly following this style definition:

${selectedInstruction}

**General Rules:**
- **Structure:** Use natural, magazine-quality hierarchy with Markdown formatting
- **Headings:** Use engaging, journalistic headlines (not generic like "Introduction" or "Conclusion")
- **Flow:** Let the narrative breathe - don't force rigid patterns. Some sections may have multiple paragraphs before a chart, others may have chart → insight → more analysis
- **Length:** 1500-2500 words total with natural section breaks
- **Charts:** Include 2-4 visualizations strategically placed where they support the narrative

**Chart Guidelines:**
- Use column names EXACTLY as they appear in the CSV data
- Chart types: "line" (trends over time), "bar" (comparisons), "pie" (proportions), "scatter" (correlations)
- For line/bar charts: xField should be categorical (e.g., country, month), yField should be numeric
- For pie charts: xField is the label, yField is the value
- **IMPORTANT:** Include the actual data array from the CSV - extract relevant rows for the chart
- Limit chart data to top 10-15 most relevant data points for clarity

============================================================
OUTPUT FORMAT: MARKDOWN
============================================================
Output a well-structured Markdown document following this exact format:

# [Compelling Main Title]

[Opening paragraph that hooks the reader with the most striking insight...]

## [First Major Section Heading]

[Analysis paragraph weaving in specific data points...]

[Another paragraph building on the analysis...]

> **Key Insight:** [Specific data-backed observation that crystallizes the point]

\`\`\`chart:bar
title: [Descriptive Chart Title]
x: column_name_from_csv
y: column_name_from_csv
data: [
  {"column_name_from_csv": "value1", "other_column": 123},
  {"column_name_from_csv": "value2", "other_column": 456}
]
\`\`\`

[Continue the narrative naturally after the chart...]

### [Subsection for Deeper Analysis]

[Detailed exploration of a specific pattern...]

## [Second Major Section]

[More analysis...]

> **Key Insight:** [Another important takeaway]

\`\`\`chart:line
title: [Another Chart Title]
x: time_column
y: metric_column
data: [...]
\`\`\`

---

**Markdown Formatting Rules:**
- Use # for main section headings (H1) - typically 3-5 main sections
- Use ## for major subsections (H2)
- Use ### for deep dive topics (H3)
- Use > **Key Insight:** for important callouts/insights
- Use \`\`\`chart:type for chart blocks with inline JSON data
- Write in flowing paragraphs - let ideas connect naturally
- Bold key terms with **term** when introducing them
- Use *emphasis* sparingly for dramatic effect

**Chart Block Format:**
Each chart must use this exact structure:
\`\`\`chart:bar
title: Exact Chart Title Here
x: exact_column_name
y: exact_column_name
data: [
  {"exact_column_name": "value", "exact_column_name": 123},
  {"exact_column_name": "value", "exact_column_name": 456}
]
\`\`\`

Supported chart types: chart:bar, chart:line, chart:pie, chart:scatter

**Focus on QUALITY WRITING first, formatting second.**
The Markdown structure should feel invisible - let the story shine through.

============================================================
CRITICAL REMINDERS
============================================================
1. Output ONLY the Markdown content - no JSON wrapper, no meta-commentary
2. Start directly with # [Your Main Title]
3. Use real data from the CSV - no invented numbers
4. Cite specific values naturally in prose
5. Let the narrative flow - don't force artificial structure
6. Make every heading compelling and specific
7. Place charts where they genuinely enhance understanding
8. Write for ${audience} - adjust tone and depth accordingly

============================================================
BEGIN GENERATION
============================================================`;

  return prompt;
}