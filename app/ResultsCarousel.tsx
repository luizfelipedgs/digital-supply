"use client";

import { useEffect, useRef } from "react";

const RESULTS = [
  "/resultados/r1.jpg",
  "/resultados/r2.jpg",
  "/resultados/r3.jpg",
  "/resultados/r4.jpg",
  "/resultados/r6.jpg",
  "/resultados/r9.jpg",
  "/resultados/r10.jpg",
  "/resultados/r11.jpg",
  "/resultados/r12.jpg",
  "/resultados/r13.jpg",
  "/resultados/r14.jpg",
];

// Duplica a lista uma vez — permite um loop contínuo de verdade: quando o
// scroll passa do fim do primeiro conjunto, ele volta pro início
// instantaneamente (sem animação), e como o conteúdo é idêntico, o "salto"
// é invisível — ninguém consegue perceber onde a lista "recomeçou".
const LOOPED_RESULTS = [...RESULTS, ...RESULTS];

export function ResultsCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const boundaryRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);

  // Reseta instantaneamente pro início assim que o scroll ultrapassa o fim do
  // primeiro conjunto. Calcula a posição real do "meio" da lista medindo a
  // distância entre o marcador e o início do carrossel (em vez de usar
  // offsetLeft puro, que pode dar errado dependendo do contexto de
  // posicionamento — foi exatamente esse cálculo errado que causava o bug de
  // resetar a cada quadro).
  useEffect(() => {
    const el = scrollerRef.current;
    const boundary = boundaryRef.current;
    if (!el || !boundary) return;

    function midpoint() {
      return boundary!.getBoundingClientRect().left - el!.getBoundingClientRect().left + el!.scrollLeft;
    }

    function handleScroll() {
      const mid = midpoint();
      if (mid > 0 && el!.scrollLeft >= mid) {
        el!.scrollLeft -= mid;
      }
    }
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll automático contínuo e bem devagar (estilo "esteira"), quadro a
  // quadro — em vez de pular de imagem em imagem, cria a sensação de um fluxo
  // constante, sem começo nem fim perceptível.
  useEffect(() => {
    let frameId: number;
    function tick() {
      const el = scrollerRef.current;
      if (el && !pausedRef.current && !draggingRef.current) {
        el.scrollLeft += 0.35;
      }
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Arraste livre com o mouse (touch já funciona nativamente em celular)
  function onPointerDown(e: React.PointerEvent) {
    const el = scrollerRef.current;
    if (!el) return;
    draggingRef.current = true;
    pausedRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartScrollRef.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = dragStartScrollRef.current - (e.clientX - dragStartXRef.current);
  }
  function onPointerUp() {
    draggingRef.current = false;
    pausedRef.current = false;
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => {
          pausedRef.current = false;
          draggingRef.current = false;
        }}
        onTouchStart={() => (pausedRef.current = true)}
        onTouchEnd={() => (pausedRef.current = false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="flex gap-4 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {LOOPED_RESULTS.map((src, i) => (
          <div key={i} className="shrink-0 flex">
            {i === RESULTS.length && <div ref={boundaryRef} className="w-0" aria-hidden />}
            <div className="w-[190px] aspect-[823/1600] rounded-xl overflow-hidden border border-white/10 bg-black pointer-events-none">
              <img
                src={src}
                alt="Resultado de faturamento compartilhado por um membro da comunidade"
                className="w-full h-full object-contain"
                loading={i < RESULTS.length ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
