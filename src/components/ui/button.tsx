import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

const styles = {
  ink: "btn btn-ink",
  line: "btn btn-line",
  gold: "btn btn-gold",
  ghost: "btn btn-ghost",
} as const;

export function Button({
  variant = "ink",
  className,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles; asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(styles[variant], className)} {...props} />;
}
