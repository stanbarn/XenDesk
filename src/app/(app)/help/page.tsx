import { requireRole } from "@/lib/auth/page";

export default async function HelpPage() {
  await requireRole("CUSTOMER");
  return <div className="p-[26px_30px]">Help center</div>;
}
