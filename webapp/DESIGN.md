# DESIGN · Sprout

## Mundo visual

**Materiais agrários com seriedade financeira.** Verde-oliva profundo no rail de navegação, fundos de papel ligeiramente esverdeado, tintas tiradas das próprias mercadorias (ouro-oliva do azeite, azul de nascente, castanho de café) e um vermelho de lacre reservado aos selos. As ilustrações são desenhadas por nós em SVG geométrico: IBC de 1 000 kg dentro da grade, paletes de packs, sacas de juta, mosaicos de origem, curvas de nível. Nada de clip art, emoji, manchas desfocadas, gradientes decorativos ou vidro.

## Gesto-assinatura

1. **Cada lote mostra a sua mercadoria física a encher** (`LotGauge`): IBC para azeite, palete para água, sacas para café, cheio até ao financiamento ou ao stock real, com a fatia do compromisso tracejada.
2. **O tempo desenha-se no calendário agrícola** (`HarvestBand`, `SeasonTrack`): bandas de campanha (colheita vs. armazenagem e vendas), janela de 18 meses como banda sólida, extensão tracejada, marcador de hoje (13/10/2026).

## Tokens (CSS custom properties, `src/styles/index.css`)

| token | claro | escuro | papel |
|---|---|---|---|
| `--bg` | #F4F5EF | #10130E | fundo da página |
| `--surface` | #FFFFFF | #171B14 | cartões, tabelas |
| `--surface-2` | #ECEEE4 | #1F241B | cabeçalhos de tabela, campos inativos |
| `--fg` | #1A1E16 | #E7EADF | texto |
| `--muted` | #5B6352 | #9BA390 | texto secundário (≥ 5:1) |
| `--border` | #D7DBCC | #2D3326 | linhas de 1 px |
| `--accent` / `--accent-fg` / `--accent-soft` | #3F5A1E / #FFF / #E1E8CF | #A9C06E / #10130E / #263019 | ação primária, seleção, foco |
| `--rail` / `--rail-fg` | #22301A / #E9EEDC | #0B0E09 / #DDE3D0 | navegação |
| `--c-azeite` `--c-agua` `--c-cafe` | #8C8A16 #2D6E8E #6E4A2C | #CFCB63 #6FB3D3 #C79C70 | identidade dos mundos (desenho) |
| `--c-*-ink` | tinta legível para texto sobre tintas do mundo | | |
| `--seal` | #8E2B1F | #D0614F | **só lacre** |
| `--ok` `--warn` `--crit` `--info` (+ `*-ink`) | estado; o texto usa a versão `-ink` (≥ 4,5:1) | | |
| `--series-azeite/agua/cafe` | #8C8A16 #17709F #8A4816 | #9E9A1E #4192C8 #B65F3B | séries de gráfico (validadas: todos os pares, CVD e contraste) |
| `--chart-grid` `--chart-axis` `--chart-ref` | grelha, eixos, linha de referência | | |

Claro em `:root`; escuro em `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` **e** `:root[data-theme="dark"]`. "Sistema" não escreve `data-theme`. `data-world="azeite|agua|cafe"` num contentor define `--world`, `--world-ink`, `--world-soft`, `--world-line` (utilitários `bg-world`, `text-world-ink`, `bg-world-soft`, `border-world-line`).

Tailwind v4 mapeia tudo via `@theme inline`: `bg-surface`, `text-muted`, `border-border`, `bg-accent`, `text-accent-fg`, `bg-rail`, `text-azeite-ink`, `bg-seal`, `text-warn-ink`, etc. Ponto de quebra extra `rail:` = 900 px.

## Tipografia

| papel | família | notas |
|---|---|---|
| display (h1–h4, marca) | **Archivo** 600–700, `font-stretch: 87.5 %` | tracking ≥ −0,02em; `text-wrap: balance` |
| corpo, UI | **Public Sans** 400–600 | 16 px mínimo; tabelas densas 14 px |
| figuras, IDs, medidas | **IBM Plex Mono** 400–600 | `tabular-nums`; nunca como "costume" técnico |

Escala: h1 30/38 px (página) · h2 22 px · h3 17–19 px · corpo 16–17 px · meta 14 px · micro 12–13 px (só etiquetas de gráfico/calendário). Display de história até `clamp(2.5rem, 5vw, 4.5rem)`, máx. 6rem. Prosa 65–75ch (`.measure`). Números grandes isolados com algarismos proporcionais; colunas com tabulares.

## Espaço, raios, profundidade

