import { forwardRef, useState, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface BaseProps {
  label?: string;
  hint?: string;
  prefix?: ReactNode;
  mono?: boolean;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
export const NeuInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, prefix, mono, className = "", type, ...rest }, ref) => {
    const [reveal, setReveal] = useState(false);
    const isPassword = type === "password";
    const effectiveType = isPassword ? (reveal ? "text" : "password") : type;
    return (
      <label className="flex flex-col gap-2 w-full">
        {label && <span className="label-caps">{label}</span>}
        <div className="neu-deep rounded-[14px] flex items-center px-4 h-12">
          {prefix && <span className="mr-2 text-text-muted">{prefix}</span>}
          <input
            ref={ref}
            type={effectiveType}
            className={`flex-1 bg-transparent outline-none placeholder:text-text-muted/60 text-text-dark ${mono ? "font-mono tracking-wider" : ""} ${className}`}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setReveal(v => !v)}
              aria-label={reveal ? "Hide password" : "Show password"}
              className="ml-2 text-text-muted hover:text-accent transition-colors p-1 rounded-full"
            >
              {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {hint && <span className="text-[11px] text-text-muted">{hint}</span>}
      </label>
    );
  }
);
NeuInput.displayName = "NeuInput";

type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;
export const NeuTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, className = "", ...rest }, ref) => (
    <label className="flex flex-col gap-2 w-full">
      {label && <span className="label-caps">{label}</span>}
      <div className="neu-deep rounded-[14px] px-4 py-3">
        <textarea
          ref={ref}
          className={`w-full bg-transparent outline-none placeholder:text-text-muted/60 text-text-dark resize-none ${className}`}
          {...rest}
        />
      </div>
      {hint && <span className="text-[11px] text-text-muted">{hint}</span>}
    </label>
  )
);
NeuTextarea.displayName = "NeuTextarea";

type SelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] };
export const NeuSelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = "", ...rest }, ref) => (
    <label className="flex flex-col gap-2 w-full">
      {label && <span className="label-caps">{label}</span>}
      <div className="neu-deep rounded-[14px] flex items-center px-4 h-12">
        <select
          ref={ref}
          className={`flex-1 bg-transparent outline-none text-text-dark appearance-none ${className}`}
          {...rest}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="text-text-muted ml-2">▾</span>
      </div>
    </label>
  )
);
NeuSelect.displayName = "NeuSelect";
