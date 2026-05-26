import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCurrentUser, useStore } from "@/lib/store";
import { NeuButton } from "@/components/neu/NeuButton";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/locked")({
  component: Locked,
});

function Locked() {
  const u = useCurrentUser();
  const logout = useStore(s => s.logout);
  const nav = useNavigate();
  return (
    <main className="min-h-dvh grid place-items-center p-6" style={{ background: "var(--bg)" }}>
      <div className="neu-float rounded-[24px] p-8 max-w-sm w-full flex flex-col items-center gap-6 text-center" style={{ background: "var(--bg)" }}>
        <div className="neu-pressed w-20 h-20 rounded-full grid place-items-center">
          <Lock className="text-negative" size={36} />
        </div>
        <div>
          <h1 className="font-display font-semibold text-xl">Account {u?.status === "pending" ? "Pending Approval" : "Suspended"}</h1>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            {u?.status === "pending"
              ? "Your application is being reviewed by an administrator. You'll be notified once approved."
              : "Your account access has been temporarily restricted. Please contact NOVA support to resolve this."}
          </p>
        </div>
        <div className="neu-pressed rounded-[14px] px-4 py-3 text-xs text-text-muted">
          Support: support@novabank.com • +234 800 NOVA 247
        </div>
        <NeuButton tone="negative" className="w-full" onClick={() => { logout(); nav({ to: "/auth" }); }}>
          Sign Out
        </NeuButton>
      </div>
    </main>
  );
}
