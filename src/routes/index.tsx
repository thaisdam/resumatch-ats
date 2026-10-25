import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { analyze, SAMPLE_JOB, SAMPLE_RESUME, type Analysis } from "@/lib/ats";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResuMatch ATS — Otimizador de Currículo" },
      { name: "description", content: "Compare seu currículo com a vaga, veja seu score ATS e receba uma versão otimizada sem inventar nada." },
      { property: "og:title", content: "ResuMatch ATS — Otimizador de Currículo" },
      { property: "og:description", content: "Passe pelo robô do RH e chegue na entrevista." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Ring({ score, label }: { score: number; label: string }) {
  const c = 2 * Math.PI * 52;
  const tone = score >= 75 ? "stroke-success" : score >= 50 ? "stroke-warning" : "stroke-destructive";
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="52" className="fill-none stroke-muted" strokeWidth="10" />
        <circle cx="60" cy="60" r="52" className={`fill-none ${tone} ring-anim`} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{score}%</span>
        <span className="text-xs text-muted-foreground">Match · {label}</span>
      </div>
    </div>
  );
}

const TIPS = {
  Excelente: { icon: "🚀", title: "Pronto para enviar!", tone: "score-good", tips: ["Revise números e resultados para impressionar o recrutador.", "Ajuste o título do currículo para o nome exato da vaga."] },
  Médio: { icon: "⚙️", title: "Quase lá", tone: "score-mid", tips: ["Inclua as palavras ausentes que você realmente domina.", "Reescreva experiências usando os termos da vaga."] },
  Crítico: { icon: "⚠️", title: "Baixa compatibilidade", tone: "score-low", tips: ["Avalie se a vaga combina com seu perfil real.", "Detalhe projetos e ferramentas que você já usou e não citou."] },
} as const;

function ScoreCard({ score, label, missing }: { score: number; label: Analysis["label"]; missing: number }) {
  const t = TIPS[label];
  return (
    <div className={`glass score-card ${t.tone} flex flex-col items-center rounded-xl p-6`}>
      <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Score de Match ATS</h3>
      <div className="score-glow rounded-full"><Ring score={score} label={label} /></div>
      <p className="mt-4 font-semibold">{t.icon} {t.title}</p>
      <ul className="mt-2 space-y-1 text-center text-xs text-muted-foreground">
        {t.tips.map((x) => <li key={x}>{x}</li>)}
        {missing > 0 && <li>{missing} palavra(s)-chave ainda ausente(s).</li>}
      </ul>
    </div>
  );
}

function Index() {
  const [job, setJob] = useState("");
  const [cv, setCv] = useState("");
  const [res, setRes] = useState<Analysis | null>(null);
  const [copied, setCopied] = useState(false);

  const run = () => {
    setRes(analyze(job, cv));
    setTimeout(() => document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const copy = async () => {
    if (!res) return;
    await navigator.clipboard.writeText(res.optimized);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-hero">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <header className="no-print text-center">
          <span className="inline-block rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
            ✦ Otimizador ATS gratuito
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Passe pelo robô do RH e <span className="text-gradient">chegue na entrevista.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Cole a vaga e seu currículo. Mostramos o score de compatibilidade, as palavras-chave que faltam e uma versão reorganizada pronta para exportar.
          </p>
          <div className="glass mx-auto mt-6 max-w-2xl rounded-xl px-4 py-3 text-sm">
            🛡️ <em>"O ResuMatch aprimora a sua comunicação para o robô de RH, sem nunca fabricar experiências falsas."</em>
          </div>
        </header>

        <div className="no-print mt-10 flex justify-center md:justify-end">
          <button onClick={() => { setJob(SAMPLE_JOB); setCv(SAMPLE_RESUME); }} className="glass rounded-xl px-4 py-2 text-sm transition hover:bg-accent">
            🧪 Testar com dados de exemplo
          </button>
        </div>

        <section className="no-print mt-4 grid gap-5 md:grid-cols-2">
          {[
            { t: "1. Descrição da vaga", v: job, s: setJob, p: "Cole aqui a descrição completa da vaga: requisitos, competências e responsabilidades…" },
            { t: "2. Seu currículo atual", v: cv, s: setCv, p: "Cole aqui o texto do seu currículo (resumo, experiências, formação, habilidades)…" },
          ].map((f) => (
            <div key={f.t} className="glass card-hover rounded-xl p-5">
              <label className="mb-2 block text-sm font-semibold">{f.t}</label>
              <textarea value={f.v} onChange={(e) => f.s(e.target.value)} placeholder={f.p}
                className="h-64 w-full resize-none rounded-lg border border-input bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          ))}
        </section>

        <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={run} disabled={!job.trim() || !cv.trim()} className="btn-primary rounded-xl px-6 py-3 font-semibold">
            ⚡ Analisar Compatibilidade & Otimizar
          </button>
        </div>

        {res && (
          <section id="resultado" className="mt-14 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="no-print grid gap-5 md:grid-cols-3">
              <ScoreCard score={res.score} label={res.label} missing={res.missing.length} />
              <div className="glass rounded-xl p-6 md:col-span-2">
                <h3 className="text-sm font-semibold">Palavras-chave encontradas ({res.found.length})</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {res.found.map((k) => <span key={k} className="rounded-full bg-success/15 px-3 py-1 text-xs text-success">✓ {k}</span>)}
                  {!res.found.length && <span className="text-xs text-muted-foreground">Nenhuma.</span>}
                </div>
                <h3 className="mt-5 text-sm font-semibold">Ausentes no currículo ({res.missing.length})</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {res.missing.map((k) => <span key={k} className="rounded-full bg-warning/15 px-3 py-1 text-xs text-warning">! {k}</span>)}
                </div>
              </div>
            </div>
            <div className="no-print glass rounded-xl p-6">
              <h3 className="text-sm font-semibold">Sugestões de melhorias rápidas</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {res.suggestions.map((s) => <li key={s}>→ {s}</li>)}
              </ul>
            </div>
            <div className="glass print-area rounded-xl p-6">
              <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Versão ajustada do currículo</h3>
                <div className="flex gap-2">
                  <button onClick={copy} className="glass rounded-lg px-4 py-2 text-sm hover:bg-accent">{copied ? "✓ Copiado!" : "Copiar texto"}</button>
                  <button onClick={() => window.print()} className="btn-primary rounded-lg px-4 py-2 text-sm">Exportar PDF</button>
                </div>
              </div>
              <div className="print-only mb-4 border-b pb-2 text-xs">Currículo otimizado · ResuMatch ATS</div>
              <textarea value={res.optimized} onChange={(e) => setRes({ ...res, optimized: e.target.value })}
                className="no-print h-96 w-full rounded-lg border border-input bg-background/60 p-4 font-mono text-sm" />
              <pre className="print-only whitespace-pre-wrap text-sm">{res.optimized}</pre>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
