import { useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Check,
  ChevronLeft,
  Copy,
  Download,
  FileText,
  Headphones,
  Loader2,
  Save,
  Scissors,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { saveStory } from "@/lib/library"
import {
  readingTime,
  splitStory,
  type Part,
  type SplitMode,
} from "@/lib/split"
import { DEFAULT_VOICE } from "@/lib/voices"
import { cn } from "@/lib/utils"

const MAX_FILE_BYTES = 2_000_000

// Chapter mode takes no number — the story already says where it breaks.
const DEFAULTS: Record<SplitMode, number> = { size: 20000, count: 5, chapter: 0 }

const MODE_LABELS: Record<SplitMode, string> = {
  size: "By size",
  count: "By parts",
  chapter: "By chapter",
}

// What each part is called, before its number. Everything a part is named for —
// the card, the .txt filename, the entry in My Stories — comes from this, so
// renaming it once renames all of them together.
const DEFAULT_PREFIX = "Part"

function count(n: number) {
  return n.toLocaleString()
}

export default function Split() {
  const navigate = useNavigate()
  const handover = useLocation().state as { text?: string } | null

  const [text, setText] = useState(handover?.text ?? "")
  const [mode, setMode] = useState<SplitMode>("size")
  const [value, setValue] = useState(DEFAULTS.size)
  const [prefix, setPrefix] = useState(DEFAULT_PREFIX)
  const [copied, setCopied] = useState<number | null>(null)
  const [savedParts, setSavedParts] = useState<Set<number>>(new Set())
  const [savingAll, setSavingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  // A chapter names itself, so its own heading wins over the numbering.
  // Everything without one — a prologue, a scene cut, every part in the
  // other two modes — falls back to the prefix.
  const nameOf = (part: Part) =>
    part.title ?? `${prefix.trim() || DEFAULT_PREFIX} ${part.index}`

  // Splitting is pure text work, so it can run on every keystroke rather than
  // behind a button — the parts update as the numbers are typed.
  const parts = useMemo(
    () => (mode === "chapter" || value > 0 ? splitStory(text, mode, value) : []),
    [text, mode, value],
  )

  const oversized = parts.filter((part) => part.oversized).length

  const chooseMode = (next: SplitMode) => {
    setMode(next)
    setValue(DEFAULTS[next])
    setSavedParts(new Set())
  }

  const savePart = async (part: Part) => {
    setError(null)

    try {
      await saveStory({
        title: nameOf(part),
        text: part.text,
        // The reader picks these up from its own defaults when a saved story
        // does not carry a preference of its own.
        voice: DEFAULT_VOICE,
        rate: 0,
        multiVoice: true,
      })
      setSavedParts((done) => new Set(done).add(part.index))
    } catch (err) {
      console.error("Could not save the part:", err)
      setError("Could not save on this device.")
    }
  }

  const saveAll = async () => {
    setSavingAll(true)

    for (const part of parts) {
      await savePart(part)
    }

    setSavingAll(false)
  }

  const openFile = async (file: File | undefined) => {
    if (!file) return

    setError(null)

    if (file.size > MAX_FILE_BYTES) {
      setError(
        `That file is ${Math.round(file.size / 1000)} KB. Please open one under ${
          MAX_FILE_BYTES / 1000
        } KB.`,
      )
      return
    }

    setText(await file.text())
  }

  const copyPart = async (part: Part) => {
    try {
      await navigator.clipboard.writeText(part.text)
      setCopied(part.index)
      setTimeout(() => setCopied(null), 1800)
    } catch (err) {
      console.error("Could not copy:", err)
      setError("Your browser would not let the app copy that.")
    }
  }

  const downloadPart = (part: Part) => {
    const url = URL.createObjectURL(
      new Blob([part.text], { type: "text/plain;charset=utf-8" }),
    )
    const link = document.createElement("a")

    link.href = url
    link.download = `${nameOf(part).replace(/[\\/:*?"<>|]/g, "-")}.txt`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-2 py-2 backdrop-blur">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate("/home")}
          aria-label="Back"
        >
          <ChevronLeft />
        </Button>
        <span className="text-sm font-medium">Split a long story</span>
        <span className="ml-auto whitespace-nowrap pr-2 text-xs text-muted-foreground">
          {parts.length ? `${parts.length} parts` : "—"}
        </span>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-5 px-4 py-5">
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the whole story here, or open a .txt file."
            className="max-h-64 min-h-40 overflow-y-auto"
          />

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => openFile(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInput.current?.click()}
            >
              <FileText />
              Open file
            </Button>
            {text && (
              <Button variant="ghost" size="sm" onClick={() => setText("")}>
                Clear
              </Button>
            )}
            <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
              {count(text.length)} characters
            </span>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border p-0.5">
              {(["size", "count", "chapter"] as SplitMode[]).map((option) => (
                <button
                  key={option}
                  onClick={() => chooseMode(option)}
                  className={cn(
                    "rounded px-3 py-1 text-sm transition-colors",
                    mode === option
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {MODE_LABELS[option]}
                </button>
              ))}
            </div>

            {mode !== "chapter" && (
              <>
                <Input
                  type="number"
                  min={1}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-28"
                  aria-label={
                    mode === "size" ? "Characters per part" : "Number of parts"
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {mode === "size" ? "characters each" : "parts"}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="part-name"
              className="text-sm text-muted-foreground"
            >
              Name them
            </label>
            <Input
              id="part-name"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder={DEFAULT_PREFIX}
              className="w-40"
            />
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              → {nameOf({ index: 1, text: "", chars: 0, oversized: false })},{" "}
              {nameOf({ index: 2, text: "", chars: 0, oversized: false })}…
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            {mode === "chapter"
              ? "Cut where the story says a chapter begins — a heading, or a rule between scenes. Each part is named after its own heading."
              : "Parts are cut at paragraph and sentence boundaries only — a sentence never ends up half in one part and half in the next."}
          </p>
        </div>

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {error}
          </p>
        )}

        {mode === "chapter" && text.trim() && !parts.length && (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            No chapter headings found. This story marks its breaks some other
            way — try By size or By parts instead.
          </p>
        )}

        {oversized > 0 && (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            {oversized === 1 ? "One part is" : `${oversized} parts are`} longer
            than asked for: a single sentence there is bigger than the target,
            and cutting through it would have split it mid-thought.
          </p>
        )}

        {parts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={saveAll}
              disabled={savingAll}
            >
              {savingAll ? <Loader2 className="animate-spin" /> : <Save />}
              Save all to My Stories
            </Button>
            {savedParts.size > 0 && (
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {savedParts.size} of {parts.length} saved
              </span>
            )}
            <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
              ≈ {readingTime(text.trim().length)} in all
            </span>
          </div>
        )}

        <div className="space-y-3">
          {parts.map((part) => (
            <div key={part.index} className="space-y-2 rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{nameOf(part)}</span>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs",
                    part.oversized
                      ? "text-amber-600 dark:text-amber-500"
                      : "text-muted-foreground",
                  )}
                >
                  {count(part.chars)} characters · ≈ {readingTime(part.chars)}
                </span>

                <div className="ml-auto flex flex-wrap gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => copyPart(part)}
                    aria-label={`Copy ${nameOf(part)}`}
                  >
                    {copied === part.index ? <Check /> : <Copy />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => downloadPart(part)}
                    aria-label={`Download ${nameOf(part)}`}
                  >
                    <Download />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => savePart(part)}
                    aria-label={`Save ${nameOf(part)} to My Stories`}
                  >
                    {savedParts.has(part.index) ? <Check /> : <Save />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      navigate("/home", {
                        state: {
                          story: { text: part.text, title: nameOf(part) },
                        },
                      })
                    }
                    aria-label={`Read ${nameOf(part)}`}
                  >
                    <Headphones />
                  </Button>
                </div>
              </div>

              <p className="line-clamp-3 text-xs whitespace-pre-wrap text-muted-foreground">
                {part.text.trim().slice(0, 240)}
              </p>
            </div>
          ))}

          {!parts.length && text.trim() && (
            <p className="text-sm text-muted-foreground">
              Nothing to split yet — set a size or a number of parts above.
            </p>
          )}

          {!text.trim() && (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Scissors className="size-6" />
              Paste a story above to cut it into parts.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
