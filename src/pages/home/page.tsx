import { useState } from "react"
import { AudioLines, Loader2, Wand2 } from "lucide-react"

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
import { generateAudio } from "@/lib/api"
import { VOICES, DEFAULT_VOICE } from "@/lib/voices"

export default function Home() {
  const [text, setText] = useState("")
  const [voice, setVoice] = useState(DEFAULT_VOICE)
  const [rate, setRate] = useState(0)
  const [loading, setLoading] = useState(false)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState("voice-maker-output")

  const charCount = text.length
  const rateLabel = `${rate >= 0 ? "+" : ""}${rate}%`
  const safeDownloadName = `${downloadName.trim() || "audio"}.mp3`

  const handleGenerate = async () => {
    if (!text.trim()) return

    setLoading(true)
    setError(null)

    if (audioSrc) {
      URL.revokeObjectURL(audioSrc)
    }
    setAudioSrc(null)

    try {
      const url = await generateAudio({ text, voice, rate: rateLabel })
      setAudioSrc(url)
    } catch (err) {
      console.error("Audio generation failed:", err)
      setError("Something went wrong while generating audio. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-muted/40 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="space-y-3 text-center">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <AudioLines className="size-5" />
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Voice Maker
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Turn your text into natural-sounding speech and play, scrub, or
            download the result.
          </p>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Your Text</CardTitle>
            <CardDescription>
              Enter the text you want to convert into audio.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Textarea
                placeholder="Type or paste your text here…"
                value={text}
                rows={7}
                onChange={(e) => setText(e.target.value)}
                className="min-h-36 resize-y rounded-md border border-input bg-background px-3 py-2.5 focus-visible:border-ring"
              />
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {charCount} {charCount === 1 ? "character" : "characters"}
                </span>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Voice</label>
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

            <Button
              onClick={handleGenerate}
              disabled={!text.trim() || loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Generating…
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
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Audio Player</CardTitle>
              <CardDescription>
                Play, skip, adjust volume, or download your audio.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
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

              <AudioPlayer
                src={audioSrc}
                title="Voice Maker Output"
                downloadName={safeDownloadName}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
