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
  title?: string
  downloadName?: string
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
  title = "Generated Audio",
  downloadName = "audio.mp3",
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoaded = () => setDuration(audio.duration)
    const onTime = () => setCurrentTime(audio.currentTime)
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener("loadedmetadata", onLoaded)
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("ended", onEnded)

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded)
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("ended", onEnded)
    }
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const skip = (amount: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.min(
      Math.max(audio.currentTime + amount, 0),
      duration || audio.duration || 0
    )
  }

  const restart = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    setCurrentTime(0)
  }

  const onSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

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
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={onSeek}
          aria-label="Seek"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
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
        <a href={src} download={downloadName}>
          <Download />
          Download
        </a>
      </Button>
    </div>
  )
}
