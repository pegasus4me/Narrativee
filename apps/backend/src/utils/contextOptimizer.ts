/**
 * Smart context optimizer - reduces prompt size by sending only relevant sections
 */

interface ContextSection {
  title: string;
  content: string;
  relevanceScore: number;
}

/**
 * Extract sections from markdown report
 */
function extractSections(markdown: string): ContextSection[] {
  const sections: ContextSection[] = [];
  const lines = markdown.split('\n');

  let currentTitle = 'Introduction';
  let currentContent: string[] = [];

  for (const line of lines) {
    // Check if it's a heading (## or ### or #)
    if (line.match(/^#{1,3}\s+/)) {
      // Save previous section
      if (currentContent.length > 0) {
        sections.push({
          title: currentTitle,
          content: currentContent.join('\n'),
          relevanceScore: 0,
        });
      }

      // Start new section
      currentTitle = line.replace(/^#{1,3}\s+/, '').trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Add last section
  if (currentContent.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentContent.join('\n'),
      relevanceScore: 0,
    });
  }

  return sections;
}

/**
 * Calculate relevance score for a section based on question
 */
function calculateRelevance(section: ContextSection, question: string): number {
  const questionLower = question.toLowerCase();
  const sectionText = (section.title + ' ' + section.content).toLowerCase();

  let score = 0;

  // Split question into keywords (remove common words)
  const stopWords = ['what', 'how', 'why', 'when', 'where', 'who', 'can', 'could', 'would', 'should', 'is', 'are', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'about', 'me', 'you', 'there', 'their', 'this', 'that', 'these', 'those'];
  const keywords = questionLower
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word)); // Changed from >3 to >2 to catch more keywords

  // Score based on keyword matches
  for (const keyword of keywords) {
    // Title match is worth more
    if (section.title.toLowerCase().includes(keyword)) {
      score += 5;
    }
    // Content match
    const matches = (sectionText.match(new RegExp(keyword, 'g')) || []).length;
    score += matches * 2;
  }

  return score;
}

/**
 * Optimize context by selecting most relevant sections
 * @param reportContent Full report markdown
 * @param question User's question
 * @param maxTokens Maximum tokens to include (approximate)
 * @returns Optimized context string
 */
export function optimizeContext(
  reportContent: string,
  question: string,
  maxTokens: number = 8000
): string {
  // If report is small enough, return as-is
  const estimatedTokens = reportContent.length / 4; // Rough estimate: 1 token ≈ 4 chars
  if (estimatedTokens <= maxTokens) {
    return reportContent;
  }

  // Extract and score sections
  const sections = extractSections(reportContent);

  // Calculate relevance for each section
  sections.forEach(section => {
    section.relevanceScore = calculateRelevance(section, question);
  });

  // Sort by relevance (highest first)
  sections.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Select sections until we hit token limit
  const selectedSections: ContextSection[] = [];
  let currentTokens = 0;

  for (const section of sections) {
    const sectionTokens = (section.title.length + section.content.length) / 4;

    if (currentTokens + sectionTokens <= maxTokens) {
      selectedSections.push(section);
      currentTokens += sectionTokens;
    } else {
      break;
    }
  }

  // If no sections matched well OR very few matched, take first N sections as fallback
  if (selectedSections.length < 3) {
    console.log('⚠️ Low relevance match - using fallback strategy (first sections)');
    selectedSections.length = 0; // Clear low-relevance matches
    let tokensUsed = 0;

    // Take sections in original order (not sorted by relevance)
    const originalOrder = extractSections(reportContent);
    for (const section of originalOrder) {
      const sectionTokens = (section.title.length + section.content.length) / 4;
      if (tokensUsed + sectionTokens <= maxTokens) {
        selectedSections.push(section);
        tokensUsed += sectionTokens;
      } else {
        break;
      }
    }
  }

  // Reconstruct markdown with selected sections
  const optimizedContent = selectedSections
    .map(section => `## ${section.title}\n\n${section.content}`)
    .join('\n\n');

  console.log(`📊 Context Optimization:`, {
    originalTokens: Math.round(estimatedTokens),
    optimizedTokens: Math.round(currentTokens),
    sectionsSelected: selectedSections.length,
    totalSections: sections.length,
    reduction: `${Math.round((1 - currentTokens / estimatedTokens) * 100)}%`,
  });

  return optimizedContent;
}

/**
 * For edit requests, we need full context
 */
export function shouldOptimizeContext(requestType: string): boolean {
  // Don't optimize for edit requests - they need full context
  return requestType !== 'edit';
}
