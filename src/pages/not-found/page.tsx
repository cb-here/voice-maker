import { ArrowLeft, Home } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md text-center">
        <p className="font-heading text-7xl font-semibold tracking-tight tabular-nums sm:text-8xl">
          404
        </p>

        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Page not found
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist, was moved, or the link is
          broken. Let’s get you back on track.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={() => navigate(-1)} variant="outline" size="lg">
            <ArrowLeft />
            Go back
          </Button>
          <Button asChild size="lg">
            <Link to="/translate">
              <Home />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
