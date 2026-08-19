// Cut a long story into parts without ever cutting a sentence in half.
//
// Every part is an exact slice of the original — nothing is rewritten, respaced
// or dropped — so pasting the parts back end to end gives the story back
// character for character. That matters most for scripts, where a line break is
// what says who is speaking.

export interface Part {
  index: number
  text: string
  chars: number
  // The heading this part opened on, when it was cut at one. Chapter mode names
  // a part after its own chapter instead of numbering it.
  title?: string
  // True when a single sentence was on its own longer than the target, so this
  // part had to run over rather than be cut through the middle of it.
  oversized: boolean
}

export type SplitMode = "size" | "count" | "chapter"

// Places a cut is allowed. In order of how clean the break is: a blank line
// between paragraphs, then any line break, then the end of a sentence.
// A closing quote may follow the full stop — "…रुको।" ends a sentence too.
const CUTS = [
  /\n[ \t]*\n[\s]*/g, // paragraph break
  /\n/g, // line break
  /[।.!?…]["'”’»]?[ \t]+/g, // sentence end, mid-line
]

// Below this a "part" is not a part, it is a fragment. Used to stop the last
// part being a stray sentence when the packing lands badly.
const MIN_TAIL_CHARS = 200

function cutPoints(text: string): number[] {
  const points = new Set<number>([0, text.length])

  for (const pattern of CUTS) {
    pattern.lastIndex = 0

    for (const match of text.matchAll(pattern)) {
      points.add(match.index + match[0].length)
    }
  }

  return [...points].sort((a, b) => a - b)
}

/** Pack the text into parts of at most `target` characters, cutting only at `points`. */
function pack(text: string, points: number[], target: number): Part[] {
  const parts: Part[] = []
  let start = 0

  while (start < text.length) {
    const limit = start + target

    // The last boundary that still fits. `points` is sorted, so a scan from the
    // end of the previous part finds it without rescanning the whole story.
    let end = 0

    for (const point of points) {
      if (point <= start) continue
      if (point > limit) break

      end = point
    }

    let oversized = false

    if (end === 0) {
      // Nothing fits: one sentence is longer than the whole target. Running
      // over is the lesser evil — cutting here would split it mid-thought.
      end = points.find((point) => point > start) ?? text.length
      oversized = true
    }

    // A final scrap is folded back into the part before it rather than shipped
    // as a part of its own.
    if (text.length - end < MIN_TAIL_CHARS) {
      end = text.length
    }

    const slice = text.slice(start, end)

    if (slice.trim()) {
      parts.push({
        index: parts.length + 1,
        text: slice,
        chars: slice.length,
        oversized,
      })
    }

    start = end
  }

  return parts
}

/**
 * Split into parts of at most `size` characters each.
 *
 * A part can still come out longer when a single unbroken sentence exceeds
 * `size`; that part is flagged rather than cut.
 */
export function splitBySize(text: string, size: number): Part[] {
  const trimmed = text.trim()

  if (!trimmed || size <= 0) return []

  return pack(trimmed, cutPoints(trimmed), size)
}

/**
 * Split into at most `count` parts, as evenly as the sentence boundaries allow.
 *
 * Found by searching for the smallest per-part size that still fits in `count`
 * parts, so the parts come out close to the same length instead of the last one
 * being a remainder.
 */
export function splitByCount(text: string, count: number): Part[] {
  const trimmed = text.trim()

  if (!trimmed || count <= 0) return []
  if (count === 1) return splitBySize(trimmed, trimmed.length)

  const points = cutPoints(trimmed)

  let low = Math.ceil(trimmed.length / count)
  let high = trimmed.length
  let best = pack(trimmed, points, high)

  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    const attempt = pack(trimmed, points, middle)

    if (attempt.length <= count) {
      best = attempt
      high = middle - 1
    } else {
      low = middle + 1
    }
  }

  return best
}

// --- Chapters -------------------------------------------------------------
//
// A long story usually already says where its own seams are. Cutting on those
// beats cutting every 20,000 characters: a part ends where the author ended
// something, and it arrives with a name of its own.

