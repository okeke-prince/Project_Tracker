import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Choose a new password · Knowledge Tracker" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string; token?: string }> }) {
  const { email = "", token = "" } = await searchParams;

  return (
    <AuthCard
      title="Choose a new password"
      description={email ? <>For <span className="font-medium text-foreground">{email}</span></> : undefined}
      footer={<Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>}
    >
      {email && token ? (
        <ResetPasswordForm email={email} token={token} />
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          This link is incomplete. <Link href="/forgot-password" className="underline underline-offset-4">Ask for a new one</Link>.
        </p>
      )}
    </AuthCard>
  );
}
