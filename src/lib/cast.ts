// Read the cast off the page, here in the browser.
//
// Working out *who is in a story* needs no model: Hindi and English both name
// the speaker right beside the line — "रवि ने कहा", "Pooja asked" — and that is
// a pattern, not a judgement call. Only two things ever needed a model, and
// this file removes one of them:
//
//   who is in this story   ← found here, instantly, offline
//   who says which line    ← still the model's job
//
// What the model used to guess and now gets told is each character's gender,
// because the listener picks it. That was where the casting went wrong most
// often: a man's lines handed to a woman's voice.

export type Gender = "male" | "female" | "neutral"

export interface Character {
  /** The spelling to show and to send — the one the story used most. */
  name: string
  /** Folds spellings together, so रवि and Ravi are one person. */
  key: string
  /** How many lines were found attributed to them. Drives the ordering. */
  mentions: number
  /** Something they say, so the listener can tell who this is. */
  sample: string
  gender: Gender
  /** A voice pinned by the listener, overriding the pool. */
  voice?: string
}

// --- Name identity ---------------------------------------------------------
//
// A port of services/names.py. It has to stay a port: the keys computed here
// are matched against the keys the backend computes, so the two agreeing is
// what makes a chosen cast actually reach the right character.

const VOWELS: Record<string, string> = {
  अ: "a", आ: "aa", इ: "i", ई: "ii", उ: "u", ऊ: "uu",
  ऋ: "ri", ए: "e", ऐ: "ai", ओ: "o", औ: "au",
}

const MATRAS: Record<string, string> = {
  "ा": "aa", "ि": "i", "ी": "ii", "ु": "u", "ू": "uu",
  "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
}

const CONSONANTS: Record<string, string> = {
  क: "k", ख: "kh", ग: "g", घ: "gh", ङ: "n",
  च: "ch", छ: "chh", ज: "j", झ: "jh", ञ: "n",
  ट: "t", ठ: "th", ड: "d", ढ: "dh", ण: "n",
  त: "t", थ: "th", द: "d", ध: "dh", न: "n",
  प: "p", फ: "ph", ब: "b", भ: "bh", म: "m",
  य: "y", र: "r", ल: "l", व: "v", ळ: "l",
  श: "sh", ष: "sh", स: "s", ह: "h",
  "क़": "q", "ख़": "kh", "ग़": "g", "ज़": "z", "ड़": "r", "ढ़": "rh", "फ़": "f",
}

const SIGNS: Record<string, string> = { "ं": "n", "ः": "h", "ँ": "n" }

const HALANT = "्"
const NUKTA = "़"

// Titles that attach to a name in one sentence and not the next.
const HONORIFICS = new Set([
  "जी", "साहब", "साहिब", "बाबू", "भाई", "बहन", "दीदी", "अंकल", "आंटी",
  "श्री", "श्रीमती", "पंडित", "चाचा", "चाची", "मामा", "मामी", "बुआ",
  "mr", "mrs", "ms", "miss", "sir", "madam", "uncle", "aunty", "ji",
  "the", "a", "an",
])

