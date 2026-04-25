# Specifications

## Overview

“Couch Rift” is a web application that allows multiple users to agree on a film to watch by swiping through film
posters.

Hosts create shared sessions ("lounges") and set filters (max runtime, language, excluded genres, earliest release date,
etc.). Users join lounges. When lounges start, users are then presented with a series of random film posters; they swipe
left to discard
films or right to select the ones they would like to watch.

The lounge ends when every participant has liked the same film.

## Tech Stack

### Repository's Structure

This is a **monorepo** with Bun's workspaces.

```
├── apps
│   ├── api
│   │   ├── data
│   │   ├── src
│   │   │   ├── db
│   │   │   │   └── migrations
│   │   │   ├── film
│   │   │   ├── lib
│   │   │   ├── lounge
│   │   │   └── user
│   │   └── test
│   └── web
│       ├── src
│       │   ├── lib
│       │   │   ├── assets
│       │   │   ├── components
│       │   │   │   ├── layout
│       │   │   │   └── ui
│       │   │   └── hooks
│       │   └── routes
│       │       ├── (registered)
│       │       │   ├── [shortcode]
│       │       │   ├── home
│       │       │   ├── me
│       │       │   └── welcome
│       │       └── (unregistered)
│       │           ├── register
│       │           └── sign-in
│       └── static
└── packages
    └── shared
        ├── config
        ├── schemas
        └── utilities
```

`apps/web` refers to the SvelteKit SPA.
`apps/api` contains the Bun + Elysia backend.
`packages/shared` holds the types, schemas and contracts shared by the API and web client.

All packages are importable via workspace aliases (e.g. @cri/shared)

### Backend

- SQLite, via Bun's SQLite3 driver
- Bun 1.3.12
- Elysia
- Eden Treaty
- Typebox (validation)
- BetterAuth
- Sharp (avatar images conversion)

#### SQLite

- features on: WAL, foreign keys, strict mode
- use `query()` in most cases, as bun:sqlite prepares and caches the statement
- use `prepare()` instead of `query()` for dynamically generated SQL
- prefer `query()` with generic parameters for type safety and minimal overhead:

    ```
    db.query<{title: string, id: string}, {min: number}>(
    "SELECT title, id FROM films WHERE runtime > @min"
    ).all({min})
    ```

- defined parameters with `@param` syntax
- defined column names with Pascal case
- swipe inserts and match checks must occur within transactions to prevent race conditions when multiple users
  swipe concurrently
- store dates like `updatedAt`, `createdAt`, etc. as integer timestamps including milliseconds
- don't use `unixepoch() * 1000` for dates as it loses precision
- use `immediate` for write transactions

### Frontend

- SvelteKit 5 (SSR off, SPA mode)
- shadcn-svelte
- Tailwind CSS

### TypeScript

- TypeScript 6.0 strict
- use `getOrInsert` and `getOrInsertComputed` with `Map`
- prefer discriminated unions and result objects over throwing exceptions
- switch statements exhaustiveness is checked by the IDE

#### File: `tsconfig.json`

<file path="tsconfig.json" type="json">
{
  "compilerOptions": {
	"lib": [
	  "ESNext"
	],
	"target": "ESNext",
	"module": "Preserve",
	"moduleDetection": "force",
	"jsx": "react-jsx",
	"allowJs": true,
	"moduleResolution": "bundler",
	"allowImportingTsExtensions": true,
	"verbatimModuleSyntax": true,
	"noEmit": true,
	"strict": true,
	"skipLibCheck": true,
	"noFallthroughCasesInSwitch": true,
	"noUncheckedIndexedAccess": true,
	"noImplicitOverride": true,
	"stableTypeOrdering": true,
	"noUnusedLocals": false,
	"noUnusedParameters": false,
	"noPropertyAccessFromIndexSignature": false
  }
}
</file>

## Instructions

### Svelte 5

- NEVER use Svelte 4 legacy syntax (no `export let`, no `$:`, no `onMount`).
- Use runes: `$state()`, `$derived()`, `$effect()`, and `$props()`.
- Use component props `let { prop1, prop2 } = $props<{ prop1: string }>();`.
- Use standard HTML attributes (e.g., `onclick={handler}`) instead of `on:click`.
- Use `{#snippet name()}` for reusable lightweight UI chunks instead of extra components.
- Keep logic in `.svelte.ts` files using runes for universal reactivity.

