<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import type { LoungeSettings } from '@couchrift/shared/schemas/lounge.ts'
  import { getGenreContext } from '$lib/genreService.svelte'

  let { settings }: { settings: LoungeSettings } = $props()

  const gs = getGenreContext()

  // Calculate current year dynamically for open-ended limits
  const currentYear = new Date().getFullYear()

  let excludedGenres = $derived(settings.excludedGenres?.map(String) ?? [])

</script>

<Card.Root class="w-full overflow-hidden">
  <Card.Header>
    <Card.Title>
      Film Filters
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
          <span>and</span>
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
          <span>Between</span>
          <Badge variant="secondary" class="font-mono text-md tabular-nums">{settings.minRuntime}</Badge>
          <span class="text-muted-foreground">and</span>
          <Badge variant="secondary" class="font-mono text-md tabular-nums">{settings.maxRuntime}</Badge>
          <span>minutes</span>
        {/if}
      </div>
    </div>

    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <span class="font-medium text-muted-foreground shrink-0">Excluded Genres</span>
      <div class="flex gap-2 md:flex-wrap md:justify-end">
        {#if excludedGenres.length > 0}
          {#each excludedGenres as genreId}
            <Badge variant="secondary" class="px-2 py-3 text-md capitalize line-through">
              {gs.getName(genreId)}
            </Badge>
          {/each}
        {:else}
          <span>None</span>
        {/if}
      </div>
    </div>
  </Card.Content>
</Card.Root>