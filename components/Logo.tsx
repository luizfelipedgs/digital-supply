// Logo da Comunidade DGS — arquivo PNG direto (public/logo.png), com fundo
// transparente. Evita bugs de reconstrução manual de SVG vetorizado.
export function Logo({
  size = 64,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Comunidade DGS"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain", ...style }}
    />
  );
}
