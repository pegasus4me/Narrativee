'use client';

import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread, LexicalEditor } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
// ✅ IMPORT THE WRAPPER, NOT THE CHART
import ChartWrapper from '../chart/ChartWrapper';
import type { ReactNode } from 'react';

// Wrapper component with editor context
function ChartNodeComponent({ nodeKey, config }: { nodeKey: NodeKey; config: any }) {
  const [editor] = useLexicalComposerContext();

  const handleDelete = () => {
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey);
      if (node) {
        node.remove();
      }
    });
  };

  return (
    <div contentEditable={false} className="relative group">
      {/* Delete Button (Visible on Hover) */}
      <div className="absolute right-0 -top-8 opacity-0 group-hover:opacity-100 transition-opacity z-50 p-2">
        <button
          onClick={handleDelete}
          className="bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded shadow-sm px-2 py-1 text-xs font-medium flex items-center gap-1"
          title="Remove Chart"
        >
          <span>Trash</span>
        </button>
      </div>

      {/* Load the Chart safely via the wrapper */}
      <ChartWrapper config={config} />
    </div>
  );
}

export type SerializedChartNode = Spread<
  {
    chartConfig: any;
    type: 'chart-node';
  },
  SerializedLexicalNode
>;

export class ChartNode extends DecoratorNode<ReactNode> {
  __chartConfig: any;

  static getType(): string {
    return 'chart-node';
  }

  static clone(node: ChartNode): ChartNode {
    return new ChartNode(node.__chartConfig, node.__key);
  }

  constructor(chartConfig: any, key?: NodeKey) {
    super(key);
    this.__chartConfig = chartConfig;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    // Critical styles for Chart interaction
    div.style.display = 'block'; 
    div.style.width = '100%';
    div.style.position = 'relative';
    div.style.userSelect = 'none'; // Prevents text selection while interacting with chart
    div.style.margin = '2rem 0';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): ReactNode {
    return <ChartNodeComponent nodeKey={this.__key} config={this.__chartConfig} />;
  }

  exportJSON(): SerializedChartNode {
    return {
      chartConfig: this.__chartConfig,
      type: 'chart-node',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedChartNode): ChartNode {
    return $createChartNode(serializedNode.chartConfig);
  }

  isInline(): false {
    return false;
  }
}

export function $createChartNode(chartConfig: any): ChartNode {
  return new ChartNode(chartConfig);
}

export function $isChartNode(node: any): node is ChartNode {
  return node instanceof ChartNode;
}