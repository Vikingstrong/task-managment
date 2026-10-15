import * as React from "react"
import { cn } from "cn"

export type LabelProps = React.ComponentProps<"label">

function Label({ className, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-xs font-medium tracking-wide text-foreground/80 select-none",
        className
      )}
      {...props}
    />
  )
}

export { Label }
