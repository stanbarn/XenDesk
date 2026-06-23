import { requireRole } from "@/lib/auth/page";

export default async function NewTicketPage() {
  await requireRole();
  return <div className="p-[26px_30px]">New ticket</div>;
}
