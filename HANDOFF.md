# room27 handoff

## Project state

- Local workspace: `/Users/kahanishimoto/Documents/room27_WEB 2`
- Local preview URL currently used: `http://127.0.0.1:4188/index.html?v=cursor-ring-spacing-1`
- Baseline archive commit: `29387fe Archive initial reference site state`
- The baseline commit is the imported reference site before layout edits.
- GitHub remote is not configured. Git history is local only.

## Main files

- `index.html`
- `assets/css/styles.css`
- `assets/js/script.js`
- `assets/img/`

## Layout breakpoint rules

Use these rules for all upcoming HTML/CSS layout work:

- `901px` and up: PC layout
- `900px` and down: tablet and below
- `767px` and down: mobile navigation and mobile-specific adjustments
- `560px` and down: small mobile
- Existing `770px` rules should generally be consolidated toward `767px` unless there is a strong reason to keep a separate breakpoint.

Most important boundary:

- `900px`: major layout switch. Plan, Access, and Footer collapse; Gallery becomes 2 columns.
- `767px`: navigation switches to hamburger/drawer.
- `560px`: Gallery and Rental lists become 1 column.

Relevant CSS locations:

- `assets/css/styles.css` around `@media screen and (min-width:900px) and (max-width:1100px)`
- `assets/css/styles.css` around `@media (max-width: 900px)`
- `assets/css/styles.css` around `@media (max-width: 767px)`
- `assets/css/styles.css` around `@media (max-width: 560px)`

## Current uncommitted changes

Only cursor-related changes have been made after the baseline commit.

### 1. Cursor dot is above the circular ring

File: `assets/css/styles.css`

The shared `z-index: 100` was removed from the common `#cur, #cur-ring` block.

Current intended values:

```css
#cur {
  z-index: 101;
}

#cur-ring {
  z-index: 100;
}
```

### 2. More spacing between cursor ring and rotating text

File: `index.html`

The visible outer ring remains:

```html
<circle cx="55" cy="55" r="44"/>
```

The text path was moved inward:

```html
<path id="cursorTextCircle" d="M55,24 a31,31 0 1,1 0,62 a31,31 0 1,1 0,-62" visibility="hidden"/>
```

Previous value:

```html
<path id="cursorTextCircle" d="M55,19 a36,36 0 1,1 0,72 a36,36 0 1,1 0,-72" visibility="hidden"/>
```

Spacing changed from about `8px` to about `13px`.

## Useful commands

Show changes from the archived initial state:

```bash
git diff 29387fe
```

Show only current uncommitted changes:

```bash
git diff
```

Create a patch for a coder:

```bash
git diff 29387fe > changes.patch
```

Start a local server:

```bash
python3 -m http.server 4188
```

