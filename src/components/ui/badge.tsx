import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "bg-primary/15 text-primary": variant === 'default',
          "bg-secondary text-secondary-foreground": variant === 'secondary',
          "bg-destructive/15 text-destructive": variant === 'destructive',
          "bg-primary/15 text-primary": variant === 'success',
          "bg-accent text-accent-foreground": variant === 'warning',
          "border border-border text-muted-foreground": variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
