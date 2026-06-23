import { requireRole } from "@/lib/auth/page";

export default async function TagsPage() {
  await requireRole("AGENT");
  return <div className="p-[26px_30px]">Tags</div>;
}
