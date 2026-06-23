import { requireRole } from "@/lib/auth/page";

export default async function TicketDetailPage() {
  await requireRole();
  return <div className="p-[26px_30px]">Ticket detail</div>;
}
