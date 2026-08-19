import axios from "axios"

import type { ChosenCast } from "@/lib/cast"

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
  // Who each character is, as settled in the reader. Sent only with a
  // multi-voice reading, and only for characters actually decided on — an empty
  // cast leaves the backend working it out exactly as it did before.
  cast?: ChosenCast
}

export async function toDevanagari(text: string): Promise<string> {
  const response = await api.post<{ text: string }>("/text/devanagari", {
    text,
  })

  return response.data.text
}

export interface AudioStream {
  streamUrl: string
  estimatedSeconds: number
}

export async function createAudioStream({
  text,
  voice,
  rate,
  multiVoice = false,
  cast,
}: GenerateAudioParams): Promise<AudioStream> {
  const response = await api.post<{
    session_id: string
    stream_url: string
    estimated_seconds: number
  }>("/audio/stream", {
    text,
    voice,
    rate,
    multi_voice: multiVoice,
    ...(cast && Object.keys(cast).length ? { cast } : {}),
  })

  return {
    streamUrl: new URL(response.data.stream_url, API_BASE_URL).toString(),
    estimatedSeconds: response.data.estimated_seconds,
  }
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
