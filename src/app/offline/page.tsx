export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="max-w-sm">
        <p className="text-4xl">📶</p>
        <h1 className="mt-2 text-xl font-bold">You&apos;re offline</h1>
        <p className="mt-1 text-sm text-muted">Pages you opened recently still work, and a running study timer keeps counting. Finished sessions are saved on this device and sync automatically when you reconnect.</p>
      </div>
    </main>
  );
}
