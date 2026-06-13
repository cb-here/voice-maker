import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const sizeMap = {
  sm: "size-4",
  default: "size-6",
  lg: "size-9",
} as const

interface LoaderProps extends React.ComponentProps<"div"> {
  fullscreen?: boolean
  label?: string
  size?: keyof typeof sizeMap
}

function Loader({
  className,
  fullscreen = false,
  label,
  size = "default",
  ...props
}: LoaderProps) {
  const spinner = (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-3", className)}
      {...props}
    >
      <Loader2
        className={cn("animate-spin text-muted-foreground", sizeMap[size])}
      />
      {label ? (
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
      ) : (
        <span className="sr-only">Loading…</span>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background">
        {spinner}
      </div>
    )
  }

  return spinner
}

export { Loader }
