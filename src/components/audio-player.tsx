import { useEffect, useRef, useState } from "react"
import {
  Download,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface AudioPlayerProps {
  src: string
  downloadUrl?: string
  title?: string
  downloadName?: string
  autoPlay?: boolean
  className?: string
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function AudioPlayer({
  src,
  downloadUrl,
  title = "Generated Audio",
  downloadName = "audio.mp3",
  autoPlay = false,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [bufferedEnd, setBufferedEnd] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  const hasFullDuration = Number.isFinite(duration) && duration > 0
  const seekMax = hasFullDuration ? duration : bufferedEnd
  const isStreaming = !hasFullDuration

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setIsPlaying(false)
    setDuration(0)
    setBufferedEnd(0)
    setCurrentTime(0)

    const readBuffered = () => {
      if (audio.buffered.length > 0) {
        setBufferedEnd(audio.buffered.end(audio.buffered.length - 1))
      }
    }

    const onDuration = () => {
      setDuration(audio.duration)
      readBuffered()
    }
    const onTime = () => {
      setCurrentTime(audio.currentTime)
      readBuffered()
    }
    const onEnded = () => setIsPlaying(false)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener("loadedmetadata", onDuration)
    audio.addEventListener("durationchange", onDuration)
    audio.addEventListener("progress", readBuffered)
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)

    if (autoPlay) {
      audio.play().catch(() => {})
    }

    return () => {
      audio.removeEventListener("loadedmetadata", onDuration)
      audio.removeEventListener("durationchange", onDuration)
      audio.removeEventListener("progress", readBuffered)
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
    }
  }, [src, autoPlay])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }

  const seekTo = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    const target = Math.min(Math.max(seconds, 0), seekMax || 0)
    audio.currentTime = target
    setCurrentTime(target)
  }

  const skip = (amount: number) => seekTo(currentTime + amount)

  const restart = () => seekTo(0)

  const onSeek = (value: number[]) => seekTo(value[0])

  const onVolume = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    const v = value[0]
    audio.volume = v
    setVolume(v)
    setIsMuted(v === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    const next = !isMuted
    audio.muted = next
    setIsMuted(next)
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Volume2 className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {title}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatTime(currentTime)} / {formatTime(seekMax)}
            {isStreaming && (
              <span className="ml-2 text-primary tabular-nums">streaming…</span>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Slider
          value={[currentTime]}
          max={seekMax || 100}
          step={0.1}
          onValueChange={onSeek}
          aria-label="Seek"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>
            {isStreaming ? "~" : ""}
            {formatTime(seekMax)}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={restart}
            aria-label="Restart"
          >
            <RotateCcw />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => skip(-10)}
            aria-label="Back 10 seconds"
          >
            <SkipBack />
          </Button>

          <Button
            size="icon-lg"
            onClick={togglePlay}
            className="rounded-full"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="size-5" />
            ) : (
              <Play className="size-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => skip(10)}
            aria-label="Forward 10 seconds"
          >
            <SkipForward />
          </Button>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={onVolume}
            className="w-full sm:w-24"
            aria-label="Volume"
          />
        </div>
      </div>

      <Button asChild variant="outline" className="w-full">
        <a href={downloadUrl ?? src} download={downloadName}>
          <Download />
          Download
        </a>
      </Button>
    </div>
  )
}
