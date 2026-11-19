import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function RegisterPage() {
  return (
    <AuthLayout>
      <AuthForm mode="register" />
    </AuthLayout>
  );
}
