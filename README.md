# Worpple

A daily puzzle game collection — NYT-inspired, built with Svelte 5.

Puzzles reset daily. Currently in active development with Pipes (live) and more games on the way.

## Games

| Game | Status |
|---|---|
| **Pipes** | ✅ Live — Connect the pipes by rotating hexagonal tiles. Daily puzzle + practice mode. |
| Wordle | 🔧 Planned |
| Connections | 🔧 Planned |
| Spelling Bee | 🔧 Planned |
| Mini Crossword | 🔧 Planned |
| Strands | 🔧 Planned |

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Svelte 5](https://svelte.dev) with runes (`$state`, `$derived`, `$effect`) |
| Language | TypeScript (strict) |
| Styling | [Tailwind v4](https://tailwindcss.com) + custom NYT-inspired design tokens |
| UI Kit | [shadcn-svelte](https://shadcn-svelte.com) (bits-ui, melt-ui) |
| Database | SQLite via [Drizzle ORM](https://orm.drizzle.team) |
| Auth | Lucia (v3, deprecated — may migrate to better-auth) |
| PWA | `@vite-pwa/sveltekit` (service worker + manifest) |
| Docker | Multi-stage build (dev + production) |

## Quickstart

```sh
# Clone the repo
git clone https://github.com/wyatts97/Worpple.git
cd Worpple

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker (alternative)

```sh
docker compose up --build
```

The dev server will be available at `http://localhost:5173`.

## Project Structure

```
src/
├── lib/
│   ├── components/        # Shared UI components
│   │   ├── game/          # Game-specific (Tile, Keyboard, ResultModal, GameCard)
│   │   ├── layout/        # AppShell, Header
│   │   └── ui/            # shadcn components (dialog, button, etc.)
│   ├── games/
│   │   └── pipes/         # Pipes game (types, hexgrid, game logic, puzzles, Svelte components)
│   ├── stores/            # Rune-based stores (IDB wrapper, preferences, streaks, gameState)
│   ├── server/            # Server-side DB & auth
│   └── index.ts
├── routes/
│   ├── +layout.svelte     # App shell wrapper
│   ├── +page.svelte       # Game hub / home page
│   └── pipes/             # Pipes game route
├── app.css                # Global styles & design tokens
└── app.html               # HTML shell
```

## Design

NYT-inspired color palette defined in `src/app.css` via Tailwind `@theme`:

- **Base**: Clean white/gray surfaces with subtle borders
- **Game states**: Green (correct), yellow (present), gray (absent)
- **Pipes**: Component colors cycle through 8 distinct pastels
- **Dark mode**: Supported via Tailwind `dark:` variant
- **Typography**: Libre Baskerville (headings), IBM Plex Sans (body)

## License

MIT
