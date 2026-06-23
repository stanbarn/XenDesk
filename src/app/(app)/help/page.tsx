import { HelpCenter } from "@/components/customer/HelpCenter";
import { requireRole } from "@/lib/auth/page";

export default async function HelpPage() {
  await requireRole("CUSTOMER");
  return <HelpCenter />;
}