- Escala de 4 px (Tailwind por omissão). Grupos apertados, separação generosa, mais espaço acima dos títulos (`Section` mt-10).
- Raios pequenos: `xs` 2 px, `sm` 4 px (botões, campos), `md` 6 px (cartões), `lg` 10 px (só sobreposições). Nada de `rounded-lg` em tudo.
- Sombras só em sobreposições (`shadow-overlay`, `shadow-pop`): offset + desfoque suave. Cartões são planos, com borda de 1 px. Sem sombras duras, sem barras coloridas à esquerda.
- Margens laterais de 16 px no telemóvel; a página nunca faz scroll horizontal (tabelas largas no seu próprio contentor).

## Movimento

- Curva única `cubic-bezier(0.16, 1, 0.3, 1)`; feedback 100–150 ms, estado 150–300 ms, vistas 300–500 ms, entrada focal 500–800 ms; saídas mais rápidas; sem bounce por reflexo.
- **Um momento focal por superfície, tirado do produto**: o depósito a encher, o lacre a carimbar, a divisão da margem na cadeia de valor, a estação a virar.
- Scroll ligado só onde a relação tem significado (enchimento ao stock real, linha de preço a desenhar-se, divisão da margem, cursor dos 18 meses). Entradas disparadas uma vez para o resto. Conteúdo visível em repouso.
- Capítulos fixos ≤ 250vh; abaixo de 900 px ou com movimento reduzido ficam empilhados e estáticos. Parallax só decorativo e desligado no telemóvel. Biblioteca: `motion` (motion/react) + CSS.

## Sistema de jogo (visual)

| peça | componente |
|---|---|
| Mundos e mapa de origens | `TileMap` (hexágonos; por explorar / aprendido / participado) |
| Estação | `SeasonTrack`, `CampaignFeed` |
| Lote como missão | `LotGauge`, `JourneyTrack`, `HarvestBand` |
| Coleção | `OriginSeal`, `WaxSealStamp` (Caderno de colheita) |
| Conhecimento | `KnowledgeLevelBadge`, `LevelProgress`, `QuestList` |
| Ritual de compromisso | fatores de risco → `physicalForAmount` → `HoldToConfirm` → `WaxSealStamp` → próximos passos + `RiskNote` |
| Simulação | `SimulationLabel`, `Disclaimer kind="simulacao"` |

## Inventário de componentes (`src/components/ui`)

Button, ButtonLink, IconButton, TextLink · Card, CardHeader, Divider · Badge/Pill, StatusPill · PageHeader (sem eyebrow), Page, Section · KeyValue, Meter, StatTile, EmptyState, Skeleton, RiskNote, Disclaimer, SimulationLabel · Field, Input, Textarea, Select, Checkbox, RadioGroup, Slider, SegmentedControl · Tabs · Drawer, Dialog · DataTable · Tooltip, Stepper, Timeline, FilterBar, NoAccess · ToastViewport (via `useToast`) · CommodityChip, CommodityGlyph · ChartFrame, ChartTooltipContent.

## Modos por superfície

| superfície | modo |
|---|---|
| Início, Carteira, Mercados, Mundo, Caderno, Onboarding, Bastidores, Plano | **Operate**: produto primeiro; o mundo entra por tipo, paleta, densidade e o gesto-assinatura |
| /apresentacao, /lote/:loteId | **Persuade**: a história é o produto; capítulos com scroll, um momento focal |
| Academia, Simulador | **Persuade/Experience**: o jogo lidera, com controlos normais |

## Recusas

Eyebrows/kickers por cima de títulos (proibido); o template "número-herói + rótulo + estatísticas" como abertura; grelhas de cartões iguais de ícone + título + texto; cartões aninhados; números de secção salvo quando a sequência é informação (capítulos da jornada, passos do onboarding, meses do simulador); modais para tarefas sem foco protegido (preferir gavetas); texto em gradiente; vidro/blur decorativo; bordas coloridas > 1 px em cartões/alertas; sombras duras; sparklines e anéis a fazer de conteúdo; monoespaçada como costume; glifos unicode/emoji como ícones (lucide ou SVG próprio, traço 1,75); faces de sistema como display; listras de gradiente repetido (usar padrão SVG com significado).

## Superfícies do browser

`::selection` e `caret-color` no accent; `accent-color` nos controlos nativos; `scrollbar-color` fina e tingida; anel de foco de 2 px no accent com offset; `text-underline-offset: 0.2em`; algarismos tabulares em tabelas; espaços não separáveis em números (`tidyText`).
