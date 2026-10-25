import { describe, it, expect } from "vitest";
import { analyze, scoreLabel } from "@/lib/ats";

describe("ats", () => {
  it("labels scores", () => {
    expect(scoreLabel(80)).toBe("Excelente");
    expect(scoreLabel(60)).toBe("Médio");
    expect(scoreLabel(20)).toBe("Crítico");
  });
  it("never adds missing skills to optimized resume", () => {
    const a = analyze("React TypeScript Kubernetes", "Experiência\nTrabalhei com React e TypeScript");
    expect(a.missing).toContain("kubernetes");
    expect(a.optimized.toLowerCase()).not.toContain("kubernetes");
  });
});
