"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parsePlan, type ParseResult } from "@/lib/plan/parse";
import { saveImportedPlan } from "@/lib/storage/plans";
import type { PlanFile } from "@/lib/plan/schema";

const GOAL_LABEL: Record<PlanFile["goal"]["type"], string> = {
  lose_fat: "Perder gordura",
  gain_muscle: "Ganhar músculo",
  recomp: "Recomposição",
  maintain: "Manutenção",
  performance: "Performance",
};

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"file" | "text">("file");
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);

  function validate(text: string) {
    setRaw(text);
    setResult(text.trim() ? parsePlan(text) : null);
  }

  async function handleFile(file: File) {
    const text = await file.text();
    validate(text);
  }

  async function handleImport() {
    if (!result?.ok) return;
    setImporting(true);
    try {
      await saveImportedPlan(result.plan);
      router.push("/");
    } catch {
      setResult({
        ok: false,
        errors: [{ field: "armazenamento", message: "Não foi possível salvar no aparelho. Tente novamente." }],
      });
      setImporting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5 pb-10 pt-6">
      <Link href="/" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted" aria-label="Voltar">
        <Chevron /> voltar
      </Link>

      <h1 className="text-[22px] font-medium tracking-tight">Importar plano</h1>
      <p className="mt-1 text-sm text-muted">Traga seu plano para dentro do Activve.</p>

      <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
        <TabButton active={tab === "file"} onClick={() => setTab("file")}>Arquivo</TabButton>
        <TabButton active={tab === "text"} onClick={() => setTab("text")}>Colar texto</TabButton>
      </div>

      {tab === "file" ? (
        <div className="mt-4 rounded-card border border-dashed border-line bg-surface/50 px-5 py-8 text-center">
          <Upload />
          <p className="mt-3 text-sm text-muted">Envie um arquivo do seu plano</p>
          <p className="text-xs text-faint">.json ou .txt</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-4 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface2"
          >
            Escolher arquivo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.txt,application/json,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </div>
      ) : (
        <div className="mt-4">
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Cole aqui o conteúdo do seu plano (JSON)…"
            className="h-44 w-full resize-none rounded-card border border-line bg-surface px-3 py-3 font-mono text-xs text-ink outline-none placeholder:text-faint focus:border-accent"
          />
          <button
            onClick={() => validate(raw)}
            className="mt-3 w-full rounded-xl border border-line py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface2"
          >
            Validar
          </button>
        </div>
      )}

      {result && !result.ok && (
        <div className="mt-5 rounded-card border border-danger/40 bg-danger/10 p-4">
          <p className="text-sm font-medium text-danger">Não foi possível usar esse plano</p>
          <ul className="mt-2 space-y-1.5">
            {result.errors.map((e, i) => (
              <li key={i} className="text-xs text-ink/80">
                <span className="font-mono text-danger">{e.field}</span> — {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result?.ok && (
        <div className="mt-5">
          <p className="mb-2 text-xs uppercase tracking-wider text-faint">Prévia do plano</p>
          <div className="rounded-card border border-line bg-surface">
            <PreviewRow label="Objetivo" value={result.plan.goal.summary ?? GOAL_LABEL[result.plan.goal.type]} />
            <PreviewRow label="Frequência" value={`${result.plan.profile.daysPerWeek}x por semana`} />
            <PreviewRow label="Treinos" value={`${result.plan.training.workouts.length}`} />
            <PreviewRow
              label="Dieta"
              value={result.plan.diet.dailyKcal ? `${result.plan.diet.dailyKcal} kcal` : "—"}
              last
            />
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="mt-4 w-full rounded-xl bg-accent py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press disabled:opacity-60"
          >
            {importing ? "Importando…" : "Importar plano localmente"}
          </button>
        </div>
      )}

      <p className="mt-auto flex items-center justify-center gap-2 pt-8 text-xs text-faint">
        <Lock /> Seu plano fica salvo só neste aparelho. Nada vai para a nuvem.
      </p>
    </main>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg py-2 text-sm font-medium transition-colors ${
        active ? "bg-surface2 text-ink" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function PreviewRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${last ? "" : "border-b border-line"}`}>
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Upload() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2fd4b6" strokeWidth="1.6" className="mx-auto" aria-hidden="true">
      <path d="M12 16V4M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16v3a1 1 0 001 1h12a1 1 0 001-1v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Lock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" strokeLinecap="round" />
    </svg>
  );
}
