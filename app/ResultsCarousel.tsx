"use client";

import { useEffect, useRef } from "react";

const RESULTS = ["/resultados/r1.png", "/resultados/r4.png", "/resultados/r5.png", "/resultados/r6.png", "/resultados/r7.png", "/resultados/r9.png"];

export function ResultsCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  function scrollBy(delta: number) {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  // Avança sozinho a cada poucos segundos, voltando ao início ao chegar no fim.
  // Pausa enquanto o mouse está sobre o carrossel, pra não atrapalhar quem
  // está olhando com calma.
  useEffect(() => {
    const interval = setInterval(() => {
      const el = scrollerRef.current;
      if (!el || pausedRef.current) return;

      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 236, behavior: "smooth" });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        onTouchStart={() => (pausedRef.current = true)}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {RESULTS.map((src, i) => (
          <div
            key={i}
            className="snap-center shrink-0 w-[220px] aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]"
          >
            <img src={src} alt={`Resultado de faturamento compartilhado por um membro da comunidade`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 mt-5">
        <button
          onClick={() => scrollBy(-240)}
          aria-label="Anterior"
          className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={() => scrollBy(240)}
          aria-label="Próximo"
          className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
