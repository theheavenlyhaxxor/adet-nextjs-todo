import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-28 px-6 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="App logo"
            width={120}
            height={24}
            priority
          />

          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            Simple Todos — Manage tasks quickly and securely
          </h1>

          <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Create, edit and track your tasks. Sign up to keep your tasks synced
            across devices, or sign in to an existing account to continue where
            you left off.
          </p>

          <div className="mt-4 flex gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Sign up
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-black hover:bg-neutral-100 dark:text-white dark:border-neutral-700"
            >
              Sign in
            </Link>
          </div>
        </div>

        <section className="mt-12 w-full rounded-lg border bg-white/50 p-6 text-left shadow-sm">
          <h2 className="text-xl font-semibold">About this todo list</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            This demo shows a minimal todo application built with Next.js and
            TypeScript. It demonstrates client-side authenticated actions such
            as creating, editing, toggling and deleting tasks. Authentication
            uses a bearer token stored in session storage for the demo — in
            production consider httpOnly cookies or a secure session store.
          </p>
        </section>
      </main>
    </div>
  );
}
