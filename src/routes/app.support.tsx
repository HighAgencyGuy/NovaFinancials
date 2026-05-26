import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { NeuCard } from "@/components/neu/NeuCard";

export const Route = createFileRoute("/app/support")({
  component: Support,
});

function Support() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link to="/app/home" className="neu-raised w-10 h-10 rounded-full grid place-items-center active:[box-shadow:var(--neu-pressed)]"><ChevronLeft size={18} /></Link>
        <h1 className="font-display font-semibold text-lg">Support</h1>
      </header>

      <NeuCard variant="float" className="p-6">
        <p className="font-display font-semibold text-lg">We're here 24/7</p>
        <p className="text-xs text-text-muted mt-1">Choose a channel and we'll respond fast.</p>
      </NeuCard>

      <div className="flex flex-col gap-3">
        {[
          { icon: MessageCircle, t: "Live Chat", s: "Avg response 1 min" },
          { icon: Phone, t: "+234 800 NOVA 247", s: "Free for NOVA customers" },
          { icon: Mail, t: "support@novabank.com", s: "Replies within 4 hours" },
        ].map(c => (
          <NeuCard key={c.t} className="p-4 flex items-center gap-4">
            <div className="neu-pressed rounded-[14px] w-11 h-11 grid place-items-center"><c.icon size={16} className="text-accent" /></div>
            <div>
              <p className="text-sm font-semibold">{c.t}</p>
              <p className="text-[11px] text-text-muted">{c.s}</p>
            </div>
          </NeuCard>
        ))}
      </div>
    </div>
  );
}
