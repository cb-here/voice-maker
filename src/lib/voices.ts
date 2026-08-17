export interface VoiceOption {
  value: string
  label: string
}

export interface VoiceGroup {
  label: string
  hint: string
  voices: VoiceOption[]
}

// Two engines, kept apart because they sound nothing alike and picking one
// switches the whole reading — narration and cast together.
export const VOICE_GROUPS: VoiceGroup[] = [
  {
    label: "Natural",
    // No language on these labels: every one of them reads Hindi and English
    // alike, so saying otherwise would only send people to the wrong voice.
    hint: "NVIDIA Magpie — warmer, less flat",
    voices: [
      { value: "Magpie-Multilingual.EN-US.Mia", label: "Mia — Female" },
      { value: "Magpie-Multilingual.EN-US.Aria", label: "Aria — Female" },
      { value: "Magpie-Multilingual.EN-US.Sofia", label: "Sofia — Female" },
      { value: "Magpie-Multilingual.ES-US.Isabela", label: "Isabela — Female" },
      { value: "Magpie-Multilingual.HI-IN.Siwei", label: "Siwei — Female" },
      { value: "Magpie-Multilingual.FR-FR.Louise", label: "Louise — Female" },
      { value: "Magpie-Multilingual.EN-US.Jason", label: "Jason — Male" },
      { value: "Magpie-Multilingual.EN-US.Leo", label: "Leo — Male" },
      { value: "Magpie-Multilingual.EN-US.Ray", label: "Ray — Male" },
      { value: "Magpie-Multilingual.ES-US.Diego", label: "Diego — Male" },
      { value: "Magpie-Multilingual.FR-FR.Pascal", label: "Pascal — Male" },
      { value: "Magpie-Multilingual.VI-VN.Long.Neutral", label: "Long — Male" },
      { value: "Magpie-Multilingual.ZH-CN.HouZhen", label: "HouZhen — Male" },
    ],
  },
  {
    label: "Standard",
    hint: "edge-tts — starts fastest, largest cast",
    voices: [
      { value: "en-US-EmmaMultilingualNeural", label: "Emma — Expressive (Female)" },
      { value: "fr-FR-VivienneMultilingualNeural", label: "Vivienne — Expressive (Female)" },
      { value: "pt-BR-ThalitaMultilingualNeural", label: "Thalita — Expressive (Female)" },
      { value: "de-DE-SeraphinaMultilingualNeural", label: "Seraphina — Expressive (Female)" },
      { value: "ko-KR-HyunsuMultilingualNeural", label: "Hyunsu — Expressive (Male)" },
      { value: "it-IT-GiuseppeMultilingualNeural", label: "Giuseppe — Expressive (Male)" },
      { value: "fr-FR-RemyMultilingualNeural", label: "Remy — Expressive (Male)" },
      { value: "hi-IN-SwaraNeural", label: "Swara — Hindi (Female)" },
      { value: "hi-IN-MadhurNeural", label: "Madhur — Hindi (Male)" },
      { value: "en-US-AriaNeural", label: "Aria — English (Female)" },
      { value: "en-US-GuyNeural", label: "Guy — English (Male)" },
    ],
  },
]

export const VOICES: VoiceOption[] = VOICE_GROUPS.flatMap((group) => group.voices)

export const DEFAULT_VOICE = "Magpie-Multilingual.EN-US.Mia"
