const DB_NAME = "voice-maker"
const STORE = "stories"
const VERSION = 1

export interface Story {
  id: string
  title: string
  text: string
  voice: string
  rate: number
  multiVoice: boolean
  createdAt: number
  updatedAt: number
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "id" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  const db = await open()

  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(db.transaction(STORE, mode).objectStore(STORE))
      request.onsuccess = () => resolve(request.result as T)
      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close()
  }
}

export function titleFrom(text: string): string {
  const firstLine = text
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstLine) return "Untitled"

  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine
}

export async function listStories(): Promise<Story[]> {
  const stories = await withStore<Story[]>("readonly", (store) =>
    store.getAll()
  )

  return stories.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function saveStory(
  story: Omit<Story, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<Story> {
  const now = Date.now()
  const existing = story.id
    ? await withStore<Story | undefined>("readonly", (store) =>
        store.get(story.id as string)
      )
    : undefined

  const record: Story = {
    ...story,
    id: existing?.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await withStore("readwrite", (store) => store.put(record))

  return record
}

export async function deleteStory(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id))
}
