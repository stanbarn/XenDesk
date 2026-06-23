import { NewTicketForm } from "@/components/customer/NewTicketForm";
import { requireRole } from "@/lib/auth/page";

export default async function NewTicketPage() {
  // Customers raise tickets; agents work from the queue.
  await requireRole("CUSTOMER");
  return <NewTicketForm />;
}
