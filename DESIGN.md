# PageLabs — Design System & UI Specification

**Version:** 1.0
**Companion to:** `PAGELABS_TECHNOLOGY.md`
**Stack:** React + shadcn/ui (official) + Tailwind CSS + Manrope
**Design Language:** Flat · Full-rounded · Shadowless · Neutral Dark Mode · Minimal Medium Weight

---

## 1. Design Principles

PageLabs is a utility product. The design exists to disappear. Every screen is optimized for one thing: **getting a file in, transforming it, getting it out** — with zero visual noise.

| Principle | What It Means in Practice |
|---|---|
| **Flat by default** | No elevation, no gradients, no glassmorphism, no decorative shadows. Depth is communicated through background contrast and 1px borders only. |
| **Full-rounded** | Every interactive and container element uses rounded geometry (24px radius baseline). Corners are a signature, not an accident. |
| **Shadowless** | `box-shadow` is globally disabled. If something needs to feel "raised," it gets a lighter surface token, not a shadow. |
| **Neutral dark** | Dark mode is pure grayscale. No blue tint, no warm tint. `hsl(0 0% X%)` across the board. |
| **Weight floor at 500** | Manrope never renders below Medium. Body copy is 500. Headings and buttons are 600. Emphasis is 700. Nothing thinner. |
| **One primary action per view** | Each tool page has exactly one filled primary button. Everything else is outline or ghost. |
| **No surprise motion** | Transitions are 150ms ease-out, opacity and color only. No scale, no slide, no bounce. |

---

## 2. Design Tokens

### 2.1 Color — Light Mode

| Token | Value | Usage |
|---|---|---|
| `--background` | `hsl(0 0% 100%)` | Page background |
| `--foreground` | `hsl(0 0% 9%)` | Primary text |
| `--card` | `hsl(0 0% 100%)` | Card surface |
| `--card-foreground` | `hsl(0 0% 9%)` | Card text |
| `--popover` | `hsl(0 0% 100%)` | Popover/dialog surface |
| `--popover-foreground` | `hsl(0 0% 9%)` | Popover text |
| `--primary` | `hsl(0 0% 9%)` | Primary button bg |
| `--primary-foreground` | `hsl(0 0% 98%)` | Primary button text |
| `--secondary` | `hsl(0 0% 96%)` | Secondary surface |
| `--secondary-foreground` | `hsl(0 0% 9%)` | Secondary text |
| `--muted` | `hsl(0 0% 96%)` | Muted surface |
| `--muted-foreground` | `hsl(0 0% 45%)` | Muted text |
| `--accent` | `hsl(0 0% 96%)` | Hover surface |
| `--accent-foreground` | `hsl(0 0% 9%)` | Hover text |
| `--destructive` | `hsl(0 0% 9%)` | Destructive action (neutral, not red — see 2.4) |
| `--border` | `hsl(0 0% 90%)` | All borders |
| `--input` | `hsl(0 0% 90%)` | Input borders |
| `--ring` | `hsl(0 0% 9%)` | Focus ring |
| `--radius` | `1.5rem` | Global radius (24px) |

### 2.2 Color — Dark Mode (Neutral)

| Token | Value | Usage |
|---|---|---|
| `--background` | `hsl(0 0% 8%)` | Page background |
| `--foreground` | `hsl(0 0% 92%)` | Primary text |
| `--card` | `hsl(0 0% 12%)` | Card surface |
| `--card-foreground` | `hsl(0 0% 92%)` | Card text |
| `--popover` | `hsl(0 0% 12%)` | Popover surface |
| `--popover-foreground` | `hsl(0 0% 92%)` | Popover text |
| `--primary` | `hsl(0 0% 92%)` | Primary button bg (inverted) |
| `--primary-foreground` | `hsl(0 0% 8%)` | Primary button text |
| `--secondary` | `hsl(0 0% 16%)` | Secondary surface |
| `--secondary-foreground` | `hsl(0 0% 92%)` | Secondary text |
| `--muted` | `hsl(0 0% 16%)` | Muted surface |
| `--muted-foreground` | `hsl(0 0% 60%)` | Muted text |
| `--accent` | `hsl(0 0% 16%)` | Hover surface |
| `--accent-foreground` | `hsl(0 0% 92%)` | Hover text |
| `--destructive` | `hsl(0 0% 92%)` | Destructive (neutral) |
| `--border` | `hsl(0 0% 20%)` | All borders |
| `--input` | `hsl(0 0% 20%)` | Input borders |
| `--ring` | `hsl(0 0% 92%)` | Focus ring |

