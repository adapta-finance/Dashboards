# ADP-FIN-OS · Dashboard (V0)

Vitrine do Repositório de KPIs & Inteligência Financeira da Adapta — visão **CAIXA**, com actuals extraídos da aba **diário** da planilha Journal Entries (10/06/2026).

## Páginas

| Rota | Seção do repositório | Conteúdo |
|---|---|---|
| `/` | ADP-FIN-04 | Painel diário: blocos caixa + operação, antecipação, fita de saldos, disciplina de alerta |
| `/fluxo-de-caixa` | ADP-FIN-02 | Entradas × saídas por categoria, filtros de período e categoria, ratios de eficiência |
| `/pl-margens` | ADP-FIN-05 | Cascata M0→M5 (waterfall), margens vs. metas, take-home, as quatro lentes |
| `/real-vs-orcado` | ADP-FIN-06 | Realizado × curva projetada, bridge por linha de P&L com farol 🟢🟡🔴 |
| `/benchmarks` | ADP-FIN-08 | Placar canônico (Rule of 40, gross margin, AI cost ratio…) com metas elite |
| `/repositorio` | ADP-FIN-01/03/07/09 | Catálogo kpis.yml com busca/filtro, cinco contratos, fotografias, cadências, roadmap |

## Rodar localmente

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Subir para GitHub + Vercel

```bash
git init && git add -A && git commit -m "ADP-FIN-OS dashboard v0"
gh repo create adapta-fin-os --private --source=. --push   # ou crie pelo site e dê push
```

Na Vercel: **Import Project** → selecionar o repo → deploy (zero config, é Next.js padrão). Ativar **password protection** no projeto — auth é obrigatório pelo contrato da Seção 01.

## Dados & evolução

- `src/data/cash.json` — snapshot estático: P&L mensal e fluxo de caixa em visão caixa (jan/25 → dez/26; realizado até mai/26, projetado depois), ratios e saldos diários.
- `src/lib/data.ts` — camada de acesso. **Contrato:** quando `gold__kpi__daily` existir (fase F1), este módulo troca o import estático por fetch na API da camada Gold da Nekt; as assinaturas não mudam e nenhuma página é tocada.
- Regra de ouro: nenhuma regra de negócio no dashboard. Se uma página precisa calcular algo novo, o cálculo desce para uma transformation Gold.

## SQL pronto para a F1 (Nekt)

```sql
-- agregado mensal em visão caixa, mesma forma do cash.json
SELECT date_format(data_pagto, '%Y-%m') AS exercicio_cash,
       categoria_p_l, item_p_l,
       SUM(valor_pago)      AS valor_pago,
       SUM(valor_projetado) AS valor_projetado
FROM "nekt_silver"."journal_entries_diario"
WHERE data_pagto IS NOT NULL
GROUP BY 1, 2, 3;
```
