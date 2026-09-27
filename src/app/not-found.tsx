import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="text-xl font-bold">Page not found</h1>
        <p className="mt-1 text-sm text-muted">It may have been moved or deleted.</p>
        <Link href="/" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary">Go home</Link>
      </div>
    </main>
  );
}