**Rule:** Never introduce a chromatic hue. Success/error states use **weight and icon**, not color. See §2.4.

### 2.3 Typography

**Font:** Manrope (Google Fonts, self-hosted via `next/font` or `@fontsource/manrope`).

**Weights loaded:** `500`, `600`, `700`. **Do not load 400 or below.**

| Role | Size | Weight | Line Height | Tracking |
|---|---|---|---|---|
| Display | 48px / 3rem | 700 | 1.1 | -0.02em |
| H1 | 32px / 2rem | 700 | 1.2 | -0.01em |
| H2 | 24px / 1.5rem | 600 | 1.3 | -0.01em |
| H3 | 20px / 1.25rem | 600 | 1.4 | 0 |
| Body Large | 18px / 1.125rem | 500 | 1.6 | 0 |
| Body | 16px / 1rem | 500 | 1.6 | 0 |
| Body Small | 14px / 0.875rem | 500 | 1.5 | 0 |
| Caption | 12px / 0.75rem | 600 | 1.4 | 0.02em |
| Button | 16px / 1rem | 600 | 1 | 0 |
| Label | 14px / 0.875rem | 600 | 1.4 | 0 |

**Minimum weight rule:** Any text rendered at 14px or below must be **600**, never 500. Small text at 500 loses legibility with Manrope.

### 2.4 Semantic States (Neutral-Only)

PageLabs has no red, green, or amber. States are communicated via **surface contrast + icon + weight**.

| State | Surface | Border | Icon | Text |
|---|---|---|---|---|
| Success | `--card` | `--border` | ✓ (Check) | `--foreground` 600 |
| Error | `--card` | `--border` (2px) | ⚠ (AlertTriangle) | `--foreground` 600 |
| Warning | `--card` | `--border` | ⓘ (Info) | `--foreground` 600 |
| Info | `--muted` | none | ℹ (Info) | `--muted-foreground` 500 |

**Destructive actions** (delete file, purge job) use a `--foreground` filled button with the label "Remove" or "Delete" — never red. Confirmation always uses `AlertDialog`.

### 2.5 Radius Scale

| Token | Value | Applied To |
|---|---|---|
| `--radius-full` | `9999px` | Buttons, badges, pills, avatars, file chips |
| `--radius-3xl` | `24px` | Cards, dialogs, sheets, popovers |
| `--radius-2xl` | `20px` | Inputs, selects, textareas |
| `--radius-xl` | `16px` | Drop zone interior, nested surfaces |
| `--radius-lg` | `12px` | Icon buttons, small tags |

**Base token:** `--radius: 1.5rem` (24px). shadcn derives `lg/md/sm` from this — **override in `tailwind.config` so `rounded-lg` = 12px, `rounded-md` = 10px, `rounded-sm` = 8px** to prevent shadcn defaults from breaking the full-rounded look.

### 2.6 Spacing Scale

Standard Tailwind 4px base. PageLabs uses a **restricted subset**:

`0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px), 12 (48px), 16 (64px), 24 (96px)`

**Rules:**
- Card padding: `p-6` (24px) desktop, `p-4` (16px) mobile.
- Section gap: `gap-6` or `gap-8`.
- Page horizontal padding: `px-4` mobile, `px-6` tablet, `px-8` desktop. Max content width `max-w-5xl` (1024px) centered.
- No arbitrary spacing values. No `p-[13px]`.

### 2.7 Motion

| Property | Duration | Easing |
|---|---|---|
| Color / background | 150ms | `ease-out` |
| Opacity | 150ms | `ease-out` |
| Border color | 150ms | `ease-out` |
| Dialog enter/exit | 200ms | `ease-out` |
| Progress bar fill | 300ms | `ease-out` |

**Forbidden:** `transform: scale()`, `translateY` on hover, spring physics, stagger animations, parallax.

---

## 3. Tailwind & shadcn Configuration

### 3.1 `tailwind.config.ts` (excerpt)

```ts
import type { Config } from "tailwindcss"

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      fontWeight: {
        // Remove 100–400 from the scale entirely
        normal: "500",
        medium: "600",
        semibold: "600",
        bold: "700",
      },
      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
        full: "9999px",
      },
      boxShadow: {
        // Kill all shadows
        DEFAULT: "none",
        sm: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        inner: "none",
        none: "none",
      },
    },
  },
} satisfies Config
```

