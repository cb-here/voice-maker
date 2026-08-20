import type { ReactNode } from "react"

import { parseStory, positions, type Part } from "@/lib/story-search"
import { cn } from "@/lib/utils"

/** One run of text, with any matches inside it wrapped for highlighting. */
function marked(
  part: Part,
  query: string,
  active: number,
  counter: { seen: number },
  key: number,
) {
  const hits = query ? positions(part.text, query) : []

  let body: ReactNode = part.text

  if (hits.length) {
    const pieces: ReactNode[] = []
    let cursor = 0

    for (const at of hits) {
      const index = counter.seen
      counter.seen += 1

      if (at > cursor) pieces.push(part.text.slice(cursor, at))

      pieces.push(
        <mark
          key={`${key}-${at}`}
          // The reader finds the current match through this to scroll it into
          // view, which beats threading a ref down through every paragraph.
          data-match={index}
          data-active-match={index === active ? "" : undefined}
          className={cn(
            "rounded-[3px] px-0.5",
            index === active
              ? "bg-primary text-primary-foreground"
              : "bg-primary/25 text-inherit",
          )}
        >
          {part.text.slice(at, at + query.length)}
        </mark>,
      )

      cursor = at + query.length
    }

    if (cursor < part.text.length) pieces.push(part.text.slice(cursor))

    body = pieces
  }

  if (part.as === "strong") return <strong key={key}>{body}</strong>
  if (part.as === "em") return <em key={key}>{body}</em>

  return <span key={key}>{body}</span>
}

interface StoryTextProps {
  text: string
  className?: string
  /** Highlighted wherever it appears. Blank leaves the story untouched. */
  query?: string
  /** Which match is the current one, counted from zero across the whole story. */
  active?: number
}

export function StoryText({
  text,
  className,
  query = "",
  active = 0,
}: StoryTextProps) {
  const term = query.trim()

  // Blank lines become spacing between paragraphs rather than empty lines of
  // their own. Left to `pre-wrap` each one costs a full line of leading, and a
  // story that double-spaces its paragraphs ends up mostly gaps.
  const paragraphs = parseStory(text)

  // Match numbering runs across the whole story, so the count is carried
  // through the paragraphs rather than restarted inside each one.
  const counter = { seen: 0 }

  return (
    <div className={cn("space-y-4", className)}>
      {paragraphs.map((parts, index) => (
        <p key={index} className="break-words whitespace-pre-wrap">
          {parts.map((part, position) =>
            marked(part, term, active, counter, position),
          )}
        </p>
      ))}
    </div>
  )
}