### Elysia and Bun

- Always assume Bun. Use `bun add` and `Bun.password`, etc.
- Use functional chaining with Elysia: `new Elysia().get().post()`.
- Use Elysia's built-in `t` (TypeBox) for schema validation in the `body` and `query`.
- Destructure the context in handlers (e.g., `({ body, params, set }) => ...`).
- Prefer Bun's native methods to Node ones.
- Use @elysiajs/websocket rather than other libraries.

### Architecture and Style

- SvelteKit handles the frontend/routing; Elysia handles the API.
- Prefer arrow functions, ternaries, and short-circuiting where it improves readability.
- Use TypeScript strictly. Avoid `any`. Let Elysia/Svelte infer types where possible.
- Return object literals result types for business logic and service-level functions.

### Error Handling

All service functions return either `Failure`, `FailureWithDetails` or `Success`:

```ts
export type Success<T = void> = { readonly ok: true, readonly data: T };

export type Failure<E extends string> = {
  readonly ok: false;
  readonly error: E;
}

export type FailureWithDetails<E extends string> = {
  readonly ok: false;
  readonly error: E;
  readonly details: string;
}
```

Errors are:

- deterministic
- string-literal based

## Details

### Film Ingestion

Films are periodically fetched from TMDB and stored in `films`:

1. a random page from https://api.themoviedb.org/3/discover/movie is fetched
2. the films within are filtered to remove adult ones, shorts, documentaries, films without posters, etc.
3. for each filtered film details are fetched from https://api.themoviedb.org/3/movie/{movie_id} and stored in `films`

### Film Queue

Each lounge has a **shared pool** of films: `lounge_films`.

1. the creator starts a lounge with a POST request
2. the server selects X number of films from the `films` table, based on a pre-generated random seed, and stores them in
   `lounge_films`
3. the client issues requests for films to swipe with a GET request
4. the server sends the lounge films that the user hasn't swiped yet in batches of 15 films

During each batch request the server evaluates whether to refill `lounge_films` with new items from the app wide
`films`.

#### Constraints

- a film appears at most once per lounge
- a user never receives the same film twice

#### Batching

- clients get 15 films per batch
- when 5 films or fewer remain in the client's cache another batch of films is fetched and appended to the existing one

### Lounges Rules

* users can swipe a film at most once per lounge
* lounges must include two participants or more to start
* lounges can't be joined after their start
* a film is matched only when all the participants liked it
* all participants share the same film queue but the order is randomised
* lounge filters are set by the creating user.

### Lounge States and Transitions

```
waiting               (rules are decided, swiping impossible)
waiting → active      (lounge started, changing rules becomes impossible, new users are prevented from joining)
active  → completed   (match found, swiping becomes impossible)
waiting → deleted     (creator deleted the lounge)
active  → deleted     (creator deleted the lounge)
```

Entries in `lounge_films`, `swipes` and `lounge_participants` are removed when a lounge is deleted.

### Swipe Logic

#### Submission

Swipes are submitted via POST requests with a `value` of either `1`, for likes, or `-1` for dislikes.

A swipe is rejected when:

- the lounge is not `active`
- the user is not a participant
- the user already swiped the film

#### Transaction Requirements

Each swipe must be processed atomically, within a single `IMMEDIATE` transaction:

- check lounge state
- insert swipe
- check match

### Match Logic

A film is considered a match if and only if :

- every participant in the lounge swiped that film
- all swipes are positive (`1`)

When a match is detected, the lounge ends (`endedAt` is set) and the matched film is communicated by Websocket
broadcast.
Subsequent swipes are rejected.

## API routes

Lounge participants can:

* join a lounge that hasn't started or ended: `POST /api/lounges/waiting/:code/participants`
* leave a lounge that hasn't ended: `DELETE /api/lounges/:loungeId/participants/:participantId`
* get data from a lounge: `GET /api/lounges/:loungeId`
* fetch active lounge by code: `GET /api/lounges/active/:code`
* like or dislike a film: `POST /api/lounges/:loungeId/swipes`
* get lounge films: `GET /api/lounges/:loungeId/queue`
* list the joined lounges: `GET /api/users/me/lounges`
* fetch unswiped films in a lounge: `GET api/lounges/:loungeId/films/unswiped/me`