// Words that only ever head a section. `\b` is no help across Devanagari — it
// is defined on ASCII word characters, so it never fires between "अध्याय" and
// the colon after it — and the boundary has to be spelled out instead: the word
// must not run on into another one ("भागना" is not "भाग").
const CHAPTER_WORD =
  /^[#*_>\s]*(?:(?:अध्याय|प्रकरण|पर्व|काण्ड|कांड|खण्ड|खंड)(?![\u0900-\u097F])|(?:chapter|episode|section)\b)/iu

// Words that head a section only once a number follows. "भाग" is "run away" as
// often as it is "part", and an English "Part" opens plenty of ordinary
// sentences, so on their own they are not evidence of anything.
const CHAPTER_NUMBERED =
  /^[#*_>\s]*(?:(?:भाग|अंक|सर्ग)(?![\u0900-\u097F])|part\b)[\s.:\-–—]*(?:[0-9०-९]+|[ivxlcdm]+(?![a-z]))/iu
// A markdown heading. Whatever it says, the author marked it as a break.
const CHAPTER_HEADING = /^\s*#{1,6}\s+\S/
// A rule between scenes — "***", "---", "* * *".
const CHAPTER_RULE = /^\s*(?:[*\-—–_=~•·]\s*){3,}$/

// A heading is a line, not a paragraph. Without a ceiling, prose that happens
// to open with "भाग" takes a whole page with it.
const HEADING_MAX_CHARS = 80

function isHeading(line: string, allowRules: boolean): boolean {
  const trimmed = line.trim()

  if (!trimmed) return false
  if (CHAPTER_RULE.test(trimmed)) return allowRules
  if (trimmed.length > HEADING_MAX_CHARS) return false

  return (
    CHAPTER_HEADING.test(trimmed) ||
    CHAPTER_WORD.test(trimmed) ||
    CHAPTER_NUMBERED.test(trimmed)
  )
}

function headingTitle(line: string): string | undefined {
  const trimmed = line.trim()

  // A rule says "a break happens here" and nothing more, so the part it opens
  // falls back to being numbered like any other.
  if (CHAPTER_RULE.test(trimmed)) return undefined

  const cleaned = trimmed
    .replace(/^[#>\s]+/, "")
    .replace(/[*_`]/g, "")
    .trim()

  return cleaned || undefined
}

function headings(lines: string[], allowRules: boolean) {
  const found: { at: number; title?: string }[] = []
  let offset = 0

  for (const line of lines) {
    if (isHeading(line, allowRules)) {
      found.push({ at: offset, title: headingTitle(line) })
    }

    // +1 for the newline that splitting removed, so offsets stay true to the
    // original text and the parts still rejoin exactly.
    offset += line.length + 1
  }

  return found
}

/**
 * Split where the story says a chapter begins.
 *
 * Returns an empty list when the text carries no headings at all, so the caller
 * can say so rather than hand back one part containing everything.
 */
export function splitByChapter(text: string): Part[] {
  const trimmed = text.trim()

  if (!trimmed) return []

  const lines = trimmed.split("\n")

  // Named chapters first. Scene rules are only read as breaks when there are no
  // real headings to be found — a story that uses "***" between every scene has
  // dozens of them, and cutting on all of them is not what was asked for.
  let marks = headings(lines, false)

  if (!marks.length) marks = headings(lines, true)
  if (!marks.length) return []

  // Whatever comes before the first heading — a title page, a prologue — is a
  // part of its own rather than being glued to the front of chapter one.
  if (marks[0].at > 0) marks = [{ at: 0 }, ...marks]

  const parts: Part[] = []

  for (const [position, mark] of marks.entries()) {
    const end = marks[position + 1]?.at ?? trimmed.length
    const slice = trimmed.slice(mark.at, end)

    if (!slice.trim()) continue

    parts.push({
      index: parts.length + 1,
      text: slice,
      chars: slice.length,
      oversized: false,
      title: mark.title,
    })
  }

  return parts
}

// --- Reading time ---------------------------------------------------------

// Taken from the reading itself rather than from a words-per-minute rule of
// thumb: the synthesiser speaks about 0.077 seconds of audio per character at
// the default speed. Enough to tell ten minutes from two hours, which is the
// only question being asked before pressing play.
export const SECONDS_PER_CHAR = 0.077

export function readingTime(chars: number): string {
  const minutes = Math.round((chars * SECONDS_PER_CHAR) / 60)

  if (minutes < 1) return "under a minute"

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (!hours) return `${minutes} min`

  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function splitStory(
  text: string,
  mode: SplitMode,
  value: number,
): Part[] {
  if (mode === "chapter") return splitByChapter(text)

  return mode === "size" ? splitBySize(text, value) : splitByCount(text, value)
}
