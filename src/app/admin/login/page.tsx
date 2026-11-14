import type { Metadata } from "next";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Staff sign in", robots: { index: false, follow: false } };

const msgs: Record<string, string> = {
  invalid: "That email or password is not correct.",
  denied: "This account does not have staff access.",
  config: "Staff sign-in is not configured yet.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-5">
      <h1 className="text-4xl">Staff sign in</h1>
      {e && msgs[e] && <p role="alert" className="mt-4 text-alert">{msgs[e]}</p>}
      <form action={signIn} className="mt-8 space-y-5">
        <div><label htmlFor="em" className="font-medium">Email</label><input id="em" name="email" type="email" required autoComplete="username" className="mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3" /></div>
        <div><label htmlFor="pw" className="font-medium">Password</label><input id="pw" name="password" type="password" required minLength={8} autoComplete="current-password" className="mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3" /></div>
        <button className="w-full rounded-full bg-ink py-3.5 font-medium text-ivory hover:bg-teal">Sign in</button>
      </form>
    </div>
  );
}
