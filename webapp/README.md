# Sprout · webapp

Webapp de investimento gamificada para financiar lotes reais de **azeite**, **água** e **café**. Piloto fechado (Fase 1: azeite + água) para investidores qualificados; o café está em pré-visualização ("Fase 2 · abre em 2027").

> **Ambiente de demonstração. Dados fictícios.** Nada nesta plataforma constitui oferta pública, recomendação de investimento ou promessa de rentabilidade. As simulações usam dinheiro fictício. "Hoje" é sempre 13/10/2026, 10:00 (Lisboa), para que as capturas de ecrã sejam determinísticas.

## Correr

```bash
cd webapp
npm install          # Node 22
npm run dev          # http://localhost:5173 (HashRouter: /#/mercados)
```

## Scripts

| script | o que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento Vite |
| `npm run build` | `tsc -b` + build de produção em `dist/` (base `./`, funciona no GitHub Pages em `/Sprout/`) |
| `npm run typecheck` | TypeScript estrito |
| `npm run lint` | ESLint (flat config, typescript-eslint, react-hooks) |
| `npm run preview` | serve `dist/` |
| `npm run build:artifact` | build num só ficheiro (`vite build --mode artifact`, MemoryRouter) e `scripts/make-artifact.mjs` → `dist-artifact/sprout-artifact.html`, fragmento HTML para Artifacts do claude.ai (verifica < 5 MB e que só há pedidos externos a Google Fonts) |
| `npm run shot -- --base http://localhost:5173 --routes "/,/mercados" --out DIR [--widths 1440,390] [--themes light,dark] [--role investidor\|visitante\|equipa] [--scroll-steps N] [--reduced-motion]` | capturas com Playwright (Chromium em `/opt/pw-browsers`); assinala erros de consola e scroll horizontal |
| `npm run detect` | detetor de anti-padrões do Impeccable (`npx -y impeccable@4.5.2 detect src`) |

## Estrutura

```
src/
  app/            moldura (rail, barra superior, rodapé), rotas lazy, RoleGate, 404, ErrorBoundary, ScrollToTop
  pages/<rota>/   uma pasta por ecrã; componentes privados ficam na pasta do ecrã
  components/ui/  interface partilhada (botões, cartões, tabelas, formulários, gavetas, gráficos…)
  components/game/ kit de jogo e movimento (ver components/game/README.md)
  data/           tipos e dados de demonstração determinísticos + seletores (data/index.ts)
  state/          AppProvider: papel, tema, diário ao vivo, loja de jogo (useRole, useTheme, useGame, useData, useFeed, useToast)
  lib/            formatação pt-PT, PRNG, relógio simulado, tokens para gráficos, diário ao vivo, tradução física
  styles/         Tailwind v4 + tokens (claro/escuro)
scripts/          make-artifact.mjs, shot.mjs
PRODUCT.md        verdade do produto, público, linhas vermelhas, voz
DESIGN.md         mundo visual, tokens, tipo, movimento, gesto-assinatura, recusas
```

## Rotas

| rota | ecrã |
|---|---|
| `/` | Início |
| `/mercados`, `/mercados/:mundo` | Mercados e mundos (`azeite`, `agua`, `cafe`) |
| `/carteira` | Carteira |
| `/lote/:loteId` | Jornada do lote + ritual de compromisso |
| `/academia`, `/academia/simulador` | Academia e Simulador de campanha |
| `/caderno` | Caderno de colheita |
| `/onboarding` | Registo, KYC/KYB e adequação |
| `/apresentacao` | Apresentação (história com scroll, layout imersivo) |
| `/bastidores`, `/plano` | só Equipa Sprout |

## Papéis ("Ver como")

- **Investidor qualificado** (por omissão): Marta Calado Investimentos, Lda. — KYB aprovado, 4 lotes ativos, 3 selos, nível Provador (190 pontos de conhecimento).
- **Visitante**: sem registo. Explora mundos, Academia, Simulador e jornadas; comprometer capital leva ao onboarding. A Carteira mostra um convite em vez de posições.
- **Equipa Sprout**: tudo o anterior + Bastidores e Plano.

Papel e tema ficam em `localStorage` (`sprout.role`, `sprout.theme`), com fallback se o armazenamento falhar. O progresso do jogo vive em memória (recomeça ao recarregar).

## Sistema de jogo

- **Mundos** com mapa de mosaico das origens: O Olival, A Nascente, A Plantação.
- **Estação** = campanha agrícola (2026/27), com o Diário de campanha a receber telemetria dos produtores a cada ~6,5 s (pausa com movimento reduzido ou separador escondido).
- **Lotes como missões**: medidor físico (IBC, palete, sacas) e jornada Colhido → … → Liquidado.
- **Caderno de colheita**: selos de origem em lacre, por compromisso ou por missões de diligência.
- **Níveis**: Aprendiz (0) → Provador (120) → Lagareiro (300) → Mestre de campanha (600), só com módulos, missões, mini-jogos e simulador.
- **Mini-jogos**: Painel de prova (limites do Reg. Delegado (UE) 2022/2104), Lê o rótulo (menções da Diretiva 2009/54/CE), Da cereja à chávena (escala SCA).
- **Simulador de campanha**: 18 meses com dinheiro fictício, eventos, cobertura, reserva de primeira perda, extensão e refunding, com debrief que pode acabar em perda.

### Permitido vs. proibido

| permitido (conhecimento e operação) | proibido (dinheiro real) |
|---|---|
| pontos e níveis por aprendizagem e diligência | pontos/XP/níveis por montantes investidos |
| selos de origem por produtor × campanha | rankings e comparação social de investidores |
| medidores físicos e jornada do lote | streaks, confetes ou celebração de dinheiro/rentabilidade |
| missões de leitura de análises e riscos | contagens decrescentes, escassez, empurrões para maximizar retorno |
| simulador com dinheiro fictício e perdas | P&L verde/vermelho a piscar, lotaria, caixas-surpresa |
| carimbo de lacre no compromisso | qualquer "garantia" ou promessa de rentabilidade |

Todas as vistas com dinheiro real mostram a nota de capital em risco e usam "liquidação prevista" e "montante financiado".

## Dados de demonstração

Gerados de forma determinística (PRNG com semente) em `src/data`. Produtores, investidores, compradores e números são fictícios; os compradores aparecem só de forma genérica ("cash & carry, Porto"). As pessoas reais do documento-fonte aparecem apenas em `/plano`, com os próximos passos transcritos do plano estratégico de 13/10.
