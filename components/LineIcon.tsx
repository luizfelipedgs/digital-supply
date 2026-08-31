// Ícones de linha simples (estilo outline), usados em todo o app no lugar de
// emoji — mesmo padrão visual da página de vendas.
export function LineIcon({
  name,
  className = "",
  size = 20,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
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
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" />
          <path d="M16 4.3c1.7.4 3 1.9 3 3.7s-1.3 3.3-3 3.7" />
          <path d="M21.5 20c0-3-2-5.3-4.8-5.9" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 4.5A2.5 2.5 0 016.5 2H20v17H6.5A2.5 2.5 0 004 16.5v-12z" />
          <path d="M4 16.5A2.5 2.5 0 016.5 14H20" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="7" />
          <path d="M20.5 20.5l-5-5" />
        </svg>
      );
    case "gift":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6" />
          <path d="M12 8C10.5 4 7 4.5 7 6.5S9 9 12 8zM12 8c1.5-4 5-3.5 5-1.5S15 9 12 8z" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...common}>
          <path d="M8 4h8v6a4 4 0 01-8 0V4z" />
          <path d="M8 5H5a3 3 0 003 4M16 5h3a3 3 0 01-3 4" />
          <path d="M12 14v3M9 21h6M9.5 21c-.3-1.5 0-3 2.5-4 2.5 1 2.8 2.5 2.5 4" />
        </svg>
      );
    case "person":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20c0-4 3.4-7 7.5-7s7.5 3 7.5 7" />
        </svg>
      );
    case "megaphone":
      return (
        <svg {...common}>
          <path d="M3 10v4a1 1 0 001 1h2l10 4V5L6 9H4a1 1 0 00-1 1z" />
          <path d="M19 9.5a3.5 3.5 0 010 5" />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="2.5" y="4" width="19" height="16" rx="2" />
          <circle cx="8.5" cy="10" r="1.6" />
          <path d="M21 16.5l-5.5-5-4 4-2-2L3 18" />
        </svg>
      );
    case "file-text":
      return (
        <svg {...common}>
          <path d="M6 2.5h9l4 4V21a1 1 0 01-1 1H6a1 1 0 01-1-1V3.5a1 1 0 011-1z" />
          <path d="M8.5 12h7M8.5 15.5h7M8.5 8.5h3" />
        </svg>
      );
    case "headphones":
      return (
        <svg {...common}>
          <path d="M3 13a9 9 0 0118 0v5a2 2 0 01-2 2h-1v-6h3M3 13v5a2 2 0 002 2h1v-6H3" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "note":
      return (
        <svg {...common}>
          <path d="M4 4h13l3 3v13H4V4z" />
          <path d="M17 4v3h3M7.5 11h9M7.5 14.5h9M7.5 18h5" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M2.5 12h19M12 2.5c2.5 2.7 3.8 6.1 3.8 9.5s-1.3 6.8-3.8 9.5c-2.5-2.7-3.8-6.1-3.8-9.5S9.5 5.2 12 2.5z" />
        </svg>
      );
    case "warning":
      return (
        <svg {...common}>
          <path d="M12 3.5L2.5 20h19L12 3.5z" />
          <path d="M12 10v4.5" />
          <circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path d="M4 20l1-4.2L16.6 4.2a1.5 1.5 0 012.1 0l1.1 1.1a1.5 1.5 0 010 2.1L8.2 19 4 20z" />
          <path d="M14.8 6.2l3 3" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M4 12.5l5.5 5.5L20 6" />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path d="M9.5 14.5l5-5" />
          <path d="M11 6l1.2-1.2a4 4 0 015.7 5.7L16.7 11.7" />
          <path d="M13 18l-1.2 1.2a4 4 0 01-5.7-5.7L7.3 12.3" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "music":
      return (
        <svg {...common}>
          <path d="M9 18V5l10-2v13" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
        </svg>
      );
    default:
      return null;
  }
}
