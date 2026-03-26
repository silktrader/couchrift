# Specifications

## AI Instruction

### Role & Persona

You are an expert full-stack developer assisting with the "Couch Rift" project. You prioritise clean and concise code, performance, and adherence to modern practices.

## Overview

“Couch Rift” is a web application that allows multiple users to agree on a film to watch by way of Tinder-like swipes on film covers.

Hosts create shared sessions ("lounges") and set filters (max runtime, language, excluded genres, earliest release date, etc.). Users join lounges and are then presented with a carousel of random film posters; they swipe left to discard films or right to select the ones they would like to watch.

The lounge ends when every participant has liked the same film.

## Tech Stack

### Architecture

Monorepo with Bun's workspaces:
```
/apps
  /web     (SvelteKit SPA)
  /api     (Bun + Elysia)

/packages
  /shared  (types, schemas, contracts)
```

All packages are importable via workspace aliases (e.g. @cri/shared)

### Backend

- SQLite (WAL mode, PascalCase schemas)
- Bun 1.3.11
- Elysia
- Typebox (validation)
- BetterAuth
- Sharp (avatar images conversion)

SQLite was chosen over PostgreSQL, given:

* the low volume of traffic and writes
* the ease of portability and self-hosting
* the small overhead compared

All swipe inserts and match checks must occur within **transactions** to prevent race conditions when multiple users swipe concurrently.

### Frontend

- SvelteKit 5 (SSR off, SPA mode)
- shadcn-svelte
- Tailwind CSS

### Tooling

- Webstorm (no Prettier)

## Details

### Film Ingestion

* films are periodically fetched from TMDB
* film selection is random (pages, order, rank within page)
* data is stored locally in the database

#### Stored fields:

* title
* runtime
* language
* poster URL
* release date

### Film Queue

At lounge start:

* the server drafts a set of films from the database
* the server sends the same films in random order to all participants

Batching:

- initial batch includes 30 films per participant
- when 90% consumed: fetch and append another batch

Constraints:

- films satisfy lounge filters

### Users

- users have one avatar, a name and an email
- there are registered users and anonymous users, created with BetterAuth's anonymous plugin

### Lounges Rules

* users can swipe a film at most once per lounge
* lounges must include two participants or more to start
* lounges can't be joined after their start
* a film is matched only when all the participants liked it
* all participants share the same film queue but the order is randomised
* lounge filters are set by the creating user.

### Lounge Lifecycle

`waiting` -> `active` -> `completed`

`cancelled` lounges are deleted from the database.

- `waiting`: users join and wait for the start
- `active`: swiping in progress, rules can't be changed
- `completed`: match found, swiping impossible

Users have at most 45 seconds for each card (can be set in the lounge's settings); it's discarded ("disliked") after that.

The user who created the lounge can interrupt the process when she so desires.

### Swipe Logic

#### Submission

- swipes are submitted via POST requests
- swipe values are either `1` (like) or `-1` (dislike)

#### Timeout

- swipe timeout is enforced server-side
- when users don't swipe within the configured time the server inserts a -1 swipe automatically

#### Transaction Requirements

Each swipe must execute in a single transaction:

1. insert swipe
2. if the value is +1, check if the film is a match
3. if a match is found:
    - update the lounge state in the database
    - notify all clients

### Match Logic

A film is considered a match if and only if :
- every participant in the lounge swiped that film
- all swipes are positive (`1`)

### API routes

Lounge participants can:

* join a lounge: `POST /api/lounges/:code/participants`
* leave a lounge: `DELETE /api/lounges/:code/participants/:id`
* get lounge data: `GET /api/lounges/:loungeId`
* start a lounge swiping: `POST /api/lounges/:loungeId/start`
* like or dislike a film: `POST /api/lounges/:loungeId/swipes`
* get lounge films: `GET /api/lounges/:loungeId/queue`
* list the joined lounges: `GET /api/users/me/lounges`

Registered users can also:

* create a lounge: `POST /api/lounges`
* delete a lounge: `DELETE /api/lounges/:loungeId`
* upload their avatar: `POST /api/users/:userId/avatar`

Anonymous users can sign in and register a new account.

### WebSocket Events and Payloads

* user joins lounge: user ID
* user leaves lounge: user ID
* lounge starts: lounge ID
* match found: film details

### Authentication

- managed via BetterAuth
- uses the `email and password` method
- newcomers are assigned a user ID on the fly without needing onboarding