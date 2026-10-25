// Client-side ATS simulation. Never invents content: only reorganizes and highlights terms already in the resume.
const STOP = new Set(
  "a o e de da do das dos em no na nos nas para por com sem um uma uns umas que se ao aos as os ou como mais muito sua seu suas seus ser ter sobre entre até the and of to in for with on at by an or is are be will you our we nossa nosso nossos nossas vaga empresa experiência experiencia conhecimento conhecimentos área area anos ano trabalho equipe time pessoa pessoas buscamos procuramos desejável desejavel requisitos responsabilidades diferenciais atuar atuação forte boa bom capacidade habilidade habilidades competências competencias também tambem são sao está esta isso este esta dia ambiente".split(
    " ",
  ),
);

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function tokens(text: string): string[] {
  return norm(text)
    .replace(/[^a-z0-9+#.\s/-]/g, " ")
    .split(/[\s/]+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((t) => t.length > 2 && !STOP.has(t) && !/^\d+$/.test(t));
}

/** Extract ranked keywords (unigrams + bigrams) from job description. */
export function extractKeywords(job: string, max = 25): string[] {
  const t = tokens(job);
  const freq = new Map<string, number>();
  t.forEach((w, i) => {
    freq.set(w, (freq.get(w) ?? 0) + 1);
    const n = t[i + 1];
    if (n) {
      const bg = `${w} ${n}`;
      if (norm(job).includes(bg)) freq.set(bg, (freq.get(bg) ?? 0) + 0.6);
    }
  });
  return [...freq.entries()]
    .filter(([k, v]) => (k.includes(" ") ? v >= 1.2 : true))
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .filter((k, _, arr) => !arr.some((o) => o !== k && o.includes(" ") && o.split(" ").includes(k) && !k.includes(" ")) || true)
    .slice(0, max);
}

export type Analysis = {
  score: number;
  label: "Excelente" | "Médio" | "Crítico";
  found: string[];
  missing: string[];
  suggestions: string[];
  optimized: string;
};

export function scoreLabel(score: number): Analysis["label"] {
  if (score >= 75) return "Excelente";
  if (score >= 50) return "Médio";
  return "Crítico";
}

export function analyze(job: string, resume: string): Analysis {
  const kws = extractKeywords(job);
  const r = norm(resume);
  const found = kws.filter((k) => r.includes(k));
  const missing = kws.filter((k) => !r.includes(k));
  const score = kws.length ? Math.round((found.length / kws.length) * 100) : 0;

  const suggestions: string[] = [];
  if (missing.length)
    suggestions.push(
      `Se você realmente possui experiência com ${missing.slice(0, 3).join(", ")}, mencione explicitamente no currículo.`,
    );
  if (!/resumo|perfil|sobre/i.test(resume))
    suggestions.push("Adicione um Resumo Profissional curto no topo, alinhado ao título da vaga.");
  if (!/\d+%|\d+\s*(mil|k|clientes|projetos|pessoas)/i.test(resume))
    suggestions.push("Quantifique resultados (ex.: “reduzi custos em 20%”) nas experiências.");
  suggestions.push("Use os mesmos termos da vaga (ATS faz correspondência literal).");
  suggestions.push("Evite tabelas, colunas e imagens — prefira texto simples com seções claras.");

  return { score, label: scoreLabel(score), found, missing, suggestions, optimized: rewrite(resume, found) };
}

function rewrite(resume: string, found: string[]): string {
  const lines = resume.split("\n").map((l) => l.trim()).filter(Boolean);
  const sections: Record<string, string[]> = { resumo: [], experiencia: [], educacao: [], outros: [] };
  let cur = "outros";
  for (const l of lines) {
    const n = norm(l);
    if (/^(resumo|perfil|sobre)/.test(n)) { cur = "resumo"; continue; }
    if (/^(experiencia|historico profissional)/.test(n)) { cur = "experiencia"; continue; }
    if (/^(educacao|formacao)/.test(n)) { cur = "educacao"; continue; }
    if (/^(habilidades|competencias|skills)/.test(n)) { cur = "outros"; continue; }
    sections[cur].push(l);
  }
  const header = sections.outros.length && !sections.resumo.length ? [] : [];
  const skills = found.filter((k) => !k.includes(" ") || true).map((k) => k.replace(/\b\w/g, (c) => c.toUpperCase()));
  const summary = sections.resumo.length
    ? sections.resumo.join(" ")
    : sections.outros.slice(0, 2).join(" ");
  const rest = sections.resumo.length ? sections.outros : sections.outros.slice(2);
  return [
    ...header,
    "RESUMO PROFISSIONAL",
    summary || "(Adicione um resumo com base em sua experiência real.)",
    "",
    "HABILIDADES RELEVANTES PARA A VAGA",
    skills.length ? skills.join(" • ") : "(Nenhuma competência da vaga encontrada no currículo original.)",
    "",
    "EXPERIÊNCIA PROFISSIONAL",
    ...(sections.experiencia.length ? sections.experiencia.map((l) => (l.startsWith("-") || l.startsWith("•") ? l : `• ${l}`)) : rest),
    "",
    "EDUCAÇÃO",
    ...(sections.educacao.length ? sections.educacao : ["(Não informado no currículo original.)"]),
  ].join("\n");
}

export const SAMPLE_JOB = `Desenvolvedor(a) Front-end Pleno
Requisitos: React, TypeScript, Tailwind CSS, testes automatizados com Jest, integração com APIs REST, Git.
Diferenciais: Next.js, GraphQL, acessibilidade, metodologias ágeis (Scrum).
Responsabilidades: desenvolver interfaces performáticas, colaborar com design, revisar código e garantir qualidade.`;

export const SAMPLE_RESUME = `Mariana Souza — Desenvolvedora Front-end
Resumo
Desenvolvedora com 4 anos criando interfaces web com React e JavaScript, foco em performance e qualidade.
Experiência
Tech Solutions (2021–atual): desenvolvi dashboards em React e TypeScript consumindo APIs REST; reduzi o tempo de carregamento em 35%.
Agência Pixel (2019–2021): criei sites responsivos com HTML, CSS e Git; participei de rituais Scrum.
Educação
Bacharelado em Ciência da Computação — UFMG (2019)`;