### 3.2 `globals.css` (excerpt)

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 45%;
    --accent: 0 0% 96%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 0% 9%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 90%;
    --input: 0 0% 90%;
    --ring: 0 0% 9%;
    --radius: 1.5rem;
  }

  .dark {
    --background: 0 0% 8%;
    --foreground: 0 0% 92%;
    --card: 0 0% 12%;
    --card-foreground: 0 0% 92%;
    --popover: 0 0% 12%;
    --popover-foreground: 0 0% 92%;
    --primary: 0 0% 92%;
    --primary-foreground: 0 0% 8%;
    --secondary: 0 0% 16%;
    --secondary-foreground: 0 0% 92%;
    --muted: 0 0% 16%;
    --muted-foreground: 0 0% 60%;
    --accent: 0 0% 16%;
    --accent-foreground: 0 0% 92%;
    --destructive: 0 0% 92%;
    --destructive-foreground: 0 0% 8%;
    --border: 0 0% 20%;
    --input: 0 0% 20%;
    --ring: 0 0% 92%;
  }

  * {
    @apply border-border;
    box-shadow: none !important; /* Hard kill */
  }

  body {
    @apply bg-background text-foreground font-sans;
    font-weight: 500; /* Enforce weight floor */
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  /* Enforce minimum weight on small text */
  small, .text-xs, .text-sm {
    font-weight: 600;
  }
}
```

**Note on `box-shadow: none !important`:** This is intentional and global. If a component genuinely needs no shadow (which is always, in PageLabs), this prevents any shadcn default or third-party leak from reintroducing one.

### 3.3 Font Loading

```tsx
// app/layout.tsx
import { Manrope } from "next/font/google"

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
})
```

---

## 4. Component Specifications

All components are **shadcn/ui installed via CLI**, then **modified in `components/ui/`** to match the spec below. No wrappers, no re-exports.

### 4.1 Button

```tsx
// Sizes
size: {
  sm: "h-9 px-4 text-sm rounded-full",   // 36px
  default: "h-11 px-6 text-base rounded-full", // 44px
  lg: "h-13 px-8 text-base rounded-full",  // 52px
  icon: "h-11 w-11 rounded-full",
}

// Variants
variant: {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-border bg-transparent hover:bg-accent",
  ghost: "bg-transparent hover:bg-accent",
  link: "bg-transparent underline-offset-4 hover:underline",
  destructive: "bg-foreground text-background hover:bg-foreground/90",
}
```

**Rules:**
- All buttons `rounded-full` — no exceptions.
- No shadow on any variant.
- Focus: `ring-2 ring-ring ring-offset-2 ring-offset-background`.
- Disabled: `opacity-50 pointer-events-none`.
- Icon + label buttons use `gap-2`.
- Primary button on tool page: `size="lg"` full width on mobile, `w-auto` on desktop.

### 4.2 Card

```tsx
"rounded-3xl border border-border bg-card text-card-foreground"
// No shadow. No gradient. No hover state unless card is clickable.
```

- Header: `p-6 pb-4`
- Content: `p-6 pt-0`
- Footer: `p-6 pt-4`
- Clickable cards: `hover:bg-accent transition-colors cursor-pointer`

### 4.3 Input

```tsx
"h-11 w-full rounded-2xl border border-input bg-background px-4 text-base font-medium
 placeholder:text-muted-foreground
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
 disabled:opacity-50"
```

- No shadow.
- Placeholder weight: **500** (allowed exception — placeholders are never emphasized).
- Error state: `border-foreground border-2` (not red).

### 4.4 File Drop Zone (custom, built on shadcn primitives)

```
┌──────────────────────────────────────────────┐
│                                              │
│              [ Upload icon ]                 │
│                                              │
│         Drop your PDF here                   │
│         or click to browse                   │
│                                              │
│         PDF · max 100 MB                     │
│                                              │
└──────────────────────────────────────────────┘
```

**Specs:**
- Container: `rounded-3xl border-2 border-dashed border-border bg-card p-12 text-center`
- Drag-over: `border-foreground bg-accent`
- Icon: 48px, `--muted-foreground`, stroke 1.5
- Primary text: `text-lg font-semibold` (600)
- Secondary text: `text-sm font-semibold text-muted-foreground` (600)
- Constraints text: `text-xs font-semibold text-muted-foreground` (600)
- No shadow, ever.
- Full keyboard accessible: `role="button" tabIndex={0}` + Enter/Space triggers file dialog.

### 4.5 File Chip (uploaded file list item)

```
┌──────────────────────────────────────────────┐
│ [PDF icon]  document.pdf   2.4 MB    [×]     │
└──────────────────────────────────────────────┘
```

- Container: `rounded-full border border-border bg-card px-4 py-2 flex items-center gap-3`
- Icon: 20px, `--muted-foreground`
- Filename: `text-sm font-semibold truncate max-w-[200px]`
- Size: `text-xs font-semibold text-muted-foreground`
- Remove button: `ghost` icon button, `rounded-full`, 32px
- Drag handle (for reorder tools like Merge): 16px grip icon on left

### 4.6 Select

```tsx
// Trigger
"h-11 rounded-2xl border border-input bg-background px-4 text-base font-medium
 focus:ring-2 focus:ring-ring"

