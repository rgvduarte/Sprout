import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PRODUCERS } from '../data/producers';
import type { CampaignEvent, TelemetryUnit } from '../data/types';
import { now } from './clock';
import { kg, num } from './format';
import { createRng } from './prng';
import { readStorage, STORAGE_KEYS, writeStorage } from './storage';
import { usePageVisible } from './useMediaQuery';

/**
 * Diário de campanha "ao vivo": gera eventos de telemetria dos produtores
 * (enchimento de depósitos, receção de azeitona, paletes engarrafadas) a cada
 * poucos segundos, a partir de uma semente fixa. Os dados continuam com
 * movimento reduzido (só a animação dos widgets desliga). Pausa com o
 * separador escondido, por ação explícita do utilizador ("Pausar Diário",
 * guardado neste browser, WCAG 2.2.2) ou quando `enabled` é falso.
 */
export type TelemetryState = Record<string, TelemetryUnit[]>;

/**
 * Motivo de pausa. 'reduced-motion' já não é produzido (os dados continuam com
 * movimento reduzido); fica no tipo só por compatibilidade com código antigo.
 */
export type FeedPauseReason = 'user' | 'hidden' | 'disabled' | 'reduced-motion';

export interface LiveFeed {
  /** só os eventos gerados nesta sessão, mais recente primeiro */
  events: CampaignEvent[];
  telemetry: TelemetryState;
  paused: boolean;
  pauseReason: FeedPauseReason | null;
  /** pausa pedida pelo utilizador (botão "Pausar Diário") */
  userPaused: boolean;
  setUserPaused: (paused: boolean) => void;
}

const initialTelemetry = (): TelemetryState =>
  Object.fromEntries(PRODUCERS.map((p) => [p.id, p.telemetry.units.map((u) => ({ ...u }))]));

const LIVE_PRODUCERS = PRODUCERS.filter((p) => p.telemetry.live);

export function useLiveFeed({ enabled = true, intervalMs = 6500, maxEvents = 30 }: { enabled?: boolean; intervalMs?: number; maxEvents?: number } = {}): LiveFeed {
  const visible = usePageVisible();
  const [userPaused, setUserPausedState] = useState(() => readStorage(STORAGE_KEYS.diario, ['pausado', 'ativo'] as const, 'ativo') === 'pausado');
  const setUserPaused = useCallback((p: boolean) => {
    setUserPausedState(p);
    writeStorage(STORAGE_KEYS.diario, p ? 'pausado' : 'ativo');
  }, []);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryState>(initialTelemetry);
  const rngRef = useRef(createRng('diario-ao-vivo-2026'));
  const tickRef = useRef(0);
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  const pauseReason: LiveFeed['pauseReason'] = !enabled ? 'disabled' : userPaused ? 'user' : !visible ? 'hidden' : null;

  useEffect(() => {
    if (pauseReason) return;
    const id = window.setInterval(() => {
      const rng = rngRef.current;
      const tick = ++tickRef.current;
      const current = telemetryRef.current;
      // Primeira leitura determinística: o Lagar da Ribeira Alta acaba de encher o Depósito 2.
      const producer = tick === 1 ? LIVE_PRODUCERS.find((p) => p.id === 'lagar-ribeira-alta')! : rng.weighted(LIVE_PRODUCERS, (p) => (p.world === 'azeite' ? 3 : 1));
      const units = current[producer.id].map((u) => ({ ...u }));
      const at = now().toISOString();
      let event: CampaignEvent;

      if (producer.telemetry.kind === 'depositos') {
        const receiving = tick > 1 && rng.chance(0.22);
        if (receiving) {
          const tonnes = rng.range(6, 52);
          event = { id: `live-${tick}`, at, world: producer.world, kind: 'rececao', producerId: producer.id, title: `${producer.nome} recebeu ${num(tonnes, 1)} t de azeitona`, live: true };
        } else {
          const target = units.find((u) => u.level > 0 && u.level < u.capacity) ?? units.find((u) => u.level < u.capacity);
          if (!target) return;
          const add = tick === 1 ? target.capacity - target.level : Math.round(rng.range(...producer.telemetry.ratePerReading) / 10) * 10;
          target.level = Math.min(target.capacity, target.level + add);
          const full = target.level >= target.capacity;
          event = {
            id: `live-${tick}`,
            at,
            world: producer.world,
            kind: 'telemetria',
            producerId: producer.id,
            title: full ? `${producer.nome} encheu o ${target.label} · ${kg(target.capacity)}` : `${producer.nome}: ${target.label} a ${kg(target.level)}`,
            live: true,
          };
        }
      } else {
        const store = units[0];
        const add = rng.int(...producer.telemetry.ratePerReading);
        store.level = Math.min(store.capacity, store.level + add);
        const line = rng.int(1, 2);
        event = {
          id: `live-${tick}`,
          at,
          world: producer.world,
          kind: 'engarrafamento',
          producerId: producer.id,
          title: `${producer.nome} engarrafou ${add} paletes na linha ${line}`,
          detail: `Armazém com ${num(store.level)} paletes.`,
          live: true,
        };
      }

      setTelemetry((prev) => ({ ...prev, [producer.id]: units }));
      setEvents((prev) => [event, ...prev].slice(0, maxEvents));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [pauseReason, intervalMs, maxEvents]);

  return useMemo(
    () => ({ events, telemetry, paused: pauseReason !== null, pauseReason, userPaused, setUserPaused }),
    [events, telemetry, pauseReason, userPaused, setUserPaused],
  );
}
