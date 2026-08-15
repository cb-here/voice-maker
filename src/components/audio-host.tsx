import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

import { AudioPlayer } from "@/components/audio-player"
import { buildDownloadUrl } from "@/lib/api"

// The player is mounted here, above the router, and stays mounted while pages
// come and go. Kept inside a page it would unmount on every navigation, and the
// reading would stop the moment you stepped back to your stories.

export interface Track {
  src: string
  estimatedSeconds: number
  /** Shown beside the title in the reader — the voice used, or "multi-voice". */
  label: string
}

interface AudioContextValue {
  track: Track | null
  downloadName: string
  play: (track: Track) => void
  stop: () => void
  setDownloadName: (name: string) => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

export function useAudio(): AudioContextValue {
  const value = useContext(AudioContext)

  if (!value) throw new Error("useAudio must be used inside <AudioHost>")

  return value
}

export function AudioHost({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<Track | null>(null)
  const [downloadName, setDownloadName] = useState("voice-maker-output")

  const value = useMemo(
    () => ({
      track,
      downloadName,
      play: setTrack,
      stop: () => setTrack(null),
      setDownloadName,
    }),
    [track, downloadName]
  )

  const filename = `${downloadName.trim() || "audio"}.mp3`

  return (
    <AudioContext.Provider value={value}>
      {children}

      {track && (
        <>
          {/* Keeps the end of a page clear of the fixed bar. */}
          <div aria-hidden className="h-44" />

          <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 pt-3 pb-5 backdrop-blur">
            <div className="mx-auto w-full max-w-2xl">
              <AudioPlayer
                compact
                src={track.src}
                downloadUrl={buildDownloadUrl(track.src, filename)}
                downloadName={filename}
                estimatedSeconds={track.estimatedSeconds}
                autoPlay
              />
            </div>
          </div>
        </>
      )}
    </AudioContext.Provider>
  )
}
