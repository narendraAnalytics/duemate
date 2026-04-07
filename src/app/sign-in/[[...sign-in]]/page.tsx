import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{ background: "var(--color-bg)" }}
    >
      <SignIn />
    </main>
  );
}
