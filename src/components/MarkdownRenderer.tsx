import React, { useState } from 'react';
import { marked } from 'marked';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // If the content contains code blocks ```lang ... ```, we can format them nicely
  // We parse markdown using marked with custom renderer or process HTML
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Configure marked options
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  // Separate code blocks to render customized interactive code snippets
  const renderFormattedContent = () => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let codeIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        const textSegment = content.slice(lastIndex, match.index);
        const html = marked.parse(textSegment) as string;
        parts.push(
          <div
            key={`text-${lastIndex}`}
            className="prose-chatgpt"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }

      const lang = match[1] || 'code';
      const code = match[2];
      const blockId = `code-${codeIndex++}`;

      parts.push(
        <div key={blockId} className="my-3 rounded-lg overflow-hidden border border-[#383838] bg-[#171717]">
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#262626] text-xs text-[#a0a0a0] font-mono border-b border-[#383838]">
            <span className="font-medium text-[#c5c5c5] lowercase">{lang}</span>
            <button
              onClick={() => handleCopyCode(code, blockId)}
              className="flex items-center gap-1.5 hover:text-white transition-colors py-0.5 px-1.5 rounded hover:bg-[#333333]"
              title="Copy code"
            >
              {copiedId === blockId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy code</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 text-[0.875rem] text-[#f0f0f0] font-mono overflow-x-auto leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      const html = marked.parse(remainingText) as string;
      parts.push(
        <div
          key={`text-${lastIndex}`}
          className="prose-chatgpt"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    return parts;
  };

  return <div className="space-y-1">{renderFormattedContent()}</div>;
};
