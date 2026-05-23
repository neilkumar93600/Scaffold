# Skill: frontend-design

## Purpose
Build Scaffold's UI components and pages using the established design system. Translate PRD requirements and wireframes into production-quality Next.js RSC + Tailwind components that match the dark-teal aesthetic from the landing page.

## Design System Reference

### Colors (CSS variables in globals.css)
```css
--bg: #0B0C0F          /* page background */
--bg2: #111318         /* card, section, nav */
--bg3: #181C22         /* input, elevated card, code block */
--border: rgba(255,255,255,0.07)
--border2: rgba(255,255,255,0.12)
--teal: #00D4AA        /* primary CTA, accent, highlights */
--teal-dim: rgba(0,212,170,0.12)
--teal-glow: rgba(0,212,170,0.25)
--amber: #F0A44A       /* featured badge, warning, stars */
--amber-dim: rgba(240,164,74,0.12)
--text: #F0EFE8        /* primary text */
--muted: #8A8D97       /* secondary text, labels */
--muted2: #5A5D66      /* disabled, tertiary */
--radius: 12px
--radius-lg: 18px
```

### Typography
```css
--font-head: 'Syne', sans-serif     /* headings, strong labels, numbers */
--font-body: 'DM Sans', sans-serif  /* body text, descriptions */
--font-mono: 'JetBrains Mono', monospace  /* code, tags, badges, CLI */
```

### Spacing
- Section padding: `96px 5%` (desktop), `64px 5%` (mobile)
- Card padding: `28–32px`
- Gap between grid items: `16–20px`
- Gap between list items: `10–14px`

## Component Patterns

### Button
```tsx
// Primary CTA (teal background)
<button className="bg-[var(--teal)] text-[#0B0C0F] px-5 py-3 rounded-[10px] font-medium text-sm
  hover:opacity-90 hover:-translate-y-px transition-all">
  Get started free
</button>

// Ghost button
<button className="text-[var(--muted)] px-4 py-2 rounded-lg border border-[var(--border)]
  bg-transparent hover:border-[var(--border2)] hover:text-[var(--text)] transition-all text-sm">
  Log in
</button>
```

### Card
```tsx
<div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] p-8
  hover:bg-[var(--bg3)] transition-colors">
  {/* content */}
</div>
```

### Section Label (mono uppercase teal)
```tsx
<p className="font-mono text-xs text-[var(--teal)] uppercase tracking-widest mb-3">
  Section label
</p>
```

### Section Heading
```tsx
<h2 className="font-['Syne'] text-4xl font-bold tracking-tight leading-tight">
  Your entire <span className="text-[var(--teal)]">launch stack</span>, in one place.
</h2>
```

### Feature Tag
```tsx
<span className="font-mono text-[11px] text-[var(--teal)] bg-[var(--teal-dim)]
  px-2 py-1 rounded">
  checklists
</span>
```

### Code Block (step commands)
```tsx
<div className="mt-3 bg-[var(--bg3)] border border-[var(--border)] rounded-lg
  px-4 py-3 font-mono text-xs text-[var(--teal)] overflow-x-auto">
  scaffold init --stack "nextjs + supabase + resend + stripe"
</div>
```

### Pricing Card
```tsx
<div className={cn(
  "bg-[var(--bg2)] border rounded-[var(--radius-lg)] p-7 flex flex-col transition-colors",
  featured
    ? "border-2 border-[var(--teal)] bg-gradient-to-b from-[rgba(0,212,170,0.04)] to-[var(--bg2)] relative"
    : "border-[var(--border)] hover:border-[var(--border2)]"
)}>
  {featured && (
    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--teal)] text-[#0B0C0F]
      text-[11px] font-semibold font-mono px-3 py-1 rounded-full whitespace-nowrap">
      ⚡ Most popular
    </span>
  )}
  {/* ... */}
</div>
```

## Page Structure Patterns

### Dashboard Layout
```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-20 text-center">
  <span className="text-4xl mb-4">🗄️</span>
  <h3 className="font-['Syne'] text-lg font-semibold mb-2">No stacks yet</h3>
  <p className="text-[var(--muted)] text-sm mb-6 max-w-xs">
    Create your first stack to start generating project scaffolds.
  </p>
  <Button variant="primary">Create stack</Button>
</div>
```

## Responsive Breakpoints
```
Mobile: < 600px   → single column, simplified nav
Tablet: 600–900px → 2-column grids, hidden nav links
Desktop: > 900px  → full layout
```

## Rules
1. Dark theme only — no light mode in v1
2. All color values via CSS variables — no hardcoded hex in Tailwind classes
3. Template content always in `<pre><code>` — never rendered as HTML
4. `cn()` for conditional classes — never string concatenation
5. RSC by default — add `'use client'` only for interactive elements
6. shadcn/ui primitives used for all form inputs, dialogs, dropdowns
7. No custom animations outside Tailwind `transition-*` utilities (keep it fast)
8. Test on mobile (375px) and desktop (1440px) breakpoints before marking done

## Files to Know
- `components/ui/` — shadcn/ui primitives (do not edit)
- `app/globals.css` — CSS variables and base styles
- `lib/utils.ts` — `cn()` helper
- `doc/scaffold-landing.html` — visual reference for design language