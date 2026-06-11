import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        chassi: "#0B1217",
        painel: "#101A21",
        cartao: "#13202A",
        traco: "#1E2F3A",
        tracoSuave: "#16242E",
        tinta: "#E8EFF2",
        tintaSuave: "#8FA6B2",
        tintaMuda: "#5A7280",
        caixa: "#3DDC97",
        caixaFundo: "#0E2A21",
        competencia: "#E5B96B",
        competenciaFundo: "#2A2110",
        foto: "#7FB4E0",
        alerta: "#FF6B6B",
        alertaFundo: "#2A1414",
        atencao: "#FFC857",
        construir: "#9D7FE0"
      },
      fontFamily: {
        display: ["var(--font-archivo)", "sans-serif"],
        body: ["var(--font-instrument)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"]
      }
    }
  },
  plugins: []
};
export default config;
