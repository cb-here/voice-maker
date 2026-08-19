import { Trash2, UserPlus } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { matchKey, type Character, type Gender } from "@/lib/cast"
import { VOICE_GROUPS } from "@/lib/voices"
import { cn } from "@/lib/utils"

const GENDERS: { value: Gender; label: string }[] = [
  { value: "neutral", label: "Auto" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
]

/** Only the pool the narrator's own engine draws from — the two never mix. */
function pinnable(narrator: string) {
  return (
    VOICE_GROUPS.find((group) =>
      group.voices.some((voice) => voice.value === narrator),
    )?.voices ?? []
  )
}

interface Props {
  cast: Character[]
  narrator: string
  onChange: (cast: Character[]) => void
}

export function CastEditor({ cast, narrator, onChange }: Props) {
  const [adding, setAdding] = useState("")

  const update = (key: string, change: Partial<Character>) =>
    onChange(
      cast.map((one) => (one.key === key ? { ...one, ...change } : one)),
    )

  const remove = (key: string) =>
    onChange(cast.filter((one) => one.key !== key))

  const add = () => {
    const name = adding.trim()
    const key = matchKey(name)

    if (!key || cast.some((one) => one.key === key)) {
      setAdding("")
      return
    }

    onChange([
      ...cast,
      { name, key, mentions: 0, sample: "", gender: "neutral" },
    ])
    setAdding("")
  }

  const voices = pinnable(narrator)

  return (
    <div className="space-y-2">
      {cast.map((one) => (
        <div key={one.key} className="space-y-2 rounded-md border p-2.5">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{one.name}</span>
            {one.mentions > 0 && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {one.mentions} {one.mentions === 1 ? "line" : "lines"}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto shrink-0"
              onClick={() => remove(one.key)}
              aria-label={`Remove ${one.name} from the cast`}
            >
              <Trash2 />
            </Button>
          </div>

          {one.sample && (
            <p className="truncate text-xs text-muted-foreground italic">
              “{one.sample}”
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex rounded-md border p-0.5"
              role="radiogroup"
              aria-label={`Voice type for ${one.name}`}
            >
              {GENDERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={one.gender === option.value}
                  onClick={() => update(one.key, { gender: option.value })}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs transition-colors",
                    one.gender === option.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Select
              // A pin is cleared by choosing "auto", so the empty string has to
              // be a value the Select can actually hold.
              value={one.voice ?? "auto"}
              onValueChange={(value) =>
                update(one.key, {
                  voice: value === "auto" ? undefined : value,
                })
              }
            >
              <SelectTrigger
                className="h-8 w-40 text-xs"
                aria-label={`Voice for ${one.name}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Pick a voice for me</SelectItem>
                {voices.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value}>
                    {voice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Someone we missed…"
          className="h-9 text-sm"
          aria-label="Add a character by name"
        />
        <Button
          variant="outline"
          size="icon-sm"
          onClick={add}
          disabled={!adding.trim()}
          aria-label="Add this character"
        >
          <UserPlus />
        </Button>
      </div>
    </div>
  )
}
