// Dados dos planos, compartilhados entre a tela de escolha de planos
// e o aviso de renovação no dashboard.

export const CHECKOUT_LINKS = {
  mensal: "https://pay.cakto.com.br/33i9p85_1029588",
  trimestral: "https://pay.cakto.com.br/32u4hd6",
  anual: "https://pay.cakto.com.br/hpdu9fn",
} as const;

export const PLAN_LABEL: Record<string, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  anual: "Anual",
};

export function checkoutUrl(plan: keyof typeof CHECKOUT_LINKS, email?: string | null) {
  const base = CHECKOUT_LINKS[plan];
  if (!email) return base;
  const params = new URLSearchParams({ email, confirmEmail: email });
  return `${base}?${params.toString()}`;
}
