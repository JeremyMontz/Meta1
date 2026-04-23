# Claudemonzter Design System

> Business up front. Party in the back.
>
> A mad scientist's experiment into the nature of agentic intelligence and human collaboration — with practical, life-changing goals and impractical philosophical prose.

This is the design system for **Claudemonzter** — the operator-plus-agents practice Jeremy Montz started in March 2026. It covers typography, color, components, voice, and a UI kit that recreates the Canon Matrix, Human Check-in, and marketing splash surfaces.

---

## Context & sources

- **Source repo:** [`JeremyMontz/Meta1`](https://github.com/JeremyMontz/Meta1) — the existing HTML dashboards (`canon.html`, `checkin.html`, `dashboard.html`, `house.html`, `inventory.html`) that Meta1 v2.5 drove. They showcase the canon-integrity data model (agents, files, flags, CI states) this system is built to dress.
- **Origin story (from the repo):** Conceived 3/18/2026, born 3/26/2026, v2.5 on 4/4/2026.
- **Starting-point aesthetic from user:** dark, purple hero, "Young Frankenstein in a tux with a mullet" — resolved into a system that's 90% lab-coat scientist, 10% monster, with occasional inversions.

The Meta1 HTML uses neon-green + violet with Syne display. We chose to **start fresh** (per user direction) rather than honor that palette — the new system keeps the monospace bones and dark backdrop but swaps to Fraunces + bright violet + candlelight-gold accents.

---

## Products represented

- **Canon Matrix** — file-reconciliation dashboard across multiple agents
- **Human Check-in** — operator log / mood-and-notes form
- **Lab Splash** — marketing / about-page surface for Claudemonzter itself

All three live in `ui_kits/claudemonzter/`.

---

## Content fundamentals

**Voice is 90% deadpan technical, 10% mad-scientist flourish.** Headlines and section intros can be philosophical or theatrical; UI labels are terse, mono-cased, and functional. I / you / we are all fine — prefer **we** for philosophical prose, **you** for system messages, first-person **I** for Jeremy's check-in entries.

**Casing rules:**
- `// THIS IS AN EYEBROW` — mono, tracked 0.28em, always prefixed with `//`
- `UPPERCASE MONO` — for labels, badges, and buttons. ≤ 3 words.
- `Title Case, With A Fullstop.` — for display headlines. A period at the end is a tell.
- `sentence case for body.` — paragraphs, card subtitles, notes.
- `"Hark — It's Alive."` — Pirata One. ONE per page, MAX, and only when earned.

**Examples of on-voice copy:**

| Context | On-voice | Off-voice (avoid) |
|---|---|---|
| Button | `▸ RUN DIAGNOSTICS` | `Click to analyze` |
| Empty state | `No orphans this cycle.` | `Looks like there's nothing here!` |
| Error | `R! · required-mia · Pantry ledger missing cardamom.` | `Oops! Something went wrong.` |
| Splash lead | `A mad scientist's experiment into the nature of agentic intelligence…` | `The best tool for your agents` |
| Hyde moment | `It's alive — but it files receipts.` | — |
| Margin note | `(tested it at 3am, still bites)` | `Note: still works at 3am` |

**Emoji:** no. Unicode glyphs (●, ▲, ✕, ⟳, ↗, ★) yes — used as functional icons, not decoration. Exception: a single intentional 🧪 or ⚡ is allowable once per long-form document as a wink.

**Philosophical prose** belongs below the fold, in italic Fraunces or Pirata, as a distinct voice — never in UI chrome. The "impractical philosophical prose" promise is kept by giving it ITS OWN PLACES, not by sprinkling it everywhere.

---

## Visual foundations

### Color
- **Hero:** `--accent` (violet `#b57bff`) + `--accent-deep` (`#7b61ff`). Used on primary buttons, hero words, bolt glyph, the `monzter` word of the wordmark.
- **Canvas:** `--bg` (`#08070d`) — cool near-black with a whiff of plum. Never pure black.
- **Ink:** `--fg` (`#f4f3f7`) — warm off-white, never pure white.
- **Semantic:** `--ok` (absinthe `#a7ff7d`), `--warn` (candlelight `#f5c56a`), `--err` (blood `#ff4757`), `--info` (ether `#8dd9ff`).
- **Party accent:** `--party` (cabaret pink `#ff6ec7`) — reserved for Hyde moments.

Three themes ship in `colors_and_type.css`:
- **lab** (default) — clinical, near-black, violet accents
- **cabinet** — gothic velvet plum-night, candlelight gold, warm paper fg
- **synth** — deep teal-black, CRT phosphor, scanlines

### Type
- **Display:** Fraunces (opsz 144 / italic 48 / -0.02em tracking)
- **Body/UI:** Inter Tight
- **Data/mono:** JetBrains Mono
- **Hyde (sparingly):** Pirata One (blackletter, gothic)
- **Handwriting (margin notes):** Caveat

**Font substitution flag:** All five are from Google Fonts. If you have in-house metrics for any of these, drop TTF/WOFF2 files in `/fonts` and replace `fonts.css`. Pirata One is particularly vibe-dependent — we may want to license a crisper blackletter (e.g. *UnifrakturCook Bold*) before print.

### Backgrounds
- **40px violet grid** (`.bg-grid`) on dashboards and splash surfaces. Subtle — 6% tint.
- **2px scanlines** (`.bg-scanlines`) in the synth theme, overlaid via `::after`.
- **SVG noise** (`.bg-noise`) — optional, for paper-y surfaces. 4% opacity, never more.
- No full-bleed photography; no hand-painted illustrations. If imagery is needed, prefer **anatomical / scientific-diagram line art** — see the mascot for the reference style.
- No gradients for fills. A single-hue `shadow-glow` is the only "glow" treatment.

### Motion
- **Defaults:** 200ms with `cubic-bezier(0.22, 1, 0.36, 1)`. Fades and subtle translates.
- **Glitch:** 6s loop with a 0.4s active window — only on accent labels and key headlines, and **never** on form fields or data.
- **Flicker:** 9s loop on accents only (candlelight feel), always optional.
- No bounces. No confetti. No spring physics.

### Hover / press / focus
- **Hover:** border color goes from `--line` to `--line-loud`, text color goes from `--fg-muted` to `--fg`. No scale, no lift.
- **Press:** opacity to 0.85. No scale.
- **Focus:** 2px `--accent` outline with 2px offset. Always visible.

### Borders & radii
- **Default radius:** 2px (`--r-1`). Sharp by default.
- **Pills only for filter chips / tag clouds.** Never buttons. Never cards.
- **Hairlines are the primary divider** (1px `--line`). Dashed lines (`--line-loud`, 1px dashed) are for "philosophical" section breaks.

### Cards
- Flat. 1px `--line` border, `--bg-elev-1` background, 18px padding.
- No drop shadows by default. `shadow-2` for floating (modals). `shadow-glow` for the ONE featured thing on screen.
- Corner cut in: an eyebrow tick (`// 01`) top-left, a status dot top-right. That's the card anatomy.

### Transparency & blur
- Transparency sparingly: status-cell backgrounds (`color-mix ~8-12%`), never on text.
- No blur. Ever. Frosted glass is for other systems.

### Imagery color vibe
- Cool. Near-monochrome with violet tint. No warm photography. If a photo must appear, duotone it in violet/ink.

### Layout rules
- **Max content width** 1240px.
- **Fixed elements:** top nav hairline (1px, no bar); tweaks panel bottom-right.
- **Grid:** 12-col implicit, 24/32px gutters.

---

## Iconography

**Three-tier approach:**

1. **Unicode glyphs** are the primary icon set: `●` (clean), `▲` (alert), `✕` (error), `⟳` (on-loan), `!` (orphaned), `⚠` (stale), `↗` (external), `▸` (run/CTA), `★` (default), `//` (comment/eyebrow prefix). These inherit type color and sit in the mono face. This matches the Meta1 repo's existing language exactly.
2. **Custom line SVGs** in `assets/` for brand-specific icons: `icon-bolt.svg`, `icon-flask.svg`, `icon-tophat.svg`. 24×24 viewBox, 1.5px stroke, round caps/joins. Use `currentColor` when inlined.
3. **Lucide (CDN)** is the fallback for anything not in the above. **This is a substitution** — when you reach for a Lucide icon, flag it in the design so we know to hand-draw it later.

**Emoji:** no (see voice rules).

The **mascot** (`assets/mascot.svg`) is the one proper illustration — Young Frankenstein in a tux with a mullet, line-drawn, ink + violet only. Use at 96px minimum. Do not recolor. Do not mirror.

---

## Index

Root of this project:

| Path | What |
|---|---|
| `README.md` | This file. |
| `SKILL.md` | Claude Code / Agent-Skills wrapper. |
| `fonts.css` | Google Fonts imports. |
| `colors_and_type.css` | Tokens, themes, semantic element styles, utilities. |
| `assets/` | Mascot, wordmark, monogram, icon SVGs. |
| `preview/` | Asset-review cards (auto-populate the Design System tab). |
| `ui_kits/claudemonzter/` | The UI kit — `index.html` plus JSX components. |

UI kit components:

- `ui_kits/claudemonzter/Wordmark.jsx` — HTML wordmark (preferred over the SVG for text fidelity)
- `ui_kits/claudemonzter/Primitives.jsx` — Eyebrow, Tick, Badge, Button, Hairline, StatusDot, Input, Card
- `ui_kits/claudemonzter/CanonMatrix.jsx` — the canon-integrity dashboard
- `ui_kits/claudemonzter/CheckIn.jsx` — human check-in form + recent log
- `ui_kits/claudemonzter/LabSplash.jsx` — marketing splash

---

## Known caveats / substitutions

- **Fonts** are all Google Fonts; no originals were provided. Swap if you have licensed files.
- **Pirata One** is the closest free gothic blackletter; a commercial cut would elevate the Hyde moments considerably.
- **Mascot** was drawn from scratch (line-art interpretation of "Young Frankenstein in a tux with a mullet + bolt scar + neck plugs + bow tie"). If you have reference or want a proper commissioned illustration, flag it.
- **Meta1 repo's original palette** (neon lime + Syne) was deliberately abandoned in favor of this system. If you want to migrate the live dashboards, all CSS variables map cleanly.
