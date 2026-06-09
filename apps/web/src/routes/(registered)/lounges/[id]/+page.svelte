<script lang="ts">
  import type { PageProps } from './$types'
  import { Button } from '$lib/components/ui/button'
  import { formatRelativeTime } from '$lib/dates'
  import { Calendar, ArrowLeft } from '@lucide/svelte'
  import * as Avatar from '$lib/components/ui/avatar'
  import { browser } from '$app/environment'

  let { data }: PageProps = $props()

  // Under the current model only one match is allowed per lounge
  const lounge = $derived(data.lounge)
  const match = $derived(lounge.matches[0])

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

  <div class="flex justify-center -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background items-center">

    {#each lounge.participants as participant (participant.id)}
      <Avatar.Root class={['size-12', participant.id === lounge.creatorId && 'border-white border-2']}>
        {#if participant.image}
          <Avatar.Image src={`/uploads/avatars/${participant.image}`} alt="User Avatar"/>
        {/if}
        <Avatar.Fallback>{participant.name[0].toLocaleUpperCase()}.</Avatar.Fallback>
      </Avatar.Root>
    {/each}

  </div>
  <span class="text-muted-foreground">... all democratically elected to watch:</span>

  <div class="relative">
    <img src={`https://image.tmdb.org/t/p/w500/${match.poster}`}
         alt={`${match.title} Poster`}
         class="rounded-3xl border object-contain z-10"/>
    <img src="/matched_stamp.webp" alt="Matched" class="absolute top-10 left-10 h-1/5 object-contain z-20"/>
  </div>

</div>
