import { TagsView } from "@/components/agent/TagsView";
import { requireRole } from "@/lib/auth/page";

export default async function TagsPage() {
  await requireRole("AGENT");
  return <TagsView />;
}
