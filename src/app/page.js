const categories = [
  { icon: "📱", name: "Electronics", count: "Phones, laptops & more" },
  { icon: "🎒", name: "Bags & Accessories", count: "Bags, wallets, watches" },
  { icon: "🪪", name: "Documents", count: "ID cards, certificates" },
  { icon: "🔑", name: "Personal Items", count: "Keys, bottles & others" },
];

const steps = [
  {
    number: "01",
    title: "Report an item",
    description:
      "Lost something or found an item? Share a few details and a photo.",
  },
  {
    number: "02",
    title: "Find a possible match",
    description:
      "Browse reports and let our matching system help identify potential matches.",
  },
  {
    number: "03",
    title: "Verify and reconnect",
    description:
      "Submit an ownership claim and complete a secure handover.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
              ⌖
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">FindBack</p>
              <p className="text-[10px] font-medium tracking-widest text-slate-500">
                LOST & FOUND PLATFORM
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#how-it-works" className="transition hover:text-blue-600">
              How it works
            </a>
            <a href="#categories" className="transition hover:text-blue-600">
              Categories
            </a>
            <a href="#about" className="transition hover:text-blue-600">
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              Log in
            </a>
            <a
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Get started <span aria-hidden="true">→</span>
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute -bottom-48 -left-40 h-96 w-96 rounded-full bg-indigo-50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 md:py-28 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              One platform. A better way to reconnect.
            </div>

            <h1 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Lost something?
              <span className="mt-2 block text-blue-600">
                Let&apos;s find it.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              A lost item can mean a lot. Report it, discover potential
              matches, and help belongings find their way back home.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Report an item <span className="text-lg">→</span>
              </a>
              <a
                href="#categories"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Explore categories
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Easy reporting
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Smart matching
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Secure claims
              </span>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-2xl shadow-slate-200/70 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Community activity
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Every report brings a chance to reconnect
                  </p>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                  ● Active
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white p-5">
                  <div className="text-2xl">🔎</div>
                  <p className="mt-4 text-2xl font-bold text-slate-900">Lost</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Report what you&apos;re missing
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-600 p-5 text-white">
                  <div className="text-2xl">🤝</div>
                  <p className="mt-4 text-2xl font-bold">Found</p>
                  <p className="mt-1 text-xs text-blue-100">
                    Help someone find it
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">How matching helps</p>
                  <span className="text-xs font-medium text-blue-600">
                    Smart matching
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-2xl">
                    📱
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      Black smartphone
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Example lost report
                    </p>
                  </div>
                  <span className="text-xl text-blue-600">↔</span>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-2xl">
                    📱
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-800">
                  Potential matches are suggested using item details and
                  location.
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-xl sm:block">
              <p className="text-xs font-semibold text-slate-900">
                Built around trust
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Ownership verification matters
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                FIND WHAT YOU NEED
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Explore by category
              </h2>
              <p className="mt-3 text-slate-500">
                Start with the type of item you&apos;re looking for.
              </p>
            </div>
            <span className="text-sm text-slate-400">
              Categories can be filtered in the reports section.
            </span>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <a
                key={category.name}
                href="/reports"
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl transition group-hover:bg-blue-50">
                  {category.icon}
                </div>
                <h3 className="mt-5 font-semibold text-slate-900">
                  {category.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {category.count}
                </p>
                <p className="mt-5 text-sm font-semibold text-blue-600">
                  Explore <span aria-hidden="true">→</span>
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-blue-600">SIMPLE PROCESS</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            From lost to found
          </h2>
          <p className="mt-4 leading-7 text-slate-500">
            A straightforward process designed to make reconnecting easier
            and safer.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <p className="text-sm font-bold tracking-widest text-blue-600">
                {step.number}
              </p>
              <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 leading-7 text-slate-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="px-5 pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-slate-950 px-6 py-14 text-center sm:px-12 sm:py-16">
          <p className="text-sm font-semibold text-blue-300">
            A LITTLE HELP GOES A LONG WAY
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Someone&apos;s looking for what you&apos;ve found.
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
            Take a moment to report a found item. It could make someone&apos;s day.
          </p>
          <a
            href="/register"
            className="mt-8 inline-flex items-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Get started <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p className="font-semibold text-slate-800">FindBack</p>
          <p>Helping belongings find their way home.</p>
          <p>© 2026 FindBack. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
