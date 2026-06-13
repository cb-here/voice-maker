import { useEffect, useState } from "react"

interface TranslateElementOptions {
  pageLanguage: string
  autoDisplay?: boolean
}

interface GoogleTranslate {
  translate: {
    TranslateElement: new (
      options: TranslateElementOptions,
      element: string
    ) => void
  }
}

declare global {
  interface Window {
    google: GoogleTranslate
    googleTranslateElementInit: () => void
  }
}

export default function Translater() {
  const [text, setText] = useState("")
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        autoDisplay: false,
      },
      "google_translate_element"
    )
  }

  useEffect(() => {
    const addScript = document.createElement("script")
    addScript.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
    document.body.appendChild(addScript)

    window.googleTranslateElementInit = googleTranslateElementInit
  }, [])

  const handleCopied = async () => {
    const translatedNode =
      document.querySelector<HTMLElement>("#translated_output")

    if (!translatedNode) return

    const finalText = translatedNode.innerText

    try {
      await navigator.clipboard.writeText(finalText)
      setIsCopied(true)
    } catch (err) {
      console.log(err)
    } finally {
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleTranslate = () => {
    if (!text.trim()) return

    setLoading(true)

    setTimeout(() => {
      setOutput(text)

      setTimeout(() => {
        const body = document.querySelector("body")
        const event = document.createEvent("HTMLEvents")
        event.initEvent("DOMNodeInserted", true, true)
        body?.dispatchEvent(event)
      }, 50)

      setLoading(false)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Translator
        </h1>

        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">Language:</span>
          <div id="google_translate_element" />
        </div>

        <textarea
          placeholder="Type text here..."
          value={text}
          rows={8}
          onChange={(e) => setText(e.target.value)}
          className="w-full resize-y rounded border border-gray-300 bg-white p-3 text-gray-800 focus:border-blue-500 focus:outline-none"
        />

        <button
          onClick={handleTranslate}
          disabled={!text.trim() || loading}
          className="mt-3 w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "Translating..." : "Translate"}
        </button>

        {output && (
          <div className="mt-6 rounded border border-gray-300 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Translated Output</h2>
              <button
                onClick={handleCopied}
                className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
              >
                {isCopied ? "Copied" : "Copy"}
              </button>
            </div>

            <div
              id="translated_output"
              className="leading-relaxed whitespace-pre-wrap text-gray-800"
            >
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
