<script lang="ts">
  import { getLoungeContext } from '$lib/loungeService.svelte'
  import { Button } from '$lib/components/ui/button'
  import * as Tabs from '$lib/components/ui/tabs'
  import * as Drawer from '$lib/components/ui/drawer'
  import {
    GalleryHorizontalEnd, Clapperboard, SlidersHorizontal, Heart, X, Users
  } from '@lucide/svelte/icons'
  import { FilmCard } from '$lib/components/films/film-card'
  import { toast } from 'svelte-sonner'
  import SwipeCard from './components/swipe-card.svelte'
  import type { TmdbFilm } from '@couchrift/shared/schemas/tmdbFilm.ts'

  const ls = getLoungeContext()

  let tab: 'deck' | 'history' | 'users' = $state('deck')

  const deck = $derived(ls.films.slice(0, 3))

  let deckRefs = $state<any[]>([])

  async function handleSwipe(dir: 'left' | 'right', film: TmdbFilm): Promise<boolean> {
    const result = await ls.sendSwipe(dir === 'right' ? 1 : -1)
    if (result.ok) return true

    toast.error(`Couldn't swipe ${film.title}.`)
    return false
  }

  async function handleLike() {
    deckRefs[0]?.api.swipe('right')
  }

  async function handleDislike() {
    deckRefs[0]?.api.swipe('left')
  }

  function handleExit() {
    ls.dequeueFilm()
  }

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

  const film = $derived(ls.films.at(0)!)

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
                  class="flex flex-col h-full w-full items-center justify-between py-4 min-w-0 min-h-0 gap-6">

      <div class="relative flex-1 w-full">
        {#each deck as film, i (film.id)}
          <SwipeCard
              bind:this={deckRefs[i]}
              {film}
              depth={i}
              zIndex={deck.length - i}
              onSwipe={(dir, film) => handleSwipe(dir, film)}
              onExit={handleExit}
          />
        {/each}
      </div>

      <section class="flex w-4/5 justify-between items-center">
        <Button size="icon" class="bg-red-800 rounded-full h-18 w-18" onclick={handleDislike}>
          <X class="size-8 fill-background stroke-background stroke-5"/>
        </Button>
        <Drawer.Root>
          <Drawer.Trigger>
            <Button size="icon" variant="outline" class="rounded-full h-14 w-14 border-2">
              <Clapperboard class="size-6"/>
            </Button>
          </Drawer.Trigger>
          <Drawer.Content class="md:max-w-lg mx-auto">
            <FilmCard {film}/>
          </Drawer.Content>
        </Drawer.Root>

        <Button size="icon" class="rounded-full h-18 w-18" onclick={handleLike}>
          <Heart class="size-8 fill-background stroke-background"/>
        </Button>
      </section>

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