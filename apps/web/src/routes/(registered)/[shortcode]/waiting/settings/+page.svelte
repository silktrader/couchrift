<script lang="ts">
  import { getLoungeContext, updateSettings } from '$lib/loungeService.svelte.js'
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import { Slider } from '$lib/components/ui/slider'
  import * as ToggleGroup from '$lib/components/ui/toggle-group'
  import SubpageHeader from '$lib/components/layout/subpage-header/subpage-header.svelte'
  import type { PageProps } from './$types'
  import { filmConfig } from '@couchrift/shared/config/film.ts'
  import { toast } from 'svelte-sonner'
  import { goto } from '\$app/navigation'

  const ls = getLoungeContext()

  let { data }: PageProps = $props()

  let excludedGenres: string[] = $state(ls.lounge.settings.excludedGenres.map(String))

  const minReleaseYear = filmConfig.year.min
  const maxReleaseYear = new Date().getFullYear()
  let releaseYear = $state([ls.lounge.settings.minReleaseYear, ls.lounge.settings.maxReleaseYear])

  const minRuntime = filmConfig.runtime.min
  const maxRuntime = filmConfig.runtime.max
  let runtime = $state([ls.lounge.settings.minRuntime, ls.lounge.settings.maxRuntime])

  function resetGenres() {
    excludedGenres = []
  }

  async function saveAndExit() {

    // Gather new settings
    const newSettings = {
      minRuntime:     runtime[0],
      maxRuntime:     runtime[1],
      minReleaseYear: releaseYear[0],
      maxReleaseYear: releaseYear[1],
      excludedGenres: excludedGenres.map(Number)
    }

    const result = await updateSettings(ls.lounge.id, newSettings)
    if (result.ok) {
      toast.success('Settings updated.')
      await goto(`/${ls.lounge.shortcode}/waiting`)
    } else {
      toast.error(result.error)
    }
  }

</script>

<div class="flex flex-1 flex-col items-center mb-12 p-4 gap-8">

  <SubpageHeader title="Settings" backAction={async () => await saveAndExit()}/>

  <section class="flex flex-col w-full gap-8 p-4">
    <div class="flex gap-4 text-muted-foreground items-center">
      <h3 class="[font-variant:small-caps] font-semibold">Release Year</h3>
      <Badge class="p-2 text-sm">{releaseYear[0]} - {releaseYear[1]}</Badge>
    </div>
    <div class="w-full">
      <Slider type="multiple"
              bind:value={releaseYear}
              min={minReleaseYear}
              max={maxReleaseYear}
              step={1}
      />
    </div>
  </section>

  <section class="flex flex-col w-full gap-8 p-4">
    <div class="flex gap-4 text-muted-foreground items-center">
      <h3 class="[font-variant:small-caps] font-semibold">Runtime</h3>
      <Badge class="p-2 text-sm">{runtime[0]} - {runtime[1] === 180 ? '180+' : runtime[1]} min.</Badge>
    </div>
    <div class="w-full">
      <Slider type="multiple"
              bind:value={runtime}
              min={minRuntime}
              max={maxRuntime}
              step={1}
      />
    </div>
  </section>

  <section class="flex flex-col w-full gap-8 p-4">
    <div class="flex gap-4 text-muted-foreground items-center justify-between">
      <div class="flex gap-4 items-center">
        <h3 class="[font-variant:small-caps] font-semibold">Excluded Genres</h3>
        <Badge class="p-2 text-sm">{excludedGenres.length} excluded</Badge>
      </div>
      <Button variant="ghost" size="sm" onclick={resetGenres}>Reset</Button>
    </div>
    <ToggleGroup.Root type="multiple"
                      variant="outline"
                      spacing={2}
                      size="lg"
                      class="flex-wrap"
                      bind:value={excludedGenres}>

      {#each data.genres as genre}
        <ToggleGroup.Item
            value={genre.id.toString()}
            aria-label={genre.name}
            class="data-[state=on]:line-through data-[state=on]:decoration-2"
        >
          {genre.name}
        </ToggleGroup.Item>
      {/each}

    </ToggleGroup.Root>

  </section>

</div>