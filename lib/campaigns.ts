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
