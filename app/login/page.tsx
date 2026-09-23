import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignInButton from "@/components/SignInButton";
import AuthPreview from "@/components/AuthPreview";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect("/");

  const { error } = await searchParams;

  return (
    <main className="auth">
      <section className="auth-pitch">
        <div className="auth-brand">
          <span className="brand-mark">G</span>
          <span>Grind</span>
        </div>

        <h1>Stop re-solving the problems you already know.</h1>
        <p className="auth-lede">
          The Blind 75 and NeetCode 150, grouped by pattern. Rate each solve and
          the ones you fumbled come back on a schedule — the ones you own get
          out of your way.
        </p>

        <ul className="auth-points">
          <li>
            <strong>150 problems, one catalog.</strong> Blind 75 is a subset, so
            solving once counts in both lists.
          </li>
          <li>
            <strong>Spaced repetition.</strong> Struggled comes back in 2 days,
            shaky in 5, solid in 2 weeks and climbing.
          </li>
          <li>
            <strong>Notes, timer, and gaps.</strong> Per-problem notes, an
            interview clock, and the topics you keep avoiding.
          </li>
        </ul>

        <div className="auth-actions">
          <SignInButton />
          <Link className="btn btn-ghost btn-lg" href="/">
            Continue without an account
          </Link>
        </div>

        <p className="auth-fine">
          Without an account, progress saves to this device — and merges into
          your account whenever you decide to sign in.
        </p>

        {error ? <p className="login-error">{error}</p> : null}
      </section>

      <AuthPreview />
    </main>
  );
}
