export interface VoiceOption {
  value: string
  label: string
}

export const VOICES: VoiceOption[] = [
  {
    value: "en-US-EmmaMultilingualNeural",
    label: "Emma — Expressive (Female)",
  },
  {
    value: "fr-FR-VivienneMultilingualNeural",
    label: "Vivienne — Expressive (Female)",
  },
  {
    value: "pt-BR-ThalitaMultilingualNeural",
    label: "Thalita — Expressive (Female)",
  },
  {
    value: "de-DE-SeraphinaMultilingualNeural",
    label: "Seraphina — Expressive (Female)",
  },
  {
    value: "ko-KR-HyunsuMultilingualNeural",
    label: "Hyunsu — Expressive (Male)",
  },
  {
    value: "it-IT-GiuseppeMultilingualNeural",
    label: "Giuseppe — Expressive (Male)",
  },
  {
    value: "fr-FR-RemyMultilingualNeural",
    label: "Remy — Expressive (Male)",
  },
  { value: "hi-IN-SwaraNeural", label: "Swara — Hindi (Female)" },
  { value: "hi-IN-MadhurNeural", label: "Madhur — Hindi (Male)" },
  { value: "en-US-AriaNeural", label: "Aria — English (Female)" },
  { value: "en-US-GuyNeural", label: "Guy — English (Male)" },
]

export const DEFAULT_VOICE = VOICES[0].value
