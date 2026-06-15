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
  import SwipeHistory from './components/swipe-history.svelte'
  import UsersList from './components/users-list.svelte'
  import type { TmdbFilm } from '@couchrift/shared/schemas/tmdbFilm.ts'
  import { getUserContext } from '$lib/userService.svelte'

  const ls = getLoungeContext()
  const us = getUserContext()

  let tab: 'deck' | 'history' | 'users' = $state('deck')
  let openFilmDetails = $state(false)

  const deck = $derived(ls.films.slice(0, 3))

  let deckRefs = $state<(SwipeCard | null)[]>([])

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

  const fetchMoreFilms = async () => {
    const result = await ls.queueLoungeFilms()
    if (!result.ok) {
      toast.error(result.error)
    }
  }

  $effect(() => {
    if (ls.lounge.startedAt && !ls.lounge.endedAt && ls.films.length < 5) fetchMoreFilms()
  })

  $effect(() => {
    if (ls.lounge.startedAt && !ls.lounge.endedAt && ls.films.length < 5) fetchMoreFilms()
  })

  $effect(() => {
    return us.onEvent((event) => {
      switch (event.type) {
        case 'swipe':
          const { like, swipedAt } = event.data
          const { id, title, year } = event.data.film
          ls.lounge.swipes.push({ id, title, year, like, swipedAt })
      }
    })
  })

  const film = $derived(ls.films.at(0)!)

</script>

<div class="flex w-full flex-1 min-h-0 flex-col p-4">

  <div class="relative w-full">
    <Button variant="ghost" size="icon-lg" class="absolute left-2 min-h-14" href="/home">
      <img src="/cr_logo.webp" alt="Couch Rift Logo"/>
    </Button>

    <Button variant="ghost" size="icon-lg" class="absolute right-2 min-h-14"
            href={`/${ls.lounge.shortcode}/settings`}>
      <SlidersHorizontal class="size-6"/>
    </Button>
  </div>

  <Tabs.Root value={tab} class="gap-4 w-full flex-1 min-w-0 min-h-0">
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
        <!-- Use a single loop without conditionals to update existing components' depth and animate them -->
        {#each deck as film, i (film.id)}
          <SwipeCard
              bind:this={deckRefs[i]}
              {film}
              depth={i}
              zIndex={deck.length - i}
              onSwipe={(dir, film) => handleSwipe(dir, film)}
              onExit={handleExit}
              onTap={() => { openFilmDetails = true }}
          />
        {/each}
      </div>

      <section class="flex w-4/5 justify-between items-center">
        <Button size="icon"
                class="bg-red-800 hover:bg-red-900 active:bg-red-900 transition-colors rounded-full h-18 w-18"
                onclick={handleDislike}>
          <X class="size-8 fill-background stroke-background stroke-5"/>
        </Button>
        <Drawer.Root bind:open={openFilmDetails}>
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

    <Tabs.Content value="history" class="flex flex-col w-full min-h-0 p-8 mb-4">
      {#if ls.lounge.swipes.length > 0}
         <span class="text-md text-muted-foreground pb-6 w-full">
           Showing <strong>{ls.lounge.swipes.length}</strong> swipes
      </span>
        <SwipeHistory swipes={ls.lounge.swipes}/>
      {:else}
        <h2 class="text-xl font-semibold content-center">No Swipes Yet</h2>
      {/if}
    </Tabs.Content>

    <Tabs.Content value="users" class="flex flex-col w-full min-h-0 p-8 mb-4">
      <span class="text-md text-muted-foreground pb-6 w-full">
        Showing <strong>{ls.lounge.participants.length}</strong> participants
      </span>
      <UsersList/>
    </Tabs.Content>

  </Tabs.Root>

</div>