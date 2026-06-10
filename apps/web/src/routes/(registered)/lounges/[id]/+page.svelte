<script lang="ts">
  import type { PageProps } from './$types'
  import { Button, buttonVariants } from '$lib/components/ui/button'
  import { formatRelativeTime, formatTime, formatDate, formatDistanceBetweenDates } from '$lib/dates'
  import { Calendar, ArrowLeft, Film, ThumbsUp, ThumbsDown, ArrowRight, Hourglass } from '@lucide/svelte'
  import * as Avatar from '$lib/components/ui/avatar'
  import * as Card from '$lib/components/ui/card'
  import * as Drawer from '$lib/components/ui/drawer'
  import LoungeFilters from '$lib/components/settings/lounge-filters/lounge-filters.svelte'
  import { browser } from '$app/environment'
  import { FilmCard } from '$lib/components/films/film-card'
  import { Badge } from '$lib/components/ui/badge'

  let { data }: PageProps = $props()

  // Under the current model only one match is allowed per lounge
  const lounge = $derived(data.lounge)
  const match = $derived(lounge.matches[0])

  const startDate = $derived(new Date(lounge.startedAt))
  const endDate = $derived(new Date(match.matchedAt))

  function goBack() {
    if (browser) window.history.back()
  }
</script>

<header class="flex w-full flex-row px-4 py-8">
  <Button size="icon-lg" variant="ghost" onclick={goBack}>
    <ArrowLeft class="size-8"/>
  </Button>

  <h3 class="flex flex-col gap-2 items-center justify-center flex-1 h-10 pr-4">
    <span class="text-xl font-semibold font-bebas">{match.title}</span>
    <span class="flex gap-2 items-center text-md text-muted-foreground"><Calendar class="size-4"/>
      {formatRelativeTime(lounge.endedAt)}
    </span>
  </h3>

</header>

<div class="flex flex-col flex-1 items-center gap-6 p-4">

  <LoungeFilters settings={lounge.settings}/>

  <Card.Root class="w-full">
    <Card.Header>
      <Card.Title>
        Participants
      </Card.Title>
      <Card.Description>
        Users who took part in the selection process and their preferences.
      </Card.Description>
    </Card.Header>

    <Card.Content class="flex flex-col gap-8">

      {#each lounge.participants as participant (participant.id)}
        <div class="grid grid-cols-4 items-center justify-items-start">
          <Avatar.Root class="size-10 ring-1 justify-self-start">
            {#if participant.image}
              <Avatar.Image src={`/uploads/avatars/${participant.image}`} alt="User Avatar"/>
            {/if}
            <Avatar.Fallback>{participant.name[0].toLocaleUpperCase()}.</Avatar.Fallback>
          </Avatar.Root>
          <div class="flex gap-2 font-mono items-center">
            <Film class="size-4"/>
            <span>{participant.liked + participant.disliked}</span>
          </div>
          <div class="flex gap-2 font-mono items-center">
            <ThumbsUp class="size-4"/>
            <span>{participant.liked}</span>
          </div>
          <div class="flex gap-2 font-mono items-center">
            <ThumbsDown class="size-4"/>
            <span>{participant.disliked}</span>
          </div>
        </div>
      {/each}

    </Card.Content>
  </Card.Root>

  <Card.Root class="w-full">
    <Card.Header>
      <Card.Title>
        Time and Day
      </Card.Title>
      <Card.Description>
        How long the process took.
      </Card.Description>
    </Card.Header>

    {#if startDate.toDateString() === endDate.toDateString()}
      <Card.Content class="flex flex-col gap-8">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span class="font-medium text-muted-foreground">Date</span>
          <div class="flex items-center gap-2">
            <span>{formatDate(startDate)}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span class="font-medium text-muted-foreground">Duration</span>
          <div class="flex items-center gap-8">
            <div class="flex items-center gap-1">
              <span>{formatTime(startDate)}</span>
              <ArrowRight class="size-4"/>
              <span>{formatTime(endDate)}</span>
            </div>
            <div class="flex items-center gap-1">
              <Hourglass class="size-4 text-muted-foreground"/>
              <span class="text-muted-foreground">1 min.</span>
            </div>
          </div>
        </div>
      </Card.Content>
    {:else}
      <Card.Content class="flex flex-col gap-8">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span class="font-medium text-muted-foreground">Start</span>
          <div class="grid grid-cols-2 items-center gap-8">
            <span class="whitespace-nowrap">{formatDate(startDate)}</span>
            <div class="flex items-center gap-1">
              <Hourglass class="size-4"/>
              <span>{formatTime(startDate)}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span class="font-medium text-muted-foreground">End</span>
          <div class="grid grid-cols-2 items-center gap-8">
            <span class="whitespace-nowrap">{formatDate(endDate)}</span>
            <div class="flex items-center gap-1">
              <Hourglass class="size-4"/>
              <span>{formatTime(endDate)}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span class="font-medium text-muted-foreground">Duration</span>
          <span>{formatDistanceBetweenDates(startDate, endDate)}</span>
        </div>
      </Card.Content>
    {/if}

  </Card.Root>

  <Card.Root class="w-full">
    <Card.Header>
      <Card.Title>
        Match
      </Card.Title>
      <Card.Description>
        The film everybody agreed to watch.
      </Card.Description>
    </Card.Header>

    <Card.Content class="flex flex-col gap-4">

      <div class="flex gap-2 items-center">
        <h3 class="text-lg font-semibold">{match.title}</h3>
        <span class="text-xl">·</span>
        <span class="text-sm text-muted-foreground">{match.year}</span>
      </div>

      <span class="text-sm italic">{match.overview}</span>

      <Drawer.Root>
        <Drawer.Trigger class={buttonVariants({ variant: "default" })}>
          View Details
        </Drawer.Trigger>
        <Drawer.Content class="md:max-w-lg mx-auto">
          <FilmCard film={match}/>
        </Drawer.Content>
      </Drawer.Root>

    </Card.Content>
  </Card.Root>

</div>
