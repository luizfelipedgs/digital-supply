// Status das campanhas exclusivas — calculado automaticamente a partir do
// período (data de início / término), sem depender de alguém trocar um
// campo manual no admin.
export type CampaignStatus = "aguardando" | "andamento" | "encerrada";

export function campaignStatus(startDate: string, endDate: string): CampaignStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (today < startDate) return "aguardando";
  if (today > endDate) return "encerrada";
  return "andamento";
}

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  aguardando: "Aguardando início",
  andamento: "Em andamento",
  encerrada: "Encerrada",
};

// Formata "YYYY-MM-DD" (como vem do Postgres) pra "DD/MM/YYYY" sem passar
// por new Date(...) — evita a data "voltar" um dia por causa de fuso horário.
export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

type CampaignForFeatured = {
  start_date: string;
  end_date: string;
  featured: boolean;
};

// Decide quais campanhas aparecem na faixa de destaque da home: as marcadas
// como destaque pelo admin entram primeiro (das mais próximas de começar pra
// frente); se sobrar menos que o mínimo, completa sozinho com as próximas
// campanhas ativas (não encerradas) — assim a faixa nunca fica vazia ou
// incompleta só porque ninguém marcou campanhas suficientes. Encerradas
// nunca entram, mesmo que estejam marcadas como destaque.
export function pickFeaturedCampaigns<T extends CampaignForFeatured>(campaigns: T[], minCount = 3): T[] {
  const active = campaigns.filter((c) => campaignStatus(c.start_date, c.end_date) !== "encerrada");
  const sorted = [...active].sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
  const featured = sorted.filter((c) => c.featured);
  if (featured.length >= minCount) return featured;
  const rest = sorted.filter((c) => !c.featured);
  return [...featured, ...rest.slice(0, minCount - featured.length)];
}