// Content
"rounded-2xl border border-border bg-popover p-1"

// Item
"rounded-xl px-3 py-2 text-sm font-medium focus:bg-accent"
```

### 4.7 Slider (used for compression level, watermark opacity, etc.)

- Track: `h-1.5 rounded-full bg-secondary`
- Range: `bg-foreground`
- Thumb: `h-5 w-5 rounded-full border-2 border-foreground bg-background`
- No shadow on thumb.
- Value label above slider: `text-sm font-semibold`

### 4.8 Progress

- Container: `h-2 w-full rounded-full bg-secondary overflow-hidden`
- Bar: `h-full rounded-full bg-foreground transition-[width] duration-300 ease-out`
- Indeterminate: `animate-pulse` on bar (opacity only, no transform)
- Percentage text: `text-sm font-semibold` next to or below

### 4.9 Dialog / AlertDialog

- Overlay: `bg-background/80 backdrop-blur-sm` (blur allowed here — it's not a shadow)
- Content: `rounded-3xl border border-border bg-popover p-6 max-w-md`
- No shadow, no scale animation. Fade in/out only (200ms).
- Close button: ghost icon, `rounded-full`, top-right

### 4.10 Toast (Sonner)

- Position: bottom-center, `rounded-full` pill
- Surface: `bg-foreground text-background`
- Text: `text-sm font-semibold`
- Icon: 16px, left of text
- No shadow, no border
- Auto-dismiss: 4s success, 8s error

### 4.11 Tabs (used for Organize PDF mode switch, etc.)

- List: `rounded-full bg-muted p-1 inline-flex`
- Trigger: `rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground`
- No shadow on active state — surface contrast only.

### 4.12 Tooltip

- Content: `rounded-xl bg-foreground text-background px-3 py-1.5 text-xs font-semibold`
- No arrow, no shadow.
- Delay: 400ms

### 4.13 Breadcrumb

- Format: `Tools / Merge PDF`
- Separator: `/` in `--muted-foreground`
- Current page: `text-foreground font-semibold`
- Ancestors: `text-muted-foreground font-medium hover:text-foreground`

---

## 5. Page Layouts

### 5.1 Global Shell

```
┌──────────────────────────────────────────────────────┐
│  [PageLabs]              Tools  Pricing  [☾] [Sign in]│  ← Header (h-16, border-b)
├──────────────────────────────────────────────────────┤
│                                                      │
│                                                      │
│                    [ PAGE CONTENT ]                  │  ← max-w-5xl mx-auto px-8
│                                                      │
│                                                      │
├──────────────────────────────────────────────────────┤
│  © PageLabs 2026              Privacy  Terms  Contact│  ← Footer (border-t)
└──────────────────────────────────────────────────────┘
```

- Header: `h-16 border-b border-border bg-background sticky top-0 z-40` — **no blur, no shadow**.
- Wordmark: `text-xl font-bold tracking-tight`
- Nav links: `text-sm font-semibold text-muted-foreground hover:text-foreground`
- Theme toggle: ghost icon button, `rounded-full`
- Footer: `border-t border-border py-8 text-sm font-semibold text-muted-foreground`

### 5.2 Home / Tool Grid

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│         Every PDF tool. One place.                   │  ← H1, 48px, 700
│         Fast, private, and free.                     │  ← Body Large, muted
│                                                      │
├──────────────────────────────────────────────────────┤
│  Organize & Manage                                   │  ← H2
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ Merge  │ │ Split  │ │ Remove │ │Extract │        │  ← Cards, 4-col grid
│  │  PDF   │ │  PDF   │ │ Pages  │ │ Pages  │        │
│  └────────┘ └────────┘ └────────┘ └────────┘        │
│                                                      │
│  Optimize & Repair                                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │Compress│ │ Repair │ │  OCR   │ │PDF/A   │        │
│  └────────┘ └────────┘ └────────┘ └────────┘        │
│                                                      │
│  Convert                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │Word→PDF│ │PDF→Word│ │JPG→PDF │ │PDF→JPG │        │
│  └────────┘ └────────┘ └────────┘ └────────┘        │
│                                                      │
│  Security                                            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │Protect │ │ Unlock │ │  Sign  │ │ Redact │        │
│  └────────┘ └────────┘ └────────┘ └────────┘        │
└──────────────────────────────────────────────────────┘
```

