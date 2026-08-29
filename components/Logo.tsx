// Logo vetorial real da Comunidade DGS (vetorizado corretamente a partir do arquivo original,
// só a marca, sem quadrado nem fundo — polaridade do traço corrigida)
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
    <svg
      width={size}
      height={size * (1375.719869 / 1181.557878)}
      viewBox="0 0 1181.557878 1375.719869"
      className={className}
      style={style}
    >
      <g transform="translate(-402.559262,1681.801416) scale(0.1,-0.1)" fill="currentColor" stroke="none">
        <path
          d="M10380 16813 c-808 -61 -1553 -355 -2180 -861 -124 -100 -3156 -3128
-3272 -3267 -502 -605 -781 -1244 -885 -2029 -14 -102 -18 -202 -17 -451 0
-340 7 -428 59 -712 119 -647 423 -1280 859 -1788 112 -131 2660 -2677 2693
-2691 41 -18 95 -18 136 0 19 8 365 347 829 812 875 878 836 833 809 927 -11
37 -187 216 -1485 1517 -900 901 -1485 1495 -1504 1525 -74 119 -110 281 -92
418 15 124 55 218 133 322 61 81 3719 3734 3780 3774 222 150 502 158 718 20
47 -30 447 -423 1529 -1504 832 -832 1477 -1469 1493 -1475 39 -14 92 -13 130
4 19 8 382 364 869 852 906 909 870 868 854 961 -6 34 -135 166 -1344 1374
-1343 1342 -1411 1407 -1645 1572 -305 216 -705 416 -1052 527 -258 82 -616
150 -895 170 -135 9 -415 11 -520 3z"
        />
      </g>
    </svg>
  );
}
