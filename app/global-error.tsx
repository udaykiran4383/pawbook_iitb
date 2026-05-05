'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-rose-50 via-orange-50 to-amber-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-6 text-center shadow-sm">
          <p className="text-5xl mb-3">🐾</p>
          <h2 className="text-xl font-bold text-foreground">This page couldn&apos;t load</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Something went wrong while loading PawBook. Please reload and try again.
          </p>
          <button
            onClick={reset}
            className="mt-4 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold hover:opacity-90 transition"
          >
            Reload
          </button>
          <p className="text-[11px] text-muted-foreground mt-3 break-all">
            {error?.digest ? `Error ref: ${error.digest}` : 'Temporary runtime error'}
          </p>
        </div>
      </body>
    </html>
  );
}
