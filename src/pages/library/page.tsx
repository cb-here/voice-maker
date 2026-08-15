import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BookOpen, ChevronLeft, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { deleteStory, listStories, saveStory, type Story } from "@/lib/library"

function when(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function Library() {
  const navigate = useNavigate()
  const [stories, setStories] = useState<Story[] | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)

  useEffect(() => {
    listStories().then(setStories).catch(() => setStories([]))
  }, [])

  const remove = async (story: Story) => {
    if (!confirm(`Delete “${story.title}”? This cannot be undone.`)) return

    await deleteStory(story.id)
    setStories(await listStories())
  }

  const rename = async (story: Story, title: string) => {
    setRenaming(null)

    if (!title.trim() || title === story.title) return

    await saveStory({ ...story, title: title.trim() })
    setStories(await listStories())
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
        <span className="text-sm font-medium">My Stories</span>
        <span className="ml-auto pr-2 text-xs text-muted-foreground">
          {stories ? `${stories.length} saved` : "…"}
        </span>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5">
        {stories === null && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        )}

        {stories?.length === 0 && (
          <div className="py-16 text-center">
            <BookOpen className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nothing saved yet. Write a story and press Save.
            </p>
            <p className="mx-auto mt-3 max-w-xs text-xs text-muted-foreground">
              Stories are kept on this device only — they are never uploaded.
            </p>
          </div>
        )}

        <ul className="space-y-3">
          {stories?.map((story) => (
            <li
              key={story.id}
              className="rounded-lg border border-input bg-card p-3"
            >
              {renaming === story.id ? (
                <Input
                  autoFocus
                  defaultValue={story.title}
                  onBlur={(e) => rename(story, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur()
                    if (e.key === "Escape") setRenaming(null)
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setRenaming(story.id)}
                  className="block w-full truncate text-left text-sm font-medium"
                >
                  {story.title}
                </button>
              )}

              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {story.text.split("\n").slice(1).join(" ").trim().slice(0, 160) ||
                  story.text.slice(0, 160)}
              </p>

              {/* Metadata on its own line: on a narrow phone it and three
                  buttons cannot share a row without the text wrapping. */}
              <p className="mt-2 text-[11px] text-muted-foreground tabular-nums">
                {when(story.updatedAt)} · {story.text.length} chars
                {story.multiVoice ? " · multi-voice" : ""}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    navigate("/home", { state: { story, read: true } })
                  }
                >
                  <BookOpen />
                  Read
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => navigate("/home", { state: { story } })}
                  aria-label={`Edit ${story.title}`}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(story)}
                  aria-label={`Delete ${story.title}`}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
