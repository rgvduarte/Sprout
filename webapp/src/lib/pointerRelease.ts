/* =====================================================================
   Esperar que o dedo (ou o botão do rato) saia do ecrã antes de trocar o
   que está debaixo dele. Usado no fim do ritual de compromisso: a pressão
   contínua confirma com o dedo ainda pousado; se o ecrã final aparecesse
   logo, o toque sintetizado ao levantar o dedo caía num controlo novo
   (uma opção, um botão) que a pessoa nunca viu.
   ===================================================================== */

const pressed = new Set<number>();

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => pressed.add(e.pointerId), true);
  const release = (e: PointerEvent) => pressed.delete(e.pointerId);
  window.addEventListener('pointerup', release, true);
  window.addEventListener('pointercancel', release, true);
  // um rato largado fora da janela não envia pointerup: qualquer movimento sem botões limpa o estado
  window.addEventListener('pointermove', (e) => e.pointerType === 'mouse' && e.buttons === 0 && pressed.delete(e.pointerId), true);
}

/**
 * Engole os eventos de rato de compatibilidade que o browser sintetiza logo a seguir a
 * levantar o dedo (mousedown, mouseup, click), durante `ms`: nem ativam um controlo novo
 * nem tiram o foco do sítio para onde a página o levou.
 */
function swallowCompatMouse(ms = 450) {
  const types = ['mousedown', 'mouseup', 'click'] as const;
  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'click') done();
  };
  const done = () => {
    types.forEach((type) => window.removeEventListener(type, stop, true));
    window.clearTimeout(t);
  };
  types.forEach((type) => window.addEventListener(type, stop, true));
  const t = window.setTimeout(done, ms);
}

/**
 * Chama `cb` depois de pelo menos `minMs` e, se nesse momento houver um dedo ou
 * botão premido, só quando for levantado. Devolve uma função para cancelar.
 */
export function afterRelease(cb: () => void, minMs: number): () => void {
  let cancelled = false;
  const onUp = () => {
    if (pressed.size > 0) return;
    cleanup();
    swallowCompatMouse();
    if (!cancelled) cb();
  };
  const cleanup = () => {
    window.removeEventListener('pointerup', onUp, true);
    window.removeEventListener('pointercancel', onUp, true);
  };
  const t = window.setTimeout(() => {
    if (cancelled) return;
    if (pressed.size === 0) {
      cb();
      return;
    }
    // registados depois dos de cima: quando correm, o conjunto já está atualizado
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onUp, true);
  }, minMs);
  return () => {
    cancelled = true;
    window.clearTimeout(t);
    cleanup();
  };
}
