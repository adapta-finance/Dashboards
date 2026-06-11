"use client";

export const CORES = {
  caixa: "#3DDC97",
  competencia: "#E5B96B",
  foto: "#7FB4E0",
  alerta: "#FF6B6B",
  atencao: "#FFC857",
  construir: "#9D7FE0",
  tinta: "#E8EFF2",
  tintaSuave: "#8FA6B2",
  tintaMuda: "#5A7280",
  traco: "#1E2F3A",
  saida: "#E0707F",
};

export const PALETA_CATEGORIAS = [
  "#3DDC97", "#7FB4E0", "#E5B96B", "#9D7FE0", "#E0707F",
  "#5BC8AF", "#C8A2C8", "#FFC857", "#6FA8DC", "#A2C4C9",
  "#D5A6BD", "#B6D7A8", "#F6B26B", "#8E7CC3", "#76A5AF",
];

export function TooltipCaixa({ active, payload, label, formatador }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-chassi border border-traco rounded-md px-3 py-2 shadow-xl">
      <div className="font-mono text-[10px] text-tintaMuda mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-tintaSuave">
            <span className="w-2 h-2 rounded-sm" style={{ background: p.color || p.fill }} />
            {p.name}
          </span>
          <span className="font-mono tabular text-tinta">{formatador ? formatador(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export const eixoX = {
  tick: { fill: "#5A7280", fontSize: 10, fontFamily: "var(--font-plex-mono)" },
  axisLine: { stroke: "#1E2F3A" },
  tickLine: false as const,
};

export const eixoY = {
  tick: { fill: "#5A7280", fontSize: 10, fontFamily: "var(--font-plex-mono)" },
  axisLine: false as const,
  tickLine: false as const,
};
