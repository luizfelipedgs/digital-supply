// Pacotes de créditos de vídeo (Editor de Músicas), vendidos avulsos via Cakto.
// 1 crédito = 1 vídeo processado. Os links de checkout e os IDs de oferta
// abaixo vieram diretamente do painel da Cakto — se algum pacote for
// alterado lá (preço, quantidade, link), atualize aqui também.

export type CreditPackageId = "boost" | "turbo" | "pro";

export const CREDIT_PACKAGES: {
  id: CreditPackageId;
  label: string;
  price: string;
  credits: number;
  checkoutUrl: string;
  featured?: boolean;
}[] = [
  {
    id: "boost",
    label: "Boost",
    price: "R$ 14,90",
    credits: 200,
    checkoutUrl: "https://pay.cakto.com.br/334zfon_1078640",
  },
  {
    id: "turbo",
    label: "Turbo",
    price: "R$ 34,90",
    credits: 600,
    checkoutUrl: "https://pay.cakto.com.br/5sncq9k",
  },
  {
    id: "pro",
    label: "Pro",
    price: "R$ 64,90",
    credits: 1300,
    checkoutUrl: "https://pay.cakto.com.br/32cktrc",
    featured: true,
  },
];

export function creditCheckoutUrl(pkg: (typeof CREDIT_PACKAGES)[number], email?: string | null) {
  if (!email) return pkg.checkoutUrl;
  const params = new URLSearchParams({ email, confirmEmail: email });
  return `${pkg.checkoutUrl}?${params.toString()}`;
}
