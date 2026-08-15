import { BrowserRouter } from "react-router-dom"

import { AudioHost } from "@/components/audio-host"
import { AppRoutes } from "@/routes/routes"

export function App() {
  return (
    <BrowserRouter>
      {/* Outside the routes, so playback survives moving between pages. */}
      <AudioHost>
        <AppRoutes />
      </AudioHost>
    </BrowserRouter>
  )
}

export default App
