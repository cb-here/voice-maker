// Reading the story the way the page shows it, and finding words in it.
//
// The reader does not display the text it was given: bullet markers in front of
// dialogue are punctuation rather than words, and **bold** is set in bold rather
// than printed with its asterisks. Searching has to run on what is actually on
// the page — somebody looking for "रवि" means the name, not `**रवि**`.

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

export type Emphasis = "strong" | "em" | null

export interface Part {
  text: string
  as: Emphasis
}

/** The story as it is shown: bullets gone, emphasis markers gone, words left. */
export function parseStory(text: string): Part[][] {
  return text
    .replace(LEADING_BULLET, "")
    .split(PARAGRAPH_BREAK)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) =>
      paragraph
        .split(EMPHASIS)
        .filter(Boolean)
        .map((part): Part => {
          if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
            return { text: part.slice(2, -2), as: "strong" }
          }

          if (
            part.length > 2 &&
            ((part.startsWith("*") && part.endsWith("*")) ||
              (part.startsWith("_") && part.endsWith("_")))
          ) {
            return { text: part.slice(1, -1), as: "em" }
          }

          return { text: part, as: null }
        }),
    )
}

/** Every place `needle` sits inside `haystack`, ignoring case. */
export function positions(haystack: string, needle: string): number[] {
  const lowered = haystack.toLowerCase()

  // Lowercasing changes the length of a handful of characters in a handful of
  // scripts, and a shifted index highlights the wrong span. Devanagari is
  // unaffected, but a story can hold anything, so the case-blind search is only
  // used where the two still line up.
  const aligned = lowered.length === haystack.length
  const searchable = aligned ? lowered : haystack
  const term = aligned ? needle.toLowerCase() : needle

  const found: number[] = []
  let at = searchable.indexOf(term)

  while (at !== -1) {
    found.push(at)
    at = searchable.indexOf(term, at + term.length)
  }

  return found
}

/** How many times `query` appears in the story as it is displayed. */
export function countMatches(text: string, query: string): number {
  const term = query.trim()

  if (!term) return 0

  return parseStory(text).reduce(
    (total, paragraph) =>
      total +
      paragraph.reduce(
        (sum, part) => sum + positions(part.text, term).length,
        0,
      ),
    0,
  )
}
