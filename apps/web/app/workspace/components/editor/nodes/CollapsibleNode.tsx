import { DecoratorNode, LexicalNode, SerializedLexicalNode, Spread } from "lexical";
import type { ReactNode } from "react";

export type SerializedCollapsibleNode = Spread<
  {
    title: string;
    isOpen: boolean;
  },
  SerializedLexicalNode
>;

export class CollapsibleNode extends DecoratorNode<ReactNode> {
  __title: string;
  __isOpen: boolean;

  static getType(): string {
    return "collapsible";
  }

  static clone(node: CollapsibleNode): CollapsibleNode {
    return new CollapsibleNode(node.__title, node.__isOpen, node.__key);
  }

  constructor(title: string, isOpen = true, key?: string) {
    super(key);
    this.__title = title;
    this.__isOpen = isOpen;
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    element.className = "collapsible-container my-4";
    return element;
  }

  updateDOM(): false {
    return false;
  }

  exportJSON(): SerializedCollapsibleNode {
    return {
      title: this.__title,
      isOpen: this.__isOpen,
      type: "collapsible",
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedCollapsibleNode): CollapsibleNode {
    return $createCollapsibleNode(serializedNode.title, serializedNode.isOpen);
  }

  decorate(): ReactNode {
    return (
      <details open={this.__isOpen} className="border border-gray-200 rounded-lg p-4 my-4">
        <summary className="cursor-pointer font-semibold text-gray-900 hover:text-amber-600 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {this.__title}
        </summary>
        <div className="mt-3 pl-6 text-gray-700">
          Content goes here...
        </div>
      </details>
    );
  }
}

export function $createCollapsibleNode(title: string, isOpen = true): CollapsibleNode {
  return new CollapsibleNode(title, isOpen);
}

export function $isCollapsibleNode(node: LexicalNode | null | undefined): node is CollapsibleNode {
  return node instanceof CollapsibleNode;
}
