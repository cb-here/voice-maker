import { BrowserRouter } from "react-router-dom"

import { AppRoutes } from "@/routes/routes"

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
