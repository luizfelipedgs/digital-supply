// Ícones de linha simples (estilo outline), pra usar dentro dos badges
// verdes arredondados — mesmo padrão visual da página anterior da comunidade.
export function LineIcon({ name, className = "" }: { name: string; className?: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    case "video":
      return (
        <svg {...common}>
          <rect x="2.5" y="6" width="13" height="12" rx="2" />
          <path d="M15.5 10l6-3.5v11l-6-3.5" />
        </svg>
      );
    case "trending":
      return (
        <svg {...common}>
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M15 7h6v6" />
        </svg>
      );
    case "zap":
      return (
        <svg {...common}>
          <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 012-2h13a1 1 0 011 1v2" />
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M16 13.5h3a1 1 0 011 1v1a1 1 0 01-1 1h-3a1.5 1.5 0 010-3z" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M4 20V10M12 20V4M20 20v-7" />
        </svg>
      );
    case "play":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M10 8.5l6 3.5-6 3.5v-7z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...common}>
          <path d="M11 2l1.6 4.9L17.5 8l-4.9 1.6L11 14.5 9.4 9.6 4.5 8l4.9-1.1L11 2z" />
          <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
          <path d="M11 18.5h2" />
        </svg>
      );
    default:
      return null;
  }
}
