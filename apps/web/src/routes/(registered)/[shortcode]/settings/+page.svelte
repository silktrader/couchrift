<script lang="ts">
  import { getLoungeContext, updateSettings } from '$lib/loungeService.svelte.js'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card/'
  import SubpageHeader from '$lib/components/layout/subpage-header/subpage-header.svelte'
  import { getUserContext } from '$lib/userService.svelte.js'

  const ls = getLoungeContext()
  const us = getUserContext()

  let excludedGenres = $derived(ls.lounge.settings.excludedGenres.map(String))
  let settings = $derived(ls.lounge.settings)

  // Calculate current year dynamically for open-ended limits
  const currentYear = new Date().getFullYear()

</script>

<div class="mx-auto mb-12 flex w-full max-w-xl flex-col items-center gap-6 p-4">
  <SubpageHeader title="Lounge Settings"/>

  <Card.Root class="w-full">
    <Card.Header>
      <Card.Title>
        Shortcode
      </Card.Title>
      <Card.Description>
        A temporary unique identifier for easy joining.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <Badge variant="secondary" class="font-mono text-md tabular-nums">{ls.lounge.shortcode}</Badge>
    </Card.Content>
  </Card.Root>

  <Card.Root class="w-full overflow-hidden">
    <Card.Header>
      <Card.Title>
        Active Filters
      </Card.Title>
      <Card.Description>
        Rules that apply to all films presented in this lounge.
      </Card.Description>
    </Card.Header>

    <Card.Content class="flex flex-col gap-8">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span class="font-medium text-muted-foreground">Release Window</span>
        <div class="flex items-center gap-2">
          {#if settings.maxReleaseYear >= currentYear}
            <span>From</span>
            <Badge variant="secondary" class="font-mono text-md tabular-nums">{settings.minReleaseYear}</Badge>
            <span>to present</span>
          {:else}
            <span>Between</span>
            <Badge variant="secondary" class="font-mono text-md tabular-nums">{settings.minReleaseYear}</Badge>
            <span>&</span>
            <Badge variant="secondary" class="font-mono text-md tabular-nums">{settings.maxReleaseYear}</Badge>
          {/if}
        </div>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span class="font-medium text-muted-foreground">Film Duration</span>
        <div class="flex items-center gap-2">
          {#if settings.maxRuntime >= 180}
            <span>At least</span>
            <Badge variant="secondary" class="font-mono text-md tabular-nums">{settings.minRuntime}</Badge>
            <span>minutes</span>
          {:else}
            <Badge variant="secondary" class="font-mono text-md tabular-nums">{settings.minRuntime}</Badge>
            <span class="text-muted-foreground">–</span>
            <Badge variant="secondary" class="font-mono text-md tabular-nums">{settings.maxRuntime}</Badge>
            <span>minutes</span>
          {/if}
        </div>
      </div>

      {#if excludedGenres.length === 0}
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span class="font-medium text-muted-foreground">Excluded Genres</span>
          <span>None</span>
        </div>
      {:else}

        <div class="flex flex-col gap-2">
          <span class="font-medium text-muted-foreground">Excluded Genres</span>
          <div class="flex flex-wrap gap-1.5">
            {#each excludedGenres as genre}
              <Badge variant="destructive" class="px-2 py-0.5 text-xs font-normal capitalize tracking-wide">
                {genre}
              </Badge>
            {/each}
          </div>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  {#if us.user.id === ls.lounge.creatorId }
    <Card.Root class="w-full overflow-hidden">
      <Card.Header>
        <Card.Title>Deletion</Card.Title>
        <Card.Description>Close and delete the lounge along with swipes and matches.</Card.Description>
      </Card.Header>
      <Card.Footer class="flex-col gap-2">
        <Button class="w-full" variant="destructive">Remove Lounge</Button>
      </Card.Footer>
    </Card.Root>
  {/if}
</div>