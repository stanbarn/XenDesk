import { requireRole } from "@/lib/auth/page";

export default async function TicketsPage() {
  await requireRole();
  return <div className="p-[26px_30px]">Tickets</div>;
}
