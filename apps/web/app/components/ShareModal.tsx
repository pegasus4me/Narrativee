"use client";

import { Eye } from "clicons-react";
import posthog from 'posthog-js';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  isGenerating: boolean;
  viewCount: number;
  onCopy: () => void;
}

export function ShareModal({
  isOpen,
  onClose,
  shareUrl,
  isGenerating,
  viewCount,
  onCopy,
}: ShareModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-transparent backdrop-blur-2xl flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">Share Report</h3>

        {isGenerating ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Generating share link...</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Anyone with this link can view your report (read-only)
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={() => {
                    onCopy();
                    // PostHog: Capture report_shared event
                    posthog.capture('report_shared', {
                      share_url: shareUrl,
                      view_count: viewCount,
                    });
                  }}
                  className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Eye size={20} />
                <span className="font-medium">
                  {viewCount} {viewCount === 1 ? "view" : "views"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
