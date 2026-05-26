import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type Variant = "pill" | "icon" | "square";
type Tone = "default" | "accent" | "positive" | "negative" | "gold";

interface Props extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  tone?: Tone;
  active?: boolean;
  size?: "sm" | "md" | "lg";
}

const toneText: Record<Tone, string> = {
  default: "text-text-dark",
  accent: "text-accent",
  positive: "text-positive",
  negative: "text-negative",
  gold: "text-gold",
};

const variantBase: Record<Variant, string> = {
  pill: "rounded-full px-6",
  icon: "rounded-full aspect-square p-0 grid place-items-center",
  square: "rounded-[14px] px-4",
};

const sizeMap = {
  sm: "h-9 text-xs",
  md: "h-11 text-sm",
  lg: "h-14 text-base",
};

export const NeuButton = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "pill", tone = "default", active, size = "md", className = "", disabled, ...rest }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        disabled={disabled}
        className={[
          "select-none font-display font-semibold inline-flex items-center justify-center gap-2",
          "transition-shadow duration-150",
          variantBase[variant],
          sizeMap[size],
          toneText[tone],
          active ? "neu-pressed" : "neu-raised hover:[box-shadow:var(--neu-float)]",
          "active:[box-shadow:var(--neu-pressed)]",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          className,
        ].join(" ")}
        {...rest}
      />
    );
  }
);
NeuButton.displayName = "NeuButton";
