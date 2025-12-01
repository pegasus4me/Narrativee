"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $createParagraphNode,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $isHeadingNode, HeadingTagType } from "@lexical/rich-text";
import { TOGGLE_LINK_COMMAND, $isLinkNode } from "@lexical/link";
import { createPortal } from "react-dom";
import { ColorPicker } from "clicons-react"; 
export default function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState<string>("paragraph");
  const [isVisible, setIsVisible] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const isCollapsed = selection.isCollapsed();

      if (!isCollapsed) {
        // Text is selected - show toolbar
        setIsBold(selection.hasFormat("bold"));
        setIsItalic(selection.hasFormat("italic"));
        setIsUnderline(selection.hasFormat("underline"));

        // Check if selection is a link
        const node = selection.anchor.getNode();
        const parent = node.getParent();
        if ($isLinkNode(parent) || $isLinkNode(node)) {
          setIsLink(true);
        } else {
          setIsLink(false);
        }

        // Get block type
        const anchorNode = selection.anchor.getNode();
        const element =
          anchorNode.getKey() === "root"
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow();

        const elementDOM = editor.getElementByKey(element.getKey());
        if (elementDOM !== null) {
          if ($isHeadingNode(element)) {
            const tag = element.getTag();
            setBlockType(tag);
          } else {
            setBlockType("paragraph");
          }
        }

        setIsVisible(true);

        // Get selection position
        const nativeSelection = window.getSelection();
        if (nativeSelection && nativeSelection.rangeCount > 0) {
          const range = nativeSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Position toolbar above selection
          setPosition({
            top: rect.top - 50 + window.scrollY,
            left: rect.left + rect.width / 2 + window.scrollX,
          });
        }
      } else {
        // No text selected - hide toolbar
        setIsVisible(false);
        setShowLinkInput(false);
      }
    } else {
      setIsVisible(false);
      setShowLinkInput(false);
    }
  }, [editor]);

  useEffect(() => {
    // Register selection change listener
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          updateToolbar();
        });
        return false;
      },
      1
    );
  }, [editor, updateToolbar]);

  const formatHeading = (headingTag: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingTag));
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const getBlockTypeLabel = () => {
    switch (blockType) {
      case "h1":
        return "H1";
      case "h2":
        return "H2";
      case "h3":
        return "H3";
      case "h4":
        return "H4";
      default:
        return "P";
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
      setShowLinkInput(false);
      setLinkUrl("");
    }
  };

  const handleLinkButtonClick = () => {
    if (isLink) {
      // Remove link
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      // Show link input
      setShowLinkInput(true);
      setTimeout(() => linkInputRef.current?.focus(), 100);
    }
  };

  const applyTextColor = (color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.getType() === 'text') {
            (node as any).setStyle(`color: ${color}`);
          }
        });
      }
    });
    setShowColorPicker(false);
  };

  if (!isVisible) {
    return null;
  }

  return createPortal(
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-neutral-400/40 backdrop-blur-md text-black rounded-sm shadow-xl px-2 py-1.5 flex items-center gap-1 transform -translate-x-1/2 -translate-y-full animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Heading Dropdown */}
      <div
        className="relative"
        onMouseEnter={() => setShowHeadingDropdown(true)}
        onMouseLeave={() => setShowHeadingDropdown(false)}
      >
        <button
          className="px-2 py-1.5 rounded hover:bg-amber-300 transition-colors text-xs font-medium flex items-center gap-1 min-w-[50px]"
          aria-label="Text Style"
        >
          {getBlockTypeLabel()}
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {showHeadingDropdown && (
          <div className="absolute bottom-full left-0 mb-2 bg-gray-900 rounded-lg shadow-xl min-w-[140px] overflow-hidden">
            <button
              onClick={() => {
                formatParagraph();
                setShowHeadingDropdown(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-700 text-sm text-white"
            >
              Paragraph
            </button>
            <button
              onClick={() => {
                formatHeading("h1");
                setShowHeadingDropdown(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-700 text-lg font-bold text-white"
            >
              Heading 1
            </button>
            <button
              onClick={() => {
                formatHeading("h2");
                setShowHeadingDropdown(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-700 text-base font-bold text-white"
            >
              Heading 2
            </button>
            <button
              onClick={() => {
                formatHeading("h3");
                setShowHeadingDropdown(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-700 text-sm font-semibold text-white"
            >
              Heading 3
            </button>
            <button
              onClick={() => {
                formatHeading("h4");
                setShowHeadingDropdown(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-700 text-sm font-medium text-white"
            >
              Heading 4
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-gray-300"></div>

      {/* Bold */}
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        className={`p-2 rounded hover:bg-gray-700 transition-colors ${
          isBold ? "bg-amber-600" : ""
        }`}
        aria-label="Bold"
        title="Bold (Ctrl+B)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
        </svg>
      </button>

      {/* Italic */}
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        className={`p-2 rounded hover:bg-gray-700 transition-colors ${
          isItalic ? "bg-amber-600" : ""
        }`}
        aria-label="Italic"
        title="Italic (Ctrl+I)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
        </svg>
      </button>

      {/* Underline */}
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
        className={`p-2 rounded hover:bg-gray-700 transition-colors ${
          isUnderline ? "bg-amber-600" : ""
        }`}
        aria-label="Underline"
        title="Underline (Ctrl+U)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
        </svg>
      </button>

      <div className="w-px h-4 bg-gray-300 mx-1"></div>

      {/* Link */}
      {!showLinkInput ? (
        <button
          onClick={handleLinkButtonClick}
          className={`p-2 rounded hover:bg-gray-700 transition-colors ${
            isLink ? "bg-amber-600" : ""
          }`}
          aria-label="Insert Link"
          title="Insert Link"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        </button>
      ) : (
        <div className="flex items-center gap-1 px-2">
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                insertLink();
              } else if (e.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
            placeholder="Enter URL..."
            className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 w-48"
          />
          <button
            onClick={insertLink}
            className="p-1.5 rounded bg-amber-600 hover:bg-amber-700 transition-colors"
            title="Insert"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
            }}
            className="p-1.5 rounded hover:bg-gray-700 transition-colors"
            title="Cancel"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="w-px h-4 bg-gray-300 mx-1"></div>

      {/* Text Color */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-2 rounded hover:bg-gray-700 transition-colors"
          aria-label="Text Color"
          title="Text Color"
        >
         <ColorPicker size={17} />
        </button>

        {showColorPicker && (
          <div className="absolute bottom-full left-0 mb-2 bg-gray-900 rounded-lg shadow-xl p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                ref={colorInputRef}
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                placeholder="#000000"
                className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white w-24"
              />
            </div>
            <div className="flex gap-1">
              <button onClick={() => applyTextColor('#000000')} className="w-6 h-6 rounded bg-black border border-gray-600" title="Black"/>
              <button onClick={() => applyTextColor('#EF4444')} className="w-6 h-6 rounded bg-red-500" title="Red"/>
              <button onClick={() => applyTextColor('#F59E0B')} className="w-6 h-6 rounded bg-amber-500" title="Amber"/>
              <button onClick={() => applyTextColor('#10B981')} className="w-6 h-6 rounded bg-green-500" title="Green"/>
              <button onClick={() => applyTextColor('#3B82F6')} className="w-6 h-6 rounded bg-blue-500" title="Blue"/>
              <button onClick={() => applyTextColor('#8B5CF6')} className="w-6 h-6 rounded bg-purple-500" title="Purple"/>
            </div>
            <button
              onClick={() => applyTextColor(textColor)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 rounded text-xs text-white"
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