Lounge creators can:

* create a lounge: `POST /api/lounges`
* delete a lounge: `DELETE /api/lounges/:loungeId`
* start a lounge: `POST /api/lounges/:loungeId/start`
* kick a user: `DELETE /api/lounges/:loungeId/participants/:participantId`

Registered users can also:

* create a lounge: `POST /api/lounges`
* upload their avatar: `POST /api/users/me/avatar`
* list all the active lounges they've joined: `GET /api/me/lounges/active`

Anonymous users can sign in and register a new account.

Use `loungeId` for internal IDs and `code` for public joins.

## WebSocket Events and Payloads

```
user_joined:  { id, name, image }
user_left: { id, name }
user_removed: { id, name }
lounge_started: { startedAt }
match_found: { filmId, title, language, year, runtime, poster, backdrop, overview }
```

## Authentication

- managed via BetterAuth
- uses the `email and password` method

## SQLite Schema

```
create table migrations (
    filename  TEXT primary key,
    appliedAt INTEGER default (unixepoch()) not null
);

CREATE TABLE IF NOT EXISTS users (
    id            TEXT    NOT NULL PRIMARY KEY,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    image         TEXT,
    isAnonymous   INTEGER          DEFAULT 0, -- for later use by the anonymous plugin
    createdAt     INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updatedAt     INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS lounges (
    id        TEXT PRIMARY KEY,
    creatorId TEXT    NOT NULL REFERENCES users (id),
    shortcode TEXT    NOT NULL, -- must be unique among active lounges
    createdAt INTEGER NOT NULL,
    startedAt INTEGER,          -- start timestamp required by late reconnects on missing WS updates
    endedAt   INTEGER,          -- end timestamp signals the lounge's inactivity
    settings  TEXT    NOT NULL, -- JSON field
    CONSTRAINT json_settings CHECK (json_valid(settings))
);

CREATE INDEX IF NOT EXISTS idx_lounges_creator ON lounges (creatorId);

CREATE TABLE IF NOT EXISTS lounge_participants (
    loungeId       TEXT NOT NULL REFERENCES lounges (id) ON DELETE CASCADE,
    participantId  TEXT NOT NULL REFERENCES users (id),
    disconnectedAt INTEGER,
    PRIMARY KEY (loungeId, participantId)
) WITHOUT ROWID;


CREATE TABLE IF NOT EXISTS films (
    id       INTEGER PRIMARY KEY,                           -- TMDB id
    title    TEXT    NOT NULL,
    language TEXT    NOT NULL CHECK (length(language) = 2), -- ISO 639-1
    year     INTEGER NOT NULL CHECK (year >= 1888),
    runtime  INTEGER NOT NULL CHECK (runtime > 0),
    added    INTEGER NOT NULL,  -- ingestion timestamp
    poster   TEXT    NOT NULL,
    backdrop TEXT    NOT NULL,
    overview TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS genres (
    id        INTEGER PRIMARY KEY,
    name      TEXT    NOT NULL UNIQUE,
    updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS film_genres (
    film_id  INTEGER NOT NULL REFERENCES films (id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres (id),
    PRIMARY KEY (film_id, genre_id)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_film_genres_genre ON film_genres (genre_id)
    
CREATE TABLE IF NOT EXISTS lounge_films (
    loungeId TEXT    NOT NULL REFERENCES lounges (id) ON DELETE CASCADE,
    filmId   INTEGER NOT NULL, -- TMDB id, stands alone and is resilient when films are removed
    PRIMARY KEY (loungeId, filmId)
) WITHOUT ROWID;    


CREATE TABLE IF NOT EXISTS swipes (
    loungeId TEXT    NOT NULL REFERENCES lounges (id) ON DELETE CASCADE,
    userId   TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    filmId   INTEGER NOT NULL, -- refers to TMDB's ID; remains relevant even in the film's absence from `films`                                 
    swipedAt INTEGER NOT NULL CHECK (swipedAt > 1000000000000), -- circa 2001 in ms
    value    INTEGER NOT NULL CHECK (value IN (1, -1)),         -- like (1) or dislike (-1)
    PRIMARY KEY (loungeId, userId, filmId)
) WITHOUT ROWID;



CREATE INDEX idx_swipes_match ON swipes (loungeId, filmId) WHERE value = 1; -- helps with match finding
```