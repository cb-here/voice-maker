import axios from "axios"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

export const api = axios.create({
  baseURL: API_BASE_URL,
})

export interface GenerateAudioParams {
  text: string
  voice?: string
  rate?: string
  multiVoice?: boolean
}

export async function createAudioStream({
  text,
  voice,
  rate,
  multiVoice = false,
}: GenerateAudioParams): Promise<string> {
  const response = await api.post<{ session_id: string; stream_url: string }>(
    "/audio/stream",
    { text, voice, rate, multi_voice: multiVoice }
  )

  return new URL(response.data.stream_url, API_BASE_URL).toString()
}

export function buildDownloadUrl(streamUrl: string, filename: string): string {
  const url = new URL(streamUrl)
  url.searchParams.set("download", "true")
  url.searchParams.set("filename", filename)

  return url.toString()
}

export async function generateAudio({
  text,
  voice,
  rate,
}: GenerateAudioParams): Promise<string> {
  const response = await api.post(
    "/audio/generate",
    { text, voice, rate },
    { responseType: "blob" }
  )

  return URL.createObjectURL(response.data)
}
