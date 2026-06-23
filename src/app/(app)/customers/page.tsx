import { CustomersView } from "@/components/agent/CustomersView";
import { requireRole } from "@/lib/auth/page";

export default async function CustomersPage() {
  await requireRole("AGENT");
  return <CustomersView />;
}
