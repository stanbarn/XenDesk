import { requireRole } from "@/lib/auth/page";

export default async function CustomersPage() {
  await requireRole("AGENT");
  return <div className="p-[26px_30px]">Customers</div>;
}
