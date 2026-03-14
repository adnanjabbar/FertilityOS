# Website as Design Source — FertilityOS

The **canonical UI/UX and visual design** for FertilityOS is the current marketing website in the repo:  
**`website/`** (Next.js 16, React 19, Tailwind CSS 4, Geist, Lucide).

All future product UI (dashboard, app, white-label portals) must align with the patterns, tokens, and components established here. This document captures the **live implementation** so branding and design system docs stay in sync.

---

## Source of Truth

| What | Where |
|------|--------|
| Global CSS variables | `website/app/globals.css` |
| Layout & typography | `website/app/layout.tsx` |
| Component patterns | `website/app/components/*.tsx` |
| Fonts | Geist Sans, Geist Mono (from `geist` package) |

---

## CSS Variables (from `globals.css`)

```css
:root {
  --background: #ffffff;
  --foreground: #0f172a;
  --color-blue-primary: #1e40af;
  --color-pink-accent: #ec4899;
  --color-teal-accent: #0d9488;
}
```

- **Background:** Page/default background.
- **Foreground:** Primary text (maps to Tailwind `slate-900` in use).
- **Blue primary:** Main CTA, nav, primary actions (`blue-700` in Tailwind).
- **Pink accent:** Marketing gradient, highlights.
- **Teal accent:** “OS” in logo, success accents, secondary CTAs.

---

## Typography (Live Usage)

- **Font stack:** `var(--font-geist-sans)`, system-ui, -apple-system, sans-serif (body); Geist Mono for code.
- **Hero headline:** `text-5xl sm:text-6xl lg:text-7xl font-extrabold`; gradient text for “for Fertility Care” (`from-blue-700 via-teal-600 to-pink-500`).
- **Section headings:** `text-4xl sm:text-5xl font-extrabold text-slate-900`.
- **Body/lead:** `text-xl sm:text-2xl text-slate-600` for lead; `text-slate-600` / `text-slate-700` for body.
- **Small labels/badges:** `text-xs font-semibold uppercase tracking-wider` (e.g. “Transparent Pricing”, “Now accepting early access”).

---

## Layout & Spacing

- **Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Section padding:** `py-24` (e.g. Pricing, Features), `pt-32 pb-24 sm:pt-40 sm:pb-32` (Hero).
- **Card padding:** `p-6`; rounded `rounded-2xl` (cards), `rounded-xl` (buttons, inputs).

---

## Key Component Patterns

### Navbar
- Fixed, `bg-white/90 backdrop-blur-md border-b border-slate-200`.
- Logo: icon `w-9 h-9 rounded-lg bg-blue-700`, wordmark “Fertility” + “OS” in `text-teal-600`.
- Links: `text-sm font-medium text-slate-600 hover:text-blue-700`.
- Primary CTA: `rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800`.

### Hero
- Background: soft gradient blurs (`bg-blue-50`, `bg-pink-50`, `bg-teal-50` with `opacity-40–60`, `blur-3xl`).
- Badge: `rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold`.
- Primary button: `rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 shadow-lg shadow-blue-200 hover:-translate-y-0.5`.
- Secondary button: `rounded-xl border-2 border-slate-200 bg-white text-slate-800 hover:border-blue-300`.

### Cards (e.g. Pricing, Features)
- Default: `bg-white rounded-2xl border border-slate-200 shadow-sm p-6`.
- Highlighted: `border-2 border-blue-400 ring-2 ring-blue-300` (e.g. “Growth” plan).

### Badges / Pills
- Info: `bg-blue-50 text-blue-700 border-blue-200`.
- Success: `bg-teal-50 text-teal-700 border-teal-200`.
- Neutral: `bg-slate-100 text-slate-700`.

---

## Iconography

- **Library:** Lucide React (`lucide-react`).
- **Sizes:** `w-4 h-4` (inline with text), `w-5 h-5` (buttons, nav), `w-6 h-6` (feature icons).
- **Stroke:** Default or `strokeWidth={2}` / `strokeWidth={2.5}` for emphasis (e.g. logo).

---

## Animation & Interaction

- **Smooth scroll:** `scroll-behavior: smooth` on `html` (globals.css).
- **Buttons:** `transition-all` or `transition-colors`; `hover:-translate-y-0.5` for primary CTA.
- **Body:** `antialiased` (layout).

---

## Usage for Future Development

1. **New marketing pages:** Reuse components from `website/app/components/` and patterns above.
2. **App/dashboard:** Use the same CSS variables, spacing scale, typography, and component patterns; adapt layout to sidebar/content.
3. **White-label:** Expose `--color-blue-primary`, `--color-pink-accent`, `--color-teal-accent` (and optionally fonts) as theme overrides; keep structure and spacing consistent.
4. **Design system docs:** When updating `branding-guidelines.md` or `design-system.md`, verify against this file and the `website/` codebase so they stay the single source of truth.
