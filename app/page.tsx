import Script from "next/script";

export default function HomePage() {
  const schemaSoftware = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Scaffold",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "description": "Stop rebuilding from scratch. Scaffold is the ultimate Next.js SaaS boilerplate with 120+ UI templates, Supabase auth, and Inngest.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  const schemaFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the best Next.js boilerplate for SaaS?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The best Next.js boilerplate for SaaS provides a modular architecture rather than tightly-coupled monoliths. Scaffold stands out by offering 120+ decoupled UI templates, out-of-the-box Supabase authentication, and Inngest background jobs."
        }
      },
      {
        "@type": "Question",
        "name": "How to build a SaaS fast with Next.js?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "1. Choose a robust starter kit like Scaffold. 2. Configure your environment variables for database and auth. 3. Pick from pre-built UI templates for pricing and dashboard. 4. Focus strictly on your core business logic instead of infrastructure."
        }
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaSoftware) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />
      
      <main className="min-h-screen bg-bg flex flex-col items-center pt-24 pb-16 px-4 gap-16">
        {/* Hero Section */}
        <section className="flex flex-col items-center gap-6 text-center max-w-4xl mt-12">
          <h1 className="text-5xl md:text-7xl font-black text-text-primary tracking-tight leading-tight">
            The Ultimate <br/> <span className="text-[#00E6A1]">Next.js SaaS Boilerplate</span>
          </h1>
          <p className="text-xl text-muted-text max-w-2xl font-medium">
            Stop rebuilding from scratch. Ship smarter, every time with 120+ pre-built UI templates, Supabase auth, and Inngest background jobs.
          </p>
          <div className="flex gap-4 mt-6">
            <button
              disabled
              className="px-8 py-4 rounded-xl bg-[#00E6A1] text-[#0A0A0A] font-bold text-lg opacity-80 cursor-not-allowed transition-opacity"
            >
              Sign in with GitHub
            </button>
            <button
              disabled
              className="px-8 py-4 rounded-xl border-2 border-border text-text-primary font-bold text-lg opacity-80 cursor-not-allowed transition-colors"
            >
              Sign in with Google
            </button>
          </div>
          <p className="text-muted2 text-sm mt-2 font-medium">Authentication coming soon</p>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-5xl mt-16">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-10">Everything You Need to Ship</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <li className="p-8 rounded-2xl border border-border bg-[#0A0A0A] shadow-lg">
              <h3 className="text-xl font-bold text-[#00E6A1] mb-3">120+ UI Templates</h3>
              <p className="text-muted-text leading-relaxed">A massive library of modular, highly-customizable React and Tailwind CSS components ready to drop into your project.</p>
            </li>
            <li className="p-8 rounded-2xl border border-border bg-[#0A0A0A] shadow-lg">
              <h3 className="text-xl font-bold text-[#00E6A1] mb-3">Supabase Auth & DB</h3>
              <p className="text-muted-text leading-relaxed">Production-ready PostgreSQL database and robust user authentication right out of the box.</p>
            </li>
            <li className="p-8 rounded-2xl border border-border bg-[#0A0A0A] shadow-lg">
              <h3 className="text-xl font-bold text-[#00E6A1] mb-3">Inngest Jobs</h3>
              <p className="text-muted-text leading-relaxed">Durable background jobs and event-driven workflows to orchestrate complex async logic seamlessly.</p>
            </li>
          </ul>
        </section>

        {/* FAQ Section for AEO */}
        <section className="w-full max-w-3xl mt-16 mb-24">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-10">Frequently Asked Questions</h2>
          <div className="flex flex-col gap-6">
            <article className="p-8 rounded-2xl border border-border bg-[#0A0A0A]">
              <h3 className="text-xl font-bold text-text-primary mb-3">What is the best Next.js boilerplate for SaaS?</h3>
              <p className="text-muted-text leading-relaxed">
                The best Next.js boilerplate for SaaS provides a modular architecture rather than tightly-coupled monoliths. Scaffold stands out by offering 120+ decoupled UI templates, out-of-the-box Supabase authentication, and Inngest background jobs.
              </p>
            </article>
            <article className="p-8 rounded-2xl border border-border bg-[#0A0A0A]">
              <h3 className="text-xl font-bold text-text-primary mb-3">How to build a SaaS fast with Next.js?</h3>
              <ol className="list-decimal list-inside text-muted-text space-y-3 mt-3 ml-2">
                <li>Choose a robust starter kit like <span className="text-[#00E6A1] font-semibold">Scaffold</span>.</li>
                <li>Configure your environment variables for database and auth.</li>
                <li>Pick from pre-built UI templates for pricing and dashboard.</li>
                <li>Focus strictly on your core business logic instead of infrastructure.</li>
              </ol>
            </article>
          </div>
        </section>
      </main>
    </>
  )
}
