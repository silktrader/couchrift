<img width="1123" height="427" alt="full_logo" src="https://github.com/user-attachments/assets/e6927202-98b0-4973-a4c6-9962f7d9e5c7" />


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


<img width="400" alt="Home" src="https://github.com/user-attachments/assets/6c36fd72-9559-4396-b922-3ff62e8a9f8b" />


### Lounge Room


<img width="400" alt="Ended Lounge" src="https://github.com/user-attachments/assets/b4ef9427-80dc-40bc-9166-89e5879210ce" />


<img width="400" alt="Lounge Settings" src="https://github.com/user-attachments/assets/02dd7bcc-0d9d-4cef-bcac-c0bbc6c8fe87" />


### Swiping Films


<img width="400" alt="Swipe" src="https://github.com/user-attachments/assets/543192ce-1bd9-4034-a49a-4c2c6d2c2480" />


<img width="400" alt="Film Details" src="https://github.com/user-attachments/assets/aec43a58-b84b-4274-96a7-080a41a4a130" />


### Match Found


<img width="400" alt="It's a Match!" src="https://github.com/user-attachments/assets/a3c50a28-7f3e-46cf-8ffa-ee18c524d385" />


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

### Acknowledgements

* [The Movie Database (TMDB)](https://www.themoviedb.org/) for movie metadata and artwork.

