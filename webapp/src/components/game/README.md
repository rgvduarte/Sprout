# Kit de jogo e movimento

Componentes partilhados que dão ao produto o seu gesto-assinatura: **cada lote mostra a sua mercadoria física a encher** (IBC de azeite, palete de água, sacas de café) e **o tempo desenha-se no calendário agrícola** (bandas de campanha, janelas de 18 meses).

Importar de `src/components/game` (ex.: `import { LotGauge, HarvestBand } from '../../components/game'`).

Todos respeitam `prefers-reduced-motion`: com movimento reduzido mostram o estado final, sem deslocações; o feedback de estado (cor, enchimento do anel) mantém-se.

## Regras que o kit protege

- O jogo vive no **conhecimento e na diligência**: pontos, níveis, missões e selos nunca dependem do montante investido.
- Nada de pontos por euros, rankings, sequências (streaks), confetes, contagens decrescentes, escassez ("só faltam…"), P&L a piscar, mecânicas de sorte.
- O dinheiro fictício só existe no Simulador, sempre com `SimulationLabel`.
- Vistas com dinheiro real levam `RiskNote` e linguagem neutra ("liquidação prevista", "montante financiado").
- `--seal` é só para o lacre (OriginSeal, WaxSealStamp).

## Componentes

### `LotGauge`
Medidor físico do lote.

```tsx
<LotGauge kind="ibc" value={fundedFraction(lot)} label={`Financiamento do ${lot.id}`} size="lg" />
<LotGauge kind={lot.world} value={0.6} highlight={[0.6, 0.66]} label="…" caption="AZ-2026-021 · 60 %" />
<LotGauge kind="pallet" value={0} progress={scrollYProgress} label="Stock em armazém" />
```

| prop | tipo | notas |
|---|---|---|
| `kind` | `'ibc' \| 'pallet' \| 'sacks' \| WorldId` | o mundo escolhe o objeto |
| `value` | `0–1` | anima ao mudar (0,8 s) |
| `highlight` | `[de, até]` | fatia tracejada (o compromisso acabado de fazer) |
| `size` | `xs \| sm \| md \| lg \| xl` | 40 / 64 / 128 / 240 / 320 px de largura |
| `label` | `string` | obrigatório (nome acessível) |
| `progress` | `MotionValue<number>` | liga o enchimento ao scroll |
| `animateOnMount` | `boolean` | enche de 0 ao montar (momento focal) |
| `showScale` | `boolean` | graduações 25/50/75 (por omissão em lg/xl) |

### `HarvestBand` e `SeasonTrack` (`Calendar.tsx`)
```tsx
<HarvestBand world="azeite" start={lot.settlement.start!} months={18} extensionMonths={lot.settlement.extendedTo ? 6 : 0}
  markers={[{ date: '2026-11-02', label: 'Início das vendas' }]} progress={scrollYProgress} />
<SeasonTrack world="azeite" />          // Campanha 2026/27, out.→set., com "hoje"
```
`windowStart(closedAt, opensAt)` devolve a data de início da janela para lotes ainda abertos.

### `TileMap` + `TileMapLegend`
Mapa de mosaico desenhado (não é um contorno geográfico). Estados `unexplored | learned | participated` vêm de `useData().regionStates`.
```tsx
const { regionStates } = useData();
<TileMap map="pt" world="azeite" states={regionStates} selectedId={id} onSelect={(r) => { setId(r); visitRegion(r); }} />
<TileMapLegend world="azeite" />
<TileMap map="cafe" world="cafe" states={regionStates} />
```
Teclado: Tab entra no mapa, setas mudam de região, Enter/Espaço seleciona. Regiões sem o mundo indicado ficam inativas.

### `JourneyTrack`
A missão física do lote: Colhido → Analisado → Em depósito → Em venda → Expedido → Liquidado (rótulos por mundo, p.ex. água "Engarrafado", "Em armazém").
```tsx
<JourneyTrack lot={lot} />                         // horizontal ≥ 640 px, vertical abaixo
<JourneyTrack lot={lot} compact orientation="vertical" />
<JourneyTrack lot={lot} progress={chapterProgress} />  // acende marcos com o scroll
```

### `OriginSeal` e `WaxSealStamp`
```tsx
const { seals } = useData();   // SealView: { def, producer, region, earned? }
<OriginSeal seal={s.def} producer={s.producer} region={s.region} state={s.earned ? 'earned' : 'locked'}
  earnedBy={s.earned?.by} earnedAt={s.earned?.at} showCaption size={112} />
<WaxSealStamp seal={s.def} producer={s.producer} region={s.region} stamped={done} onStamped={() => …} />
```
O selo bloqueado aparece em relevo; o carimbo cai, assenta e deixa marca, uma vez.

### `HoldToConfirm`
Confirmação de dinheiro real por pressão contínua (~1,2 s). Teclado: manter Espaço ou Enter. Alternativa acessível: caixa de confirmação + botão.
```tsx
<HoldToConfirm
  label={`Mantém premido para confirmar ${eur(amount)}`}
  confirmText={`Confirmo o compromisso de ${eur(amount)} no lote ${lot.id}.`}
  disabled={!check.ok} disabledReason={!check.ok ? check.message : undefined}
  onConfirm={() => { const r = commitToLot(lot.id, amount); … }} />
```

### `KnowledgeLevelBadge`, `LevelProgress`, `LevelGlyph`, `QuestList`
```tsx
const game = useGame();
<KnowledgeLevelBadge level={game.level} size="sm" />
<LevelProgress points={game.points} />            // trilho dos 4 níveis
<QuestList quests={getQuestsByLot(lot.id)} isDone={game.isQuestDone} completedAt={game.questCompletedAt} />
```

### `CampaignFeed`
```tsx
const { events } = useData(); const feed = useFeed();
<CampaignFeed events={events} live={{ paused: feed.paused, reason: feed.pauseReason }} limit={8} />
<CampaignFeed events={events.filter((e) => e.lotId === lot.id)} compact />
```

### Movimento e scroll (`motion.tsx`)
| export | uso |
|---|---|
| `Chapter` | capítulo fixo (sticky) com orçamento de altura ≤ 250vh. `children` pode ser `(progress, rich) => …`. Abaixo de 900 px ou com movimento reduzido fica empilhado e recebe `progress = 1` (o conteúdo tem de estar completo nesse estado). |
| `ScrollProgress` | barra fina + rótulos de capítulo: `<ScrollProgress chapters={[{ id: 'origem', label: 'Origem' }, …]} />` (os ids são os dos `Chapter`). |
| `Reveal` | entrada única para blocos abaixo da dobra; nunca esconde texto. |
| `ParallaxLayer` | só camadas decorativas; desligado < 900 px e com movimento reduzido. |
| `useSectionProgress(ref, offset?)` | progresso 0–1 de uma secção no viewport. |
| `useRichMotion()` | `true` com ≥ 900 px e sem movimento reduzido. |
| `useStaticProgress(v)` | MotionValue constante para estados finais. |
| `CountUp` | conta grandezas físicas (kg, paletes); não usar para euros. |
| `DrawPath` | caminho SVG que se desenha (ligado a `progress` ou uma vez ao entrar). |
| `EASE_OUT`, `DUR` | curva `cubic-bezier(0.16, 1, 0.3, 1)`; 120 / 220 / 400 / 700 ms. |

Regras: o scroll nunca é sequestrado (sem smooth-scroll próprio, sem snap obrigatório); animar só transform, opacity, stroke-dashoffset/pathLength, clip-path e mask; um momento focal por superfície.
