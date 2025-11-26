import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createParagraphNode, $createTextNode, TextNode } from 'lexical';
import { $createChartNode } from '../editor/nodes/ChartNode';

export function parseMarkdown(markdown: string) {
  const lines = markdown.split('\n') as string[];
  const nodes: any[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] as string;

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Chart block: ```chart:type
    if (line.startsWith('```chart:')) {
      const chartMatch = line.match(/```chart:(\w+)/);
      if (chartMatch) {
        const chartType = chartMatch[1];
        i++;

        // Collect all lines until closing ```
        let chartContent = '';
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          chartContent += lines[i] + '\n';
          i++;
        }

        // Parse chart configuration from the content
        try {
          const chartConfig = parseChartConfig(chartType, chartContent);
          const chartNode = $createChartNode(chartConfig);
          nodes.push(chartNode);
        } catch (error) {
          console.error('Failed to parse chart:', error);
        }

        i++; // Skip closing ```
        continue;
      }
    }

    // H1 heading
    if (line.startsWith('# ')) {
      const headingNode = $createHeadingNode('h1');
      const textNodes = parseInlineFormatting(line.slice(2));
      textNodes.forEach(node => headingNode.append(node));
      nodes.push(headingNode);
      i++;
    }
    // H2 heading
    else if (line.startsWith('## ')) {
      const headingNode = $createHeadingNode('h2');
      const textNodes = parseInlineFormatting(line.slice(3));
      textNodes.forEach(node => headingNode.append(node));
      nodes.push(headingNode);
      i++;
    }
    // H3 heading
    else if (line.startsWith('### ')) {
      const headingNode = $createHeadingNode('h3');
      const textNodes = parseInlineFormatting(line.slice(4));
      textNodes.forEach(node => headingNode.append(node));
      nodes.push(headingNode);
      i++;
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      const quoteNode = $createQuoteNode();
      let quoteText = line.slice(2);

      // Collect multi-line quotes
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) {
        i++;
        quoteText += '\n' + lines[i].slice(2);
      }

      const textNodes = parseInlineFormatting(quoteText);
      textNodes.forEach(node => quoteNode.append(node));
      nodes.push(quoteNode);
      i++;
    }
    // Regular paragraph
    else {
      const paragraphNode = $createParagraphNode();
      let paragraphText = line;

      // Collect multi-line paragraphs (until empty line or heading)
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if(!nextLine) break; // Changed from return to break
        if (!nextLine.trim() || nextLine.startsWith('#') || nextLine.startsWith('>')) {
          break;
        }
        i++;
        paragraphText += ' ' + nextLine;
      }

      // Parse inline formatting (bold, italic) and append to paragraph
      const textNodes = parseInlineFormatting(paragraphText);
      textNodes.forEach(node => paragraphNode.append(node));
      nodes.push(paragraphNode);
      i++;
    }
  }

  return nodes;
}

// Helper function to parse inline formatting (bold, italic) in text
function parseInlineFormatting(text: string): TextNode[] {
  const nodes: TextNode[] = [];

  // Regex to match **bold** and *italic* (avoiding overlap)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)|([^*]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // **bold**
      const textNode = $createTextNode(match[2]);
      textNode.toggleFormat('bold');
      nodes.push(textNode);
    } else if (match[3]) {
      // *italic*
      const textNode = $createTextNode(match[3]);
      textNode.toggleFormat('italic');
      nodes.push(textNode);
    } else if (match[4]) {
      // Regular text
      nodes.push($createTextNode(match[4]));
    }
  }

  return nodes.length > 0 ? nodes : [$createTextNode(text)];
}

// Helper function to parse chart configuration from markdown block
function parseChartConfig(chartType: string, content: string): any {
  const lines = content.trim().split('\n');
  const config: any = {
    type: chartType,
    title: '',
    xField: '',
    yField: '',
    data: []
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Parse title: title: Chart Title
    if (trimmed.startsWith('title:')) {
      config.title = trimmed.replace('title:', '').trim();
    }
    // Parse xField: x: field_name
    else if (trimmed.startsWith('x:')) {
      config.xField = trimmed.replace('x:', '').trim();
    }
    // Parse yField: y: field_name
    else if (trimmed.startsWith('y:')) {
      config.yField = trimmed.replace('y:', '').trim();
    }
    // Parse data: data: [...]
    else if (trimmed.startsWith('data:')) {
      // Extract JSON array from data: line and remaining lines
      let dataStr = trimmed.replace('data:', '').trim();

      // If data spans multiple lines, collect them
      let dataIndex = lines.indexOf(line);
      while (dataIndex < lines.length - 1 && !dataStr.includes(']')) {
        dataIndex++;
        dataStr += lines[dataIndex].trim();
      }

      try {
        config.data = JSON.parse(dataStr);
      } catch (error) {
        console.error('Failed to parse chart data JSON:', error);
        config.data = [];
      }
    }
  }

  return config;
}
