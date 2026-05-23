export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-5xl font-bold text-text-primary tracking-tight">
          Scaffold
        </h1>
        <p className="text-xl text-muted-text max-w-md">
          Launch OS for developers. Start every project from your personal best practices.
        </p>
      </div>
      <div className="flex gap-4">
        <button
          disabled
          className="px-6 py-3 rounded-lg bg-teal text-bg font-semibold opacity-50 cursor-not-allowed"
        >
          Sign in with GitHub
        </button>
        <button
          disabled
          className="px-6 py-3 rounded-lg border border-border text-text-primary font-semibold opacity-50 cursor-not-allowed"
        >
          Sign in with Google
        </button>
      </div>
      <p className="text-muted2 text-sm">Auth coming soon</p>
    </main>
  )
}
