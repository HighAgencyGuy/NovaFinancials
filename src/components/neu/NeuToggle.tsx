import { motion } from "framer-motion";

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export function NeuToggle({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="neu-deep rounded-full w-14 h-8 p-1 flex items-center cursor-pointer"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`block w-6 h-6 rounded-full neu-float ${checked ? "ml-auto" : ""}`}
        style={{
          background: checked ? "var(--accent)" : "var(--bg)",
          boxShadow: checked
            ? "-2px -2px 5px rgba(255,255,255,0.8), 2px 2px 5px rgba(108,99,255,0.5)"
            : undefined,
        }}
      />
    </button>
  );
}
