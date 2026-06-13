export interface VoiceOption {
  value: string
  label: string
}

export const VOICES: VoiceOption[] = [
  { value: "hi-IN-SwaraNeural", label: "Swara — Hindi (Female)" },
  { value: "hi-IN-MadhurNeural", label: "Madhur — Hindi (Male)" },
  { value: "en-US-AriaNeural", label: "Aria — English (Female)" },
  { value: "en-US-GuyNeural", label: "Guy — English (Male)" },
]

export const DEFAULT_VOICE = VOICES[0].value
