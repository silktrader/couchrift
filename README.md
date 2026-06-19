# Couch Rift

![Bun](https://img.shields.io/badge/Bun-1.3+-000000?logo=bun)
![SvelteKit](https://img.shields.io/badge/SvelteKit-5-FF3E00?logo=svelte)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)
![GitHub License](https://img.shields.io/github/license/silktrader/couch-rift)

> Put an end to discord and quarrels on movie nights. Find a film everyone actually wants to watch!

Choosing a film with friends often turns into twenty minutes of scrolling through streaming services and other options.
The app is named after the engulfing **rift** that forms on the couch when friends disagree about what to watch.

“Couch Rift” is a web application that allows multiple users to agree on a film by swiping through posters in real time.

Create a **lounge**, invite your friends, choose film filters, and start swiping.
Once every participant likes the same film, the lounge ends and the unanimous match is
revealed.

---

## Screenshots

### Home

*Screenshot*

### Lounge Waiting Room

*Screenshot*

### Swiping Films

*Screenshot*

### Match Found

*Screenshot*

---

## Features

* 🎬 **Smart Swipe Queue**: Randomised film queues with rich movie details.
* **Local Cache**: film metadata is stored locally in SQLite after regular ingestion from TMDB.
* ⚡ **Real-Time Synchronisation**: Instant participant and match updates over WebSockets.
* 👥 **Room Management**: Lounges moderation.
* 🔍 **Configurable Filters**: Runtime, language, release year and genre filtering.
* 📱 **Responsive Design**: Optimised for mobile and desktop.

---

## Roadmap

Here's a brief todo list of features to be implemented:

- [x] Avatar uploads
- [ ] Streaming service availability
- [ ] Friend lists
- [ ] Bookmarks
- [ ] Lounge rules to prevent under or over swiping
- [ ] Swipe by actor or actress

---

## How it works

1. Create a lounge.
2. Share the lounge code with your friends.
3. Configure the lounge rules.
4. Start the session.
5. Everyone swipes independently.
6. As soon as **all participants like the same movie**, the lounge ends and the matched film is revealed.

Each participant swipes through the same expanding pool of films, but in a randomised order.

---

## Tech Stack

### Frontend

* SvelteKit 5
* Tailwind CSS
* Eden Treaty
* Shadcn

### Backend

* Bun
* Elysia
* BetterAuth
* SQLite
* TypeBox

### Other

* TMDB API for movie metadata

---

## Project Structure

This repository is a **Bun workspace monorepo**.

```text
apps/
├── api/        # Bun, Elysia backend
└── web/        # SvelteKit frontend

packages/
└── shared/     # Shared types, schemas and utilities
```

---

## Self-Hosting

### Requirements

* Docker
* TMDB API key

### Local Development

To spin up the entire monorepo workspace locally for **development** purposes:

```bash
# Install workspace dependencies
bun install

# Run backend and frontend concurrently in development mode
bun run dev
```

Add `.env` file to `apps/api`.

### Local Production Build

To build and use the web app locally in **production mode**:

```
bun run start
```

Add `.env` file to `apps/api`.

### Docker Compose — Recommended

The easiest way to self-host Couch Rift is via Docker Compose, which packages the application and mounts persistent
volumes for your database and uploaded avatars.

```bash
# Build and run the container suite
docker compose up -d --build

```

Add `.env` file to project root, or set them in the `docker-compose.yml` file.

### Environment variables

The following configuration keys are required:

| Variable             | Description                                  | Example                          |
|----------------------|----------------------------------------------|----------------------------------|
| `BETTER_AUTH_SECRET` | Random encryption key for session management | `openssl rand -base64 32`        |
| `BETTER_AUTH_URL`    | Base URL of your authentication endpoint     | `http://localhost:3000`          |
| `TMDB_API_KEY`       | v3 API Key from The Movie Database           | `check developer.themoviedb.org` |
| `DB_PATH`            | Path where the SQLite file will reside       | `./apps/api/data/couchrift.db`   |
| `UPLOAD_DIR`         | Target storage directory for user avatars    | `./apps/api/data/uploads`        |

---

## License

*Choose a license (MIT, Apache-2.0, GPL, etc.) and add it here.*

---

### Acknowledgements

* [The Movie Database (TMDB)](https://www.themoviedb.org/) for movie metadata and artwork. This product uses TMDB's
  API but is not endorsed or certified by TMDB.

