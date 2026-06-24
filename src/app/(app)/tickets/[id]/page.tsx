import { TicketDetailView } from "@/components/tickets/TicketDetailView";
import { requireRole } from "@/lib/auth/page";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole();
  const { id } = await params;
  return <TicketDetailView id={id} role={user.role} currentUserId={user.id} />;
}
