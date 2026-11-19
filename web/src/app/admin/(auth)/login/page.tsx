import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <AuthLayout variant="admin">
      <AdminLoginForm />
    </AuthLayout>
  );
}
