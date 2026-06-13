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
