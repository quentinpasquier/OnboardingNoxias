import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-noxias-deep shadow-noxias-soft hover:shadow-noxias-lift",
        accent: "bg-accent text-accent-foreground hover:brightness-110 shadow-noxias-accent hover:shadow-[0_12px_32px_-8px_hsl(var(--noxias-accent)/0.45)]",
        outline: "border border-border bg-transparent hover:border-accent/40 hover:bg-secondary/60 hover:text-foreground",
        ghost: "hover:bg-secondary/80 text-foreground",
        link: "text-foreground underline-offset-4 hover:underline rounded-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-noxias-soft",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
