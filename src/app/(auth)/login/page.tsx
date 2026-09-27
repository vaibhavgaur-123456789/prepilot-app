import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { googleEnabled } from "@/server/auth/cookies";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" googleEnabled={googleEnabled()} />
    </Suspense>
  );
}
