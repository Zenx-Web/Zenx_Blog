import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLoginForm from "@/components/AdminLoginForm";
import { getCurrentAdminSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin Login | Zenx Blog",
  description: "Secure access to the Zenx Blog admin dashboard.",
};

export default async function AdminLoginPage() {
  const currentSession = await getCurrentAdminSession();
  if (currentSession) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-12">
        <div className="w-full rounded-2xl bg-white/95 p-10 shadow-2xl ring-1 ring-black/10 backdrop-blur">
          <div className="mb-8 space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Zenx Blog Admin
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Sign in to continue</h1>
            <p className="text-sm text-slate-500">
              Use the credentials configured in your environment variables.
            </p>
          </div>

          <AdminLoginForm />

          <p className="mt-8 text-center text-xs text-slate-400">
            Need help? Contact the site administrator or return to the {" "}
            <Link href="/" className="font-medium text-blue-600 hover:text-blue-700">
              home page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
