import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  Headphones,
  Languages,
  Library as LibraryIcon,
  Loader2,
  Save,
  Users,
  Wand2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { StoryText } from "@/components/story-text"
import { useAudio } from "@/components/audio-host"
import { createAudioStream, toDevanagari } from "@/lib/api"
import { cn } from "@/lib/utils"
import { VOICES, DEFAULT_VOICE } from "@/lib/voices"
import { saveStory, titleFrom, type Story } from "@/lib/library"

export default function Home() {
  const navigate = useNavigate()
  const { track, play, downloadName, setDownloadName } = useAudio()
  // A story handed over by the library. It is there on the very first render,
  // so it seeds the state directly rather than being copied in by an effect.
  const handover = useLocation().state as
    | { story?: Story; read?: boolean }
    | null
  const opened = handover?.story

  const [text, setText] = useState(opened?.text ?? "")
  const [voice, setVoice] = useState(opened?.voice ?? DEFAULT_VOICE)
  const [rate, setRate] = useState(opened?.rate ?? 0)
  const [multiVoice, setMultiVoice] = useState(opened?.multiVoice ?? true)
  const [showOptions, setShowOptions] = useState(false)
  const [reading, setReading] = useState(Boolean(handover?.read))
  const [converting, setConverting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storyId, setStoryId] = useState<string | undefined>(opened?.id)
  // The title is the story's identity. Editing the body keeps updating the same
  // entry; replacing the text gives it a new first line, and that is taken as a
  // different story rather than silently overwriting the old one.
  const [savedTitle, setSavedTitle] = useState(opened?.title)
  const [saved, setSaved] = useState<"idle" | "saving" | "done">("idle")
  // Opened from the library to read, so back belongs there rather than in the
  // editor. Cleared once the editor is reached, so back stops jumping away.
  const [fromLibrary, setFromLibrary] = useState(Boolean(handover?.read))

  const leaveReader = () => {
    if (fromLibrary) {
      navigate("/library")
      return
    }

    setReading(false)
  }

  const audioSrc = track?.src ?? null

  const charCount = text.length
  const rateLabel = `${rate >= 0 ? "+" : ""}${rate}%`
  const shortVoiceLabel = (
    VOICES.find((v) => v.value === voice)?.label ?? "Voice"
  ).split("—")[0].trim()

  const handleSave = async () => {
    if (!text.trim()) return

    setSaved("saving")

    const title = titleFrom(text)

    try {
      const story = await saveStory({
        id: title === savedTitle ? storyId : undefined,
        title,
        text,
        voice,
        rate,
        multiVoice,
      })
      setStoryId(story.id)
      setSavedTitle(story.title)
      setSaved("done")
      setTimeout(() => setSaved("idle"), 1800)
    } catch (err) {
      console.error("Could not save the story:", err)
      setError("Could not save the story on this device.")
      setSaved("idle")
    }
  }

  const hasWorkInProgress = loading || Boolean(audioSrc)

  useEffect(() => {
    if (!hasWorkInProgress) return

    const confirmLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", confirmLeave)
    return () => window.removeEventListener("beforeunload", confirmLeave)
  }, [hasWorkInProgress])

  const handleConvert = async () => {
    if (!text.trim()) return

    setConverting(true)
    setError(null)

    try {
      setText(await toDevanagari(text))
    } catch (err) {
      console.error("Devanagari conversion failed:", err)
      setError("Could not convert the text. Please try again.")
    } finally {
      setConverting(false)
    }
  }

  const handleGenerate = async () => {
    if (!text.trim()) return

    setLoading(true)
    setError(null)

    try {
      const stream = await createAudioStream({
        text,
        voice,
        rate: rateLabel,
        multiVoice,
      })
      play({
        src: stream.streamUrl,
        estimatedSeconds: stream.estimatedSeconds,
        label: multiVoice ? "multi-voice" : shortVoiceLabel,
      })
      setReading(true)
    } catch (err) {
      console.error("Audio generation failed:", err)
      setError("Something went wrong while generating audio. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Reading does not depend on audio existing: a saved story can be opened
  // just to read, and listening started later from inside the reader.
  const showReader = reading && text.trim().length > 0

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {showReader && (
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-2 py-2 backdrop-blur">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={leaveReader}
            aria-label={fromLibrary ? "Back to My Stories" : "Back to editing"}
          >
            <ChevronLeft />
          </Button>
          {/* Doubles as the download filename, so it can be renamed without
              leaving the reader. */}
          <input
            value={downloadName}
            onChange={(e) => setDownloadName(e.target.value)}
            placeholder="voice-maker-output"
            aria-label="Download filename"
            className="min-w-0 flex-1 rounded bg-transparent px-1 py-1 text-sm font-medium outline-none focus:bg-muted"
          />
          {audioSrc ? (
            <span className="shrink-0 pr-2 text-xs text-muted-foreground">
              .mp3 · {track?.label}
            </span>
          ) : (
            /* Opened purely to read, so offer to start the audio from here. */
            <Button
              size="sm"
              className="shrink-0"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Headphones />}
              Listen
            </Button>
          )}
        </header>
      )}

      {showReader ? (
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-6">
          <StoryText
            text={text}
            className="font-hand text-[22px] leading-[1.75] text-foreground"
          />
        </main>
      ) : (
        <div className="flex-1 bg-muted/40 px-4 py-6 sm:py-16">
          <div className="mx-auto w-full max-w-2xl space-y-5 sm:space-y-6">
        <div className="space-y-2 text-center sm:space-y-3">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-12">
            <AudioLines className="size-5" />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-4xl">
            Voice Maker
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/library")}
          >
            <LibraryIcon />
            My Stories
          </Button>
          <p className="mx-auto hidden max-w-md text-sm text-muted-foreground sm:block">
            Turn your text into natural-sounding speech and play, scrub, or
            download the result.
          </p>
        </div>

        <Card>
          <CardHeader className="hidden border-b sm:block">
            <CardTitle>Your Text</CardTitle>
            <CardDescription>
              Enter the text you want to convert into audio.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Textarea
                placeholder="Type or paste your text here…"
                value={text}
                rows={7}
                onChange={(e) => setText(e.target.value)}
                className="max-h-[60vh] min-h-[46vh] resize-y overflow-y-auto overscroll-contain rounded-md border border-input bg-background px-4 py-3 text-[17px] leading-[1.85] focus-visible:border-ring sm:max-h-96 sm:min-h-48 md:text-base"
              />
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConvert}
                  disabled={!text.trim() || converting || loading}
                  title="Rewrite Roman-script Hindi and stray scan text as clean Devanagari"
                >
                  {converting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Converting…
                    </>
                  ) : (
                    <>
                      <Languages />
                      हिंदी में बदलें
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={!text.trim() || saved === "saving"}
                  title="Keep this story on this device"
                >
                  {saved === "saving" ? (
                    <Loader2 className="animate-spin" />
                  ) : saved === "done" ? (
                    <Check />
                  ) : (
                    <Save />
                  )}
                  {saved === "done" ? "Saved" : "Save"}
                </Button>

                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {charCount} {charCount === 1 ? "character" : "characters"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOptions((open) => !open)}
              aria-expanded={showOptions}
              className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2.5 text-sm sm:hidden"
            >
              <span className="truncate text-muted-foreground">
                {shortVoiceLabel} · {rateLabel}
                {multiVoice ? " · multi-voice" : ""}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  showOptions && "rotate-180"
                )}
              />
            </button>

            <div
              className={cn(
                "space-y-4 sm:space-y-5",
                !showOptions && "hidden sm:block"
              )}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {multiVoice ? "Narrator voice" : "Voice"}
                  </label>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICES.map((v) => (
                        <SelectItem key={v.value} value={v.value}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Speed</label>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {rateLabel}
                    </span>
                  </div>
                  <Slider
                    value={[rate]}
                    min={-50}
                    max={50}
                    step={5}
                    onValueChange={(v) => setRate(v[0])}
                    aria-label="Speed"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-md border border-input bg-background p-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={multiVoice}
                  aria-label="Multiple voices"
                  onClick={() => setMultiVoice((on) => !on)}
                  className={cn(
                    "mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    multiVoice ? "bg-primary" : "bg-input"
                  )}
                >
                  <span
                    className={cn(
                      "size-4 rounded-full bg-background shadow transition-transform",
                      multiVoice ? "translate-x-[1.125rem]" : "translate-x-0.5"
                    )}
                  />
                </button>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5 text-muted-foreground" />
                    <label className="text-sm font-medium">
                      Multiple voices
                    </label>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                      Beta
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reads dialogue in a separate voice per character. Adds a few
                    seconds up front while the story is analysed.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Download filename</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={downloadName}
                    onChange={(e) => setDownloadName(e.target.value)}
                    placeholder="voice-maker-output"
                  />
                  <span className="text-sm text-muted-foreground">.mp3</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!text.trim() || loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  <Wand2 />
                  Generate Audio
                </>
              )}
            </Button>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}
          </CardContent>
        </Card>

            {audioSrc && (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => {
                  // Reached the editor under its own steam, so the reader's
                  // back button belongs here, not at the library.
                  setFromLibrary(false)
                  setReading(true)
                }}
              >
                <BookOpen />
                Back to reading
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