**Tool card specs:**
- `rounded-3xl border border-border bg-card p-6 hover:bg-accent transition-colors cursor-pointer`
- Icon: 32px, `--foreground`, stroke 1.5, top-left
- Title: `text-base font-semibold mt-4`
- Description: `text-sm font-medium text-muted-foreground mt-1` (one line, truncated)
- **No shadow. No lift. Hover = surface change only.**
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`

### 5.3 Tool Page (e.g., PageLabs Merge PDF)

```
┌──────────────────────────────────────────────────────┐
│  Tools / Merge PDF                                   │  ← Breadcrumb
│                                                      │
│  Merge PDF                                           │  ← H1, 32px, 700
│  Combine multiple PDFs into one file.                │  ← Body, muted
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │           [ Drop zone ]                        │  │  ← File input area
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  [PDF] a.pdf  2.4 MB                    [×]   │  │  ← File chips
│  │  [PDF] b.pdf  1.8 MB                    [×]   │  │
│  │  [PDF] c.pdf  3.1 MB                    [×]   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Output filename                               │  │  ← Options card
│  │  [ merged.pdf                            ]    │  │
│  │                                                │  │
│  │  Add bookmark for each source file    [○]     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │         [ Merge PDF → ]  (primary, lg)         │  │  ← Action
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Progress                                      │  │  ← Conditional
│  │  ████████████░░░░░░░░  62%                     │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Rules:**
- Content column: `max-w-2xl mx-auto` (narrower than home — focused task).
- Options card only renders when the tool has options.
- Process button: full width, `size="lg"`, disabled until file count meets requirement.
- During processing: button replaced by Progress card. No spinner overlay on page.
- On success: result card slides in below (opacity fade only, no transform).
- On error: inline `Alert` above the button, neutral styling.

### 5.4 Result Card

```
┌──────────────────────────────────────────────────────┐
│  ✓  Your file is ready                               │  ← Success, 600
│                                                      │
│     merged.pdf · 4.2 MB · 12 pages                   │  ← Meta, muted
│                                                      │
│     [ ↓ Download ]   [ Process another ]             │  ← Actions
└──────────────────────────────────────────────────────┘
```

- Container: `rounded-3xl border border-border bg-card p-6`
- Check icon: 20px, `--foreground`
- Download button: `default` variant, `rounded-full`, `size="lg"`
- Secondary: `outline` variant
- **No confetti. No green. No celebration.** Task done is enough.

---

## 6. Interaction Patterns

### 6.1 File Upload Flow

1. User clicks drop zone or drags file over.
2. Drag-over: border becomes solid `--foreground`, background becomes `--accent`.
3. Drop: file validated (MIME + magic bytes + size). If invalid → toast error, zone resets.
4. Valid: file chip appears in list with fade-in (150ms opacity).
5. Drop zone remains visible if tool accepts more files; collapses to "Add more" button if at max.

### 6.2 Processing Flow

1. User clicks primary action button.
2. Button disabled, label changes to `Processing…` with inline 16px spinner (rotating, 800ms linear — the only rotation allowed).
3. Progress card fades in below.
4. Progress updates via polling (1s interval) or SSE.
5. On complete: progress card fades out, result card fades in. Scroll to result card.
6. On error: progress card replaced by error alert. Button re-enabled.

### 6.3 Validation Rules

| Rule | Feedback |
|---|---|
| Wrong MIME type | Toast: "Only PDF files are accepted" |
| File too large | Toast: "File exceeds 100 MB limit" |
| Too few files | Process button stays disabled |
| Too many files | Toast: "Maximum 20 files" |
| Invalid option value | Input border becomes 2px `--foreground`, inline error text below |

All feedback is **neutral**. No red. Error is communicated by weight, border, and icon.

### 6.4 Keyboard Navigation

