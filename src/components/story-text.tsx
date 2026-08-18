import { cn } from "@/lib/utils"

// Stories arrive with light markdown in them — a date or a warning set in
// **bold**, the odd *aside*. Rendering it beats showing the raw asterisks, but a
// full markdown parser would reflow the text, and in a screenplay every line
// break carries a speaker. So only emphasis is interpreted; the layout is left
// exactly as written.
const EMPHASIS = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|_[^_\n]+_)/g

// A bullet marker in front of a line of dialogue is punctuation, not words. The
// speech strips it too, so the page and the audio agree.
const LEADING_BULLET = /^[ \t]*[*•·]+[ \t]+/gm

const PARAGRAPH_BREAK = /\n\s*\n+/

interface StoryTextProps {
  text: string
  className?: string
}

function emphasise(paragraph: string) {
  return paragraph.split(EMPHASIS).map((part, index) => {
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }

    if (
      part.length > 2 &&
      ((part.startsWith("*") && part.endsWith("*")) ||
        (part.startsWith("_") && part.endsWith("_")))
    ) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }

    return part
  })
}

export function StoryText({ text, className }: StoryTextProps) {
  // Blank lines become spacing between paragraphs rather than empty lines of
  // their own. Left to `pre-wrap` each one costs a full line of leading, and a
  // story that double-spaces its paragraphs ends up mostly gaps.
  const paragraphs = text
    .replace(LEADING_BULLET, "")
    .split(PARAGRAPH_BREAK)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <div className={cn("space-y-4", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="whitespace-pre-wrap break-words">
          {emphasise(paragraph)}
        </p>
      ))}
    </div>
  )
}
