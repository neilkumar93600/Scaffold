# Frontend Rules — Scaffold

## Component Architecture

### Server vs Client Components
- Default to React Server Components (RSC) — no `'use client'` unless required
- Add `'use client'` only for: browser APIs, event handlers, React hooks (`useState`, `useEffect`, etc.), third-party client-only libraries
- Never fetch data inside Client Components — pass as props from RSC or use Server Actions

### File Conventions
```
components/ui/          ← shadcn/ui primitives — NEVER hand-edit
components/[feature]/   ← Feature-specific components
  [FeatureName].tsx     ← Server component (default)
  [FeatureName]Client.tsx ← Client component (when needed)
  [FeatureName].types.ts  ← Shared types for the feature
```

### Component Rules
- One component per file
- Props type defined at top of file as `type Props = { ... }`
- No default export for shared components — named exports only
- Max ~150 lines per component file — split if larger
- No prop drilling beyond 2 levels — lift state or use context

## Styling

### Tailwind CSS 4
- Utility classes only — no inline `style={{}}` except for dynamic values unavoidable in Tailwind (e.g., dynamic widths)
- Use `cn()` helper (`clsx` + `tailwind-merge`) for conditional classes
- No `!important` overrides — fix specificity issues properly
- Responsive breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)

### Design Tokens (from landing page)
```ts
// Use CSS variables — defined in globals.css
--bg: #0B0C0F        // Page background
--bg2: #111318       // Card / section background
--bg3: #181C22       // Input / elevated card
--border: rgba(255,255,255,0.07)
--border2: rgba(255,255,255,0.12)
--teal: #00D4AA      // Primary accent / CTA
--amber: #F0A44A     // Warning / featured
--text: #F0EFE8      // Primary text
--muted: #8A8D97     // Secondary text
--muted2: #5A5D66    // Tertiary / disabled
```

## Data Fetching

### Server Components
```tsx
// Fetch directly in RSC — no useEffect, no SWR
async function StackList() {
  const stacks = await getStacks() // server-side module call
  return <ul>{stacks.map(s => <StackItem key={s.id} stack={s} />)}</ul>
}
```

### Client Data Mutations
- Use Next.js Server Actions for form submissions
- Use `fetch` to `/api/v1/` for complex mutations (file upload, multi-step)
- No direct Supabase client calls from Client Components — go through API routes

## Forms & Validation

- Zod schema defined in `lib/validations/` — shared between client validation and API route
- Client-side validation for UX (instant feedback); server-side Zod parse is the source of truth
- Use `react-hook-form` with Zod resolver for complex forms
- Simple single-field forms: controlled input + Server Action

## Accessibility

- All interactive elements reachable by keyboard
- `aria-label` on icon-only buttons
- Form fields have associated `<label>` elements
- Color contrast: WCAG AA minimum (Teal `#00D4AA` on `#0B0C0F` passes)
- `role="alert"` for error messages that appear dynamically

## Performance

- Images: use Next.js `<Image>` component — never `<img>` for static assets
- Fonts: loaded via `next/font` — no Google Fonts CDN links in components (head only)
- No client-side data on first load that could be server-rendered
- Avoid large client bundle additions — check `pnpm build` bundle output

## Testing (Frontend)

- No snapshot tests
- Unit test pure helpers in `lib/utils/` with Vitest
- E2E (Playwright) for critical user flows: sign-in, create stack, start playbook, upgrade
- Visual regressions caught by manual review + Playwright screenshots in CI

## Forbidden Patterns

```tsx
// ❌ No inline styles for static values
<div style={{ color: '#00D4AA' }}>

// ✅ Use Tailwind
<div className="text-teal">

// ❌ No data fetching in client components
'use client'
useEffect(() => { fetch('/api/stacks').then(...) }, [])

// ✅ Fetch in RSC
async function StackPage() {
  const stacks = await getStacks()
  return <StackList stacks={stacks} />
}

// ❌ No dangerouslySetInnerHTML with user content
<div dangerouslySetInnerHTML={{ __html: template.content }} />

// ✅ Render as code block
<pre><code>{template.content}</code></pre>
```