"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

interface MarkdownProps {
  /** Raw markdown string */
  children: string;
  /** Additional class names for the wrapper */
  className?: string;
  /** Compact mode for smaller text (reasoning blocks, detail notes) */
  compact?: boolean;
}

/**
 * Renders markdown content with GFM support.
 * Internal links (/tasks/*) get the app's link styling with external icon.
 * Styled to match the warm minimalist / neo-brutalist theme.
 */
export function Markdown({ children, className, compact = false }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose-custom break-words",
        compact ? "text-inherit" : "text-inherit",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children, ...props }) => (
            <h1 className={cn("font-bold tracking-tight mt-3 mb-1.5", compact ? "text-sm" : "text-base sm:text-lg")} {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className={cn("font-semibold tracking-tight mt-2.5 mb-1", compact ? "text-xs sm:text-sm" : "text-sm sm:text-base")} {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className={cn("font-semibold mt-2 mb-1", compact ? "text-xs" : "text-xs sm:text-sm")} {...props}>
              {children}
            </h3>
          ),

          // Paragraphs
          p: ({ children, ...props }) => (
            <p className="leading-relaxed mb-1.5 last:mb-0" {...props}>
              {children}
            </p>
          ),

          // Links — internal routes get app styling, external open in new tab
          a: ({ href, children, ...props }) => {
            const isInternal = href?.startsWith("/");
            if (isInternal && href) {
              return (
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary font-medium transition-colors"
                >
                  {children}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </Link>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary font-medium transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },

          // Lists
          ul: ({ children, ...props }) => (
            <ul className="list-disc pl-4 mb-1.5 space-y-0.5 last:mb-0" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal pl-4 mb-1.5 space-y-0.5 last:mb-0" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed" {...props}>
              {children}
            </li>
          ),

          // Inline code
          code: ({ children, className: codeClassName, ...props }) => {
            // Detect fenced code blocks (has language- class from remark)
            const isBlock = codeClassName?.includes("language-");
            if (isBlock) {
              return (
                <code className={cn("text-[0.9em]", codeClassName)} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="bg-muted/60 border border-border/50 rounded-sm px-1 py-0.5 text-[0.9em] font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Code blocks
          pre: ({ children, ...props }) => (
            <pre
              className="bg-muted/40 border border-border rounded-sm p-2 mb-1.5 overflow-x-auto text-[0.85em] last:mb-0"
              {...props}
            >
              {children}
            </pre>
          ),

          // Blockquote
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-2 border-primary/40 pl-2.5 italic text-muted-foreground mb-1.5 last:mb-0"
              {...props}
            >
              {children}
            </blockquote>
          ),

          // Strong / emphasis
          strong: ({ children, ...props }) => (
            <strong className="font-semibold" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic" {...props}>
              {children}
            </em>
          ),

          // Horizontal rule
          hr: (props) => (
            <hr className="border-border my-2" {...props} />
          ),

          // Tables (GFM)
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-1.5 last:mb-0">
              <table className="w-full text-left border-collapse border border-border" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-border bg-muted/40 px-2 py-1 font-semibold" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-border px-2 py-1" {...props}>
              {children}
            </td>
          ),

          // Strikethrough (GFM)
          del: ({ children, ...props }) => (
            <del className="line-through text-muted-foreground" {...props}>
              {children}
            </del>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
