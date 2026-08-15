import { useEffect, useState } from "react"
import {
  AudioLines,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  Languages,
  Loader2,
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
import { AudioPlayer } from "@/components/audio-player"
import { StoryText } from "@/components/story-text"
import { buildDownloadUrl, createAudioStream, toDevanagari } from "@/lib/api"
import { cn } from "@/lib/utils"
import { VOICES, DEFAULT_VOICE } from "@/lib/voices"

export default function Home() {
  const [text, setText] = useState("")
  const [voice, setVoice] = useState(DEFAULT_VOICE)
  const [rate, setRate] = useState(0)
  const [multiVoice, setMultiVoice] = useState(true)
  const [showOptions, setShowOptions] = useState(false)
  const [reading, setReading] = useState(false)
  const [converting, setConverting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [estimatedSeconds, setEstimatedSeconds] = useState(0)
  const [wasCast, setWasCast] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState("voice-maker-output")

  const charCount = text.length
  const rateLabel = `${rate >= 0 ? "+" : ""}${rate}%`
  const safeDownloadName = `${downloadName.trim() || "audio"}.mp3`
  const shortVoiceLabel = (
    VOICES.find((v) => v.value === voice)?.label ?? "Voice"
  ).split("—")[0].trim()

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
    setAudioSrc(null)

    try {
      const stream = await createAudioStream({
        text,
        voice,
        rate: rateLabel,
        multiVoice,
      })
      setWasCast(multiVoice)
      setEstimatedSeconds(stream.estimatedSeconds)
      setAudioSrc(stream.streamUrl)
      setReading(true)
    } catch (err) {
      console.error("Audio generation failed:", err)
      setError("Something went wrong while generating audio. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const showReader = reading && audioSrc

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {showReader && (
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-2 py-2 backdrop-blur">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setReading(false)}
            aria-label="Back to editing"
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
          <span className="shrink-0 pr-2 text-xs text-muted-foreground">
            .mp3 · {wasCast ? "multi-voice" : shortVoiceLabel}
          </span>
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
                <span className="text-xs text-muted-foreground tabular-nums">
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
                onClick={() => setReading(true)}
              >
                <BookOpen />
                Back to reading
              </Button>
            )}
          </div>
        </div>
      )}

      {/*
        Deliberately rendered outside both views: moving it between them would
        unmount the <audio> element, and the reading would jump back to the
        beginning every time you switched screens.
      */}
      {audioSrc && (
        <div className="sticky bottom-0 z-10 border-t bg-background/95 px-4 pt-3 pb-5 backdrop-blur">
          <div className="mx-auto w-full max-w-2xl">
            <AudioPlayer
              compact
              src={audioSrc}
              downloadUrl={buildDownloadUrl(audioSrc, safeDownloadName)}
              downloadName={safeDownloadName}
              estimatedSeconds={estimatedSeconds}
              autoPlay
            />
          </div>
        </div>
      )}
    </div>
  )
}
