import { forwardRef, type HTMLAttributes } from "react";

type Variant = "raised" | "float" | "pressed" | "deep";
interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  radius?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}
const radiusMap = {
  sm: "rounded-[12px]", md: "rounded-[14px]", lg: "rounded-[18px]",
  xl: "rounded-[24px]", "2xl": "rounded-[32px]", full: "rounded-full",
};
const variantMap = {
  raised: "neu-raised", float: "neu-float", pressed: "neu-pressed", deep: "neu-deep",
};

export const NeuCard = forwardRef<HTMLDivElement, Props>(
  ({ variant = "raised", radius = "lg", className = "", ...rest }, ref) => (
    <div ref={ref} className={`${variantMap[variant]} ${radiusMap[radius]} ${className}`} {...rest} />
  )
);
NeuCard.displayName = "NeuCard";
