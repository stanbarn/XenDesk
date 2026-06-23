import { redirect } from "next/navigation";

import { getSessionUser, roleHome } from "@/lib/auth/page";
import { SignInForm } from "./SignInForm";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(roleHome(user.role));
  return <SignInForm />;
}
