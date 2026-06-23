import { json, route } from "@/lib/api/http";
import { requireActor } from "@/lib/auth/rbac";
import { getDashboardStats } from "@/lib/services/tickets";

// Agent dashboard metrics (enforced in the service).
export const GET = route(async () => {
  const actor = await requireActor();
  return json(await getDashboardStats(actor));
});
