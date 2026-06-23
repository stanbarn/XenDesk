import { json, parseBody, route } from "@/lib/api/http";
import { registerSchema } from "@/lib/validation/auth";
import { registerCustomer } from "@/lib/services/users";

// Public: self-registration for customers.
export const POST = route(async (request) => {
  const input = await parseBody(request, registerSchema);
  const user = await registerCustomer(input);
  return json(user, 201);
});