const WORD_SPLIT = /[\s.,'’\-_/\\|()[\]{}"“”]+/
const NON_LETTER = /[^\p{L}\p{M}\p{N}_]/gu

/** Write a Devanagari name in Latin letters. Latin input passes through. */
export function romanise(name: string): string {
  const out: string[] = []
  let index = 0

  while (index < name.length) {
    const character = name[index]

    if (character === NUKTA) {
      index += 1
      continue
    }

    if (character in CONSONANTS) {
      out.push(CONSONANTS[character])

      // A nukta sits between the consonant and whatever follows it.
      let ahead = index + 1
      while (ahead < name.length && name[ahead] === NUKTA) ahead += 1

      const following = ahead < name.length ? name[ahead] : ""

      if (following in MATRAS) {
        out.push(MATRAS[following])
        index = ahead + 1
      } else if (following === HALANT) {
        index = ahead + 1
      } else {
        // A bare consonant carries an implicit "a": र + व + ि is "ravi", not
        // "rvi", and it is the Latin spelling it has to match.
        out.push("a")
        index += 1
      }

      continue
    }

    out.push(
      VOWELS[character] ?? MATRAS[character] ?? SIGNS[character] ?? character,
    )
    index += 1
  }

  return out.join("")
}

/**
 * A form of a name that survives how it happened to be spelled.
 *
 * Reduced to consonants, because that is what the spellings agree on: Pooja and
 * पूजा romanise to "poojaa" and "puujaa", but both are p-j. A leading vowel is
 * kept, so अमन and मोनू do not collapse into each other.
 */
export function matchKey(name: string): string {
  let words = name
    .trim()
    .split(WORD_SPLIT)
    .filter((word) => word && !HONORIFICS.has(word.toLowerCase()))

  if (!words.length) words = [name.trim()]

  const letters = romanise(words.join("").replace(NON_LETTER, "")).toLowerCase()
  const consonants: string[] = []

  for (const letter of letters) {
    if ("aeiou".includes(letter)) continue

    // An ad-hoc Latin spelling doubles consonants where Devanagari does not —
    // "buddha" against बूढ़ा — so a run counts once.
    if (consonants[consonants.length - 1] === letter) continue

    consonants.push(letter)
  }

  if ("aeiou".includes(letters[0])) consonants.unshift(letters[0])

  return consonants.join("")
}

// --- Finding the cast ------------------------------------------------------

// Verbs of speaking. A stretch of narration carrying one of these is an
// attribution rather than an action, which is what makes the name inside it a
// speaker rather than someone being spoken about.
//
// Each Hindi stem has to start a word — without that, "दूर कहीं एक कुत्ता भौंका"
// contains "कह" and reads as a line of dialogue. "कहीं" itself is excluded
// outright: it is "somewhere" far more often than it is anyone speaking.
const SPEECH_VERB =
  /(?<![ऀ-ॿ])(?:कह(?!ीं)|बोल|पूछ|चिल्ला|चीख|फुसफुसा|बुदबुदा|पुकार|जवाब|उत्तर|टोक|बताया|समझाया|दोहरा|गरज|बड़बड़ा|हँस|रोत|सिसक|मुस्कुरा)|\b(?:said|asked|replied|shouted|whispered|cried|added|murmured|answered|yelled|snapped|muttered|continued|called|repeated|laughed|sobbed)\b/i

// Grammar, not names. Without this a postposition or a pronoun is read as a
// character — and being frequent, it would top the list.
const FUNCTION_WORDS = new Set([
  "ने", "को", "से", "में", "पर", "का", "के", "की", "और", "कि", "है", "था",
  "थी", "थे", "हैं", "वह", "वो", "यह", "ये", "उसने", "उसका", "उसकी", "उसे",
  "मैंने", "मैं", "मुझे", "तुम", "तुमने", "आप", "आपने", "हम", "हमने", "फिर",
  "तो", "भी", "ही", "एक", "अब", "जब", "तब", "सब", "कुछ", "बहुत", "लेकिन",
  "क्या", "क्यों", "कौन", "जो", "अपने", "अपनी", "अपना", "इस", "उस", "किसी",
  "नहीं", "हुआ", "हुई", "गया", "गयी", "गई", "दिया", "लिया", "रहा", "रही",
  // Adverbs and pronouns that open a sentence as readily as a name does.
  "कहीं", "कभी", "अभी", "तभी", "जभी", "यहाँ", "वहाँ", "यहां", "वहां", "दूर",
  "पास", "अंदर", "बाहर", "आगे", "पीछे", "ऊपर", "नीचे", "साथ", "बिना", "जैसे",
  "वैसे", "इसलिए", "क्योंकि", "मगर", "या", "अगर", "हमेशा", "शायद", "सभी",
  "कोई", "उन्होंने", "उन्हें", "उसको", "इसने", "जिसने", "किसने", "दोनों",
  "the", "a", "an", "he", "she", "they", "it", "his", "her", "their", "then",
  "and", "but", "with", "was", "were", "had", "have", "has", "that", "this",
  "there", "here", "who", "what", "when", "why", "not", "for", "from", "you",
  "i", "we", "me", "him", "them", "of", "to", "in", "on", "at", "as", "so",
])

// \p{M} is what carries the vowels in Devanagari — the matra in "रवि" is a
// combining mark, not a letter, and leaving it out tokenises the name as "रव".
const WORDS = /[\p{L}\p{M}\p{N}_]+/gu

// Quoted speech, in whichever convention the story uses.
const QUOTE =
  /["“„]([^"“”„]{1,3000})["”“]|‘([^‘’]{1,3000})’|«([^«»]{1,3000})»|「([^「」]{1,3000})」/gu

// How far back from a speech verb the speaker's name can sit. "उसने धीरे से
// दरवाज़ा बंद किया और फिर रवि ने कहा" is about this long; past it the sentence
// has usually moved on to someone else.
const ATTRIBUTION_WINDOW = 60

// A one-letter name is a stub that collides with far too much ordinary text.
const MIN_NAME_CHARS = 2

// Screenplay format — "रवि: चलो चलते हैं". Capped in length so an ordinary
// sentence using a colon is not read as a cue.
const SCRIPT_CUE = /^[ \t]*([^\s:][^:\n]{0,39}?)[ \t]*:[ \t]*(.*)$/
const MARKDOWN_LINE = /^(?:\*\*.*\*\*|__.*__|#{1,6}\s+.*)$/

const DEVANAGARI = /[ऀ-ॿ]/
const CAPITALISED = /^\p{Lu}/u

interface Sighting {
  name: string
  sample: string
}

function plausible(word: string): boolean {
  if (word.length < MIN_NAME_CHARS) return false
  if (FUNCTION_WORDS.has(word.toLowerCase())) return false

  // "श्री वर्मा ने कहा" is वर्मा speaking, not a character called श्री. Left in,
  // the title reduces to a key of its own and becomes a second person.
  if (HONORIFICS.has(word.toLowerCase())) return false
  if (/^[\p{N}\p{M}]+$/u.test(word)) return false

  // Latin has capitals to lean on and there is no reason not to use them.
  // Devanagari has none, so it is carried by the position alone.
  if (!DEVANAGARI.test(word) && !CAPITALISED.test(word)) return false

  return matchKey(word).length >= MIN_NAME_CHARS
}

// Where one attribution ends and the next begins. A name on the far side of a
// full stop belongs to a different sentence and a different speaker — that is
// what stops "…वह बोली। रवि उठा।" handing रवि the line before it.
const SENTENCE_END = /[.!?।\n]/

// The ergative marker. Hindi puts the speaker in front of it far more reliably
// than word order alone does: in "पूजा ने हैरानी से कहा" the name is four words
// from the verb, and the word actually touching the verb is "से".
const ERGATIVE = "ने"

/** The clause running up to the end of `text` — the one a quote follows. */
function clauseBefore(text: string): string {
  const window = text.slice(-ATTRIBUTION_WINDOW * 2)
  let at = -1

  for (let index = 0; index < window.length; index += 1) {
    if (SENTENCE_END.test(window[index])) at = index
  }

  return window.slice(at + 1)
}

/** The clause starting at `text` — the one a quote is followed by. */
function clauseAfter(text: string): string {
  const window = text.slice(0, ATTRIBUTION_WINDOW * 2)

  for (let index = 0; index < window.length; index += 1) {
    if (SENTENCE_END.test(window[index])) return window.slice(0, index)
  }

  return window
}

/** The name this one clause hands the line beside it, if it names one. */
function speakerIn(clause: string): string | null {
  SPEECH_VERB.lastIndex = 0

  const verb = SPEECH_VERB.exec(clause)

  if (!verb) return null

  const before = clause.slice(0, verb.index)
  const tokens = [...before.matchAll(WORDS)]

  // "रवि ने … कहा" — whoever the marker belongs to is speaking, and it is the
  // last such name that counts, since a clause can mention several people.
  for (let index = tokens.length - 1; index > 0; index -= 1) {
    if (tokens[index][0] === ERGATIVE && plausible(tokens[index - 1][0])) {
      return tokens[index - 1][0]
    }
  }

  // "रवि चिल्लाया", "Pooja asked" — no marker, so the name has to be the word
  // actually touching the verb. Anything further back is scenery.
  const nearest = tokens[tokens.length - 1]

  if (
    nearest &&
    before.length - (nearest.index + nearest[0].length) <= 1 &&
    plausible(nearest[0])
  ) {
    return nearest[0]
  }

  // "…, said Ravi." Only worth looking for after an English verb: Hindi puts
  // its verb at the end of the clause, so anything past it is not a speaker.
  if (!/^[a-z]+$/i.test(verb[0])) return null

  const ahead = [...clause.slice(verb.index + verb[0].length).matchAll(WORDS)]

  return ahead.length && plausible(ahead[0][0]) ? ahead[0][0] : null
}

/**
 * Names carried by narration that speaks about someone without quoting them.
 *
 * "रवि कुछ बोल नहीं पाया" names a character in a sentence about speech, and a
 * story's lead is often introduced exactly this way and then referred to as
 * "उसने" for pages — found nowhere else, they would be missing from their own
 * cast list. Requiring both signals at once, the sentence opening on the name
 * *and* the sentence being about speaking, is what keeps "पानी बढ़ रहा था" out.
 */
function fromSubjects(narration: string[]): Sighting[] {
  const sightings: Sighting[] = []

  for (const passage of narration) {
    for (const sentence of passage.split(/(?<=[.!?।])\s+|\n+/)) {
      SPEECH_VERB.lastIndex = 0

      if (!SPEECH_VERB.test(sentence)) continue

      const first = WORDS.exec(sentence.trim())

      WORDS.lastIndex = 0

      // Only the very first word. A clause opening on a pronoun is telling us
      // nothing, and reaching past it for the next noun finds the verb.
      if (first && first.index === 0 && plausible(first[0])) {
        sightings.push({ name: first[0], sample: "" })
      }
    }
  }

  return sightings
}

function fromScript(text: string): Sighting[] {
  const lines = text.split("\n").filter((line) => line.trim())
  const sightings: Sighting[] = []
  let cues = 0

  for (const line of lines) {
    if (MARKDOWN_LINE.test(line.trim())) continue

    const cue = SCRIPT_CUE.exec(line)

    if (!cue) continue

    const name = cue[1].trim()

    if (name.startsWith("*") || name.startsWith("_") || name.startsWith("#")) {
      continue
    }

    cues += 1

    if (plausible(name.split(/\s+/)[0])) {
      sightings.push({ name, sample: cue[2].trim() })
    }
  }

  // The same handful of people speak more than once in a real script. Prose
  // that happens to use colons throws up a different "speaker" every time.
  const distinct = new Set(sightings.map((s) => matchKey(s.name))).size

  if (cues < 4 || distinct < 2 || cues / lines.length < 0.15) return []
  if (distinct > cues * 0.75) return []

  return sightings
}

function fromProse(text: string): Sighting[] {
  const sightings: Sighting[] = []
  const narration: string[] = []
  let cursor = 0

  QUOTE.lastIndex = 0

  const quotes = [...text.matchAll(QUOTE)]

  for (const [position, quote] of quotes.entries()) {
    const spoken = (quote.slice(1).find(Boolean) ?? "").trim()
    const before = text.slice(cursor, quote.index)
    const ends = quote.index + quote[0].length
    const after = text.slice(ends, quotes[position + 1]?.index ?? text.length)

    narration.push(before)

    // The narration *after* a line is the commoner attribution in Hindi —
    // "…रुको।" रवि चिल्लाया। — so it is asked first. Each side is cut back to
    // the clause touching the quote, so a name in the sentence beyond it is
    // never read as this line's speaker.
    const name =
      speakerIn(clauseAfter(after)) ?? speakerIn(clauseBefore(before))

    if (name && spoken) sightings.push({ name, sample: spoken })

    cursor = ends
  }

  narration.push(text.slice(cursor))

  return [...sightings, ...fromSubjects(narration)]
}

/**
 * Everyone who speaks in this story, most talkative first.
 *
 * Runs entirely on the text in front of it — no request, no key, no waiting.
 * Names are folded by `matchKey`, so a character spelled two ways is one entry
 * and the spelling that appeared most often is the one shown.
 */
export function findCast(text: string): Character[] {
  if (!text.trim()) return []

  const script = fromScript(text)
  const sightings = script.length ? script : fromProse(text)

  const found = new Map<
    string,
    { spellings: Map<string, number>; mentions: number; sample: string }
  >()

  for (const { name, sample } of sightings) {
    const key = matchKey(name)

    if (!key) continue

    const entry = found.get(key) ?? {
      spellings: new Map<string, number>(),
      mentions: 0,
      sample: "",
    }

    entry.spellings.set(name, (entry.spellings.get(name) ?? 0) + 1)
    entry.mentions += 1

    // The first line long enough to recognise someone by. A two-word reply
    // says nothing about who is speaking.
    if (sample.length > entry.sample.length && entry.sample.length < 60) {
      entry.sample = sample
    }

    found.set(key, entry)
  }

  return [...found.entries()]
    .map(([key, entry]) => ({
      key,
      // Whichever spelling the story used most often is the one to show, and
      // the one to send — the backend folds the rest onto it anyway.
      name: [...entry.spellings.entries()].sort((a, b) => b[1] - a[1])[0][0],
      mentions: entry.mentions,
      sample: entry.sample,
      gender: "neutral" as Gender,
    }))
    .sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name))
}

/** The shape the reader sends to the backend: name → who they are. */
export type ChosenCast = Record<string, { gender: Gender; voice?: string }>

export function toChosenCast(cast: Character[]): ChosenCast {
  const chosen: ChosenCast = {}

  for (const character of cast) {
    // A character left as "neutral" with no voice is telling the backend
    // nothing it did not already assume, so it is left out entirely.
    if (character.gender === "neutral" && !character.voice) continue

    chosen[character.name] = {
      gender: character.gender,
      ...(character.voice ? { voice: character.voice } : {}),
    }
  }

  return chosen
}