- Tab order: skip link → header nav → theme toggle → breadcrumb → drop zone → file chips (remove buttons) → options → process button → result actions.
- Drop zone: Enter/Space opens file dialog.
- File chip remove: Enter/Space removes.
- Dialog: focus trapped, Escape closes, focus returns to trigger.
- All interactive elements have visible focus ring (`ring-2 ring-ring ring-offset-2`).

### 6.5 Loading States

| Context | Treatment |
|---|---|
| Page load | Skeleton with `bg-muted rounded-3xl animate-pulse` (opacity pulse only) |
| File upload | Progress bar under file chip |
| Processing | Progress card + inline spinner in button |
| Result fetch | Skeleton card |

**No full-page spinners. No overlay loaders.** Every loading state is localized.

---

## 7. Accessibility

| Requirement | Implementation |
|---|---|
| Contrast | Foreground on background: 15:1 (light), 14:1 (dark). All text passes WCAG AAA. |
| Focus | Visible ring on all interactive elements. Never `outline: none` without replacement. |
| Motion | `prefers-reduced-motion` disables all transitions and the spinner rotation (replaced with static "Processing…" text). |
| Screen readers | All icon-only buttons have `aria-label`. Drop zone has `aria-describedby` pointing to constraints text. Progress has `role="progressbar"` with `aria-valuenow`. |
| Forms | Every input has associated `<Label>`. Errors linked via `aria-describedby`. |
| Language | `lang="en"` on `<html>`. |
| Zoom | Layout holds at 200% zoom. No fixed pixel widths on text containers. |

---

## 8. File Structure

```
app/
├── layout.tsx                    # Manrope, theme provider, shell
├── page.tsx                      # Home / tool grid
├── globals.css                   # Tokens, weight floor, shadow kill
├── tools/
│   ├── merge-pdf/page.tsx
│   ├── split-pdf/page.tsx
│   ├── compress-pdf/page.tsx
│   └── [tool]/page.tsx           # Dynamic route for remaining tools
components/
├── ui/                           # shadcn components (owned, modified)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── slider.tsx
│   ├── progress.tsx
│   ├── dialog.tsx
│   ├── alert-dialog.tsx
│   ├── tabs.tsx
│   ├── tooltip.tsx
│   ├── sonner.tsx
│   └── ...
├── tool-shell.tsx                # Shared tool page layout
├── file-drop-zone.tsx            # Custom drop zone
├── file-chip.tsx                 # Custom file list item
├── tool-card.tsx                 # Home grid card
├── result-card.tsx               # Download result
├── progress-card.tsx             # Processing progress
├── theme-toggle.tsx              # Dark/light switch
└── breadcrumb.tsx                # shadcn, styled
lib/
├── tools.ts                      # Tool registry (name, slug, options schema)
├── api.ts                        # Job API client
└── utils.ts                      # cn() and helpers
```

---

## 9. Design Anti-Patterns (Explicitly Forbidden)

| Anti-pattern | Why |
|---|---|
| Any `box-shadow` | Violates shadowless principle |
| `rounded-md` on buttons | Violates full-rounded principle |
| Font weight 400 or below | Violates weight floor |
| Red/green/amber for states | Violates neutral-only principle |
| Gradient backgrounds | Violates flat principle |
| Hover scale/lift | Violates no-surprise-motion principle |
| Full-page loading spinner | Violates localized-loading principle |
| Confetti / celebration animations | Unnecessary, violates flat principle |
| Icon-only buttons without `aria-label` | Accessibility violation |
| Arbitrary spacing values (`p-[13px]`) | Violates spacing scale |
| Multiple primary buttons per view | Violates one-primary-action principle |
| Tool cards with descriptions longer than one line | Breaks grid alignment |

---

## 10. Handoff Checklist

Before any tool page ships:

- [ ] Uses `ToolShell` layout component
- [ ] Drop zone present with correct `accept` and `maxSize`
- [ ] File chips render with remove buttons
- [ ] Options card renders only if tool has options
- [ ] Primary button disabled until validation passes
- [ ] Progress card appears during processing
- [ ] Result card appears on success with download + reset
- [ ] Error alert uses neutral styling (no color)
- [ ] All text ≥ 500 weight, small text ≥ 600
- [ ] All buttons `rounded-full`, all cards `rounded-3xl`
- [ ] Zero `box-shadow` in rendered output
- [ ] Dark mode tested with neutral tokens
- [ ] Keyboard navigable end-to-end
- [ ] `prefers-reduced-motion` respected
- [ ] Focus rings visible on all interactive elements

---

**End of Document.**