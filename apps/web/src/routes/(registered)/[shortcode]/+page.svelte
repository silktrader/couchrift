<script lang="ts">
  import { getLoungeContext } from '$lib/loungeService.svelte'
  import { Button } from '$lib/components/ui/button'
  import * as Tabs from '$lib/components/ui/tabs'
  import * as Drawer from '$lib/components/ui/drawer'
  import { Badge } from '$lib/components/ui/badge'
  import {
    GalleryHorizontalEnd, Calendar, Flame, Timer, SlidersHorizontal, Heart, X, Users, ExternalLink
  } from '@lucide/svelte/icons'
  import * as languages from '$lib/languages'
  import { formatDuration } from '$lib/dates'
  import { toast } from 'svelte-sonner'

  const ls = getLoungeContext()

  let tab: 'deck' | 'history' | 'users' = $state('deck')

  let fetchingFilms: boolean = $state(false)

  const fetchMoreFilms = async () => {
    fetchingFilms = true
    const result = await ls.queueLoungeFilms()
    if (!result.ok) {
      toast.error(result.error)
    }
    fetchingFilms = false
  }

  $effect(() => {
    if (ls.lounge.startedAt && !ls.lounge.endedAt && ls.films.length < 5) fetchMoreFilms()
  })

  $effect(() => {
    const subscriptions: (() => void)[] = []

    subscriptions.push(
      ls.onEvent((event) => {
        if (event.type === 'lounge_matched') {
          toast.success(`We have a match! ${event.match.title}`)
        }
      })
    )

    return () => subscriptions.forEach((unsub) => unsub())
  })

  const film = $derived(ls.films.at(-1)!)

  async function handleLike() {
    await handleSendSwipe(1)
  }

  async function handleDislike() {
    await handleSendSwipe(-1)
  }

  async function handleSendSwipe(value: 1 | -1) {
    if (!film) return
    const { id, title } = film
    const result = await ls.sendSwipe(id, value)

    if (!result.ok) {
      toast.error(`Couldn't swipe ${title} .`)
    }
  }

</script>

<div class="flex h-full w-full flex-1 flex-col">

  <div class="relative w-full">
    <Button variant="ghost" size="icon-lg" class="absolute left-2 min-h-14" href="/home">
      <img src="/cr_logo.webp" alt="Couch Rift Logo"/>
    </Button>

    <Button variant="ghost" size="icon-lg" class="absolute right-2 min-h-14">
      <SlidersHorizontal class="size-6"/>
    </Button>
  </div>

  <Tabs.Root value={tab} class="gap-4 w-full h-full flex-1 min-w-0 min-h-0">
    <Tabs.List class="grid mx-auto min-h-14 grid-cols-3 bg-muted/50 rounded-full z-0">
      <Tabs.Trigger class="w-16 group rounded-full z-0" value="deck">
        <GalleryHorizontalEnd class="size-5 z-0 fill-none transition-all group-data-[state=active]:fill-foreground"/>
      </Tabs.Trigger>
      <Tabs.Trigger class="w-16 group rounded-full z-0" value="history">
        <Heart class="size-5 z-0 fill-none transition-all group-data-[state=active]:fill-foreground"/>
      </Tabs.Trigger>
      <Tabs.Trigger class="w-16 group rounded-full z-0" value="users">
        <Users class="size-5 z-0 fill-none transition-all group-data-[state=active]:fill-foreground"/>
      </Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="deck"
                  class="flex flex-col h-full w-full items-center justify-center min-w-0 min-h-0 gap-6 transition-opacity duration ease-in-out opacity-100">
      {#if film}

        <img src={`https://image.tmdb.org/t/p/w500/${film.poster}`}
             alt={`${film.title} Poster`}
             class="flex-1 min-h-0 rounded-lg border border-foreground/10 object-contain z-10"/>

        <section class="flex flex-col gap-2">
          <h2 class="text-2xl font-bold leading-tight drop-shadow-lg text-foreground line-clamp-2">
            {film.title}
          </h2>
          <div class="flex w-full flex-wrap gap-2">
            <img src={languages.getFlag(film.language)}
                 width="16"
                 alt="Film Language"/>
            <Badge variant="secondary" class="py-3">
              <Calendar/> {film.year}</Badge>
            <Badge variant="secondary" class="py-3">
              <Timer/>{formatDuration(film.runtime)}</Badge>
            <Badge variant="secondary" class="py-3">
              <Flame/>
              <Flame/>
            </Badge>
            <div class="flex w-full gap-2">
              {#each film.genres as genre}
                <span class="text-sm font-semibold [font-variant:small-caps] px-1.5 py-0.5 rounded
                bg-secondary/60 text-foreground/80 border border-secondary/20 backdrop-blur-md">
                  {genre}
                </span>
              {/each}
            </div>
          </div>

        </section>

        <section class="flex justify-around">
          <Button size="icon" variant="outline" class="rounded-full h-18 w-18 border-2" onclick={handleDislike}>
            <X class="size-8"/>
          </Button>
          <Button size="icon" class="rounded-full h-18 w-18" onclick={handleLike}>
            <Heart class="size-8 fill-background stroke-background"/>
          </Button>
        </section>
      {:else}
        <h2 class="text-2xl font-semibold">Missing Film</h2>
      {/if}
    </Tabs.Content>

    <Tabs.Content value="history"
                  class="flex flex-col h-full w-full justify-center items-center">
      <h2 class="text-2xl font-semibold content-center">Swipes</h2>
    </Tabs.Content>

    <Tabs.Content value="users"
                  class="flex flex-col h-full w-full justify-center items-center">
      <h2 class="text-2xl font-semibold content-center">Users</h2>
    </Tabs.Content>

  </Tabs.Root>

</div>

<Drawer.Root>
  <Drawer.Trigger>More</Drawer.Trigger>
  <Drawer.Content class="md:max-w-lg mx-auto">
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
               class="w-28 h-40 rounded-lg shadow-2xl shadow-background border border-foreground/10 object-cover z-10 shrink-0"/>

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
              <span class="font-semibold text-foreground/90 text-xs/0">{film.year}</span>

              <span class="flex items-center gap-1 text-foreground/70 text-xs/0">
                <Timer class="size-4"/>{formatDuration(film.runtime)}
              </span>
            </div>

          </div>

        </div>

      </div>

      <!-- Main contents -->
      <div class="relative z-20 p-6 text-base">

        <div class="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Director</h3>
            <div class="text-foreground">
              Absent A.
            </div>
          </div>
          <div>
            <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Language</h3>
            <div class="text-foreground truncate capitalize">
              {languages.getLabel(film.language)}
            </div>
          </div>

        </div>

        <!-- Overview -->

        <div class="mb-8">
          <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Overview</h3>
          <p class="text-foreground/90 leading-relaxed">
            {film.overview || "No overview available."}
          </p>
        </div>

        <!-- Links -->

        <div class="flex gap-4 text-muted-foreground">
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
  </Drawer.Content>
</Drawer.Root>