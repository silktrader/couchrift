<script lang="ts">
  import * as languages from '$lib/languages'
  import type { TmdbFilm, FilmPerson } from '@couchrift/shared/schemas/tmdbFilm'
  import { formatDuration } from '$lib/dates'
  import { Button } from '$lib/components/ui/button'
  import { Timer, ExternalLink } from '@lucide/svelte/icons'
  import { ActorPortrait } from '$lib/components/films/actor-portrait'

  let { film }: { film: TmdbFilm } = $props()

  const people = $derived.by(() => {
    const writers: FilmPerson[] = []
    const actors: FilmPerson[] = []
    const directors: FilmPerson[] = []
    for (const person of film.people.toSorted((a, b) => a.priority - b.priority)) {
      if (person.role === 'writer') writers.push(person)
      else if (person.role === 'director') directors.push(person)
      else actors.push(person)
    }
    return { writers, actors, directors }
  })

</script>

<div class=
         "overflow-y-auto h-[90vh] sm:max-w-full mt-2 no-scrollbar relative mask-[linear-gradient(to_bottom,transparent_0%,black_30px,black_calc(100%-80px),transparent_100%">

  <!-- Header -->
  <div class="relative w-full h-100 overflow-hidden">

    <img src={`https://image.tmdb.org/t/p/w500/${film.backdrop}`}
         alt="Backdrop"
         class="w-full h-full object-cover mask-[linear-gradient(to_bottom,transparent,black_12%,black_50%,transparent)] mask-no-repeat"/>

    <div class="absolute bottom-4 left-4 right-4 flex items-end gap-3">

      <img src={`https://image.tmdb.org/t/p/w500/${film.poster}`}
           alt="Poster"
           class="w-32 rounded-lg shadow-2xl shadow-background border border-foreground/10 object-cover z-10 shrink-0"/>

      <div class="flex-1 mb-1 z-10 overflow-hidden">
        <div class="flex flex-wrap gap-2 mb-2">
          {#each film.genres as genre}
                <span
                    class="text-sm text-secondary-foreground font-semibold uppercase tracking-wider
                           px-1 py-0.5 rounded bg-secondary/20 border border-secondary-foreground/20 backdrop-blur-md">
                  {genre}
                </span>
          {/each}
        </div>

        <h2 class="text-3xl font-bold leading-tight drop-shadow-lg text-foreground mb-1 line-clamp-2">
          {film.title}
        </h2>

        <div class="flex flex-wrap gap-4 text-sm items-center">
          <span class="font-semibold text-foreground/90">{film.year}</span>

          <span class="flex items-center gap-1 text-muted-foreground">
            <Timer class="size-4"/>{formatDuration(film.runtime)}
          </span>

          {#if film.language !== 'en'}
            <span class="text-muted-foreground [font-variant:small-caps]">{languages.getLabel(film.language)}</span>
          {/if}
        </div>

      </div>

    </div>

  </div>

  <!-- Main contents -->
  <div class="relative z-20 p-6 text-base">

    <!-- Directors and Writers -->
    <div class="grid grid-cols-2 gap-8 mb-8">

      <div>
        <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
          {people.directors.length > 1 ? 'Directors' : 'Director' }
        </h3>
        <div class="text-foreground capitalize flex flex-col">
          {#each people.directors.slice(0, 3) as director}
            <span>{director.name}</span>
          {/each}
        </div>
      </div>

      <div>
        {#if people.writers.length}
          <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            {people.writers.length > 1 ? 'Writers' : 'Writer' }
          </h3>
          <div class="text-foreground capitalize flex flex-col">
            {#each people.writers.slice(0, 3) as writer}
              <span>{writer.name}</span>
            {/each}
          </div>
        {:else}
          <!-- Empty cell when no writers detected -->
          <div></div>
        {/if}
      </div>

    </div>

    <!-- Overview -->

    <div class="mb-8">
      <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Overview</h3>
      <p class="text-foreground/90 leading-relaxed">
        {film.overview || "No overview available."}
      </p>
    </div>

    <!--  Cast -->
    <div class="mb-8">
      <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Cast</h3>
      <div class="grid grid-cols-3 md:grid-cols-4 gap-8 mb-8">

        {#each people.actors as actor }
          <ActorPortrait {actor}/>
        {/each}

      </div>

    </div>

    <!-- Links -->

    <div class="flex gap-4 text-muted-foreground w-full justify-center mt-8">
      <Button variant="outline"
              href={`https://www.themoviedb.org/movie/${film.id}`}
              target="_blank"
              rel="noopener noreferrer">
        <ExternalLink/>
        TMDB
      </Button>
      <Button variant="outline"
              href={`https://www.imdb.com/find/?q=${film.title}%20${film.year}&s=tt&exact=true`}
              target="_blank"
              rel="noopener noreferrer">
        <ExternalLink/>
        IMDB
      </Button>
    </div>

  </div>

</div>