<script lang="ts">
  import { getLoungeContext, deleteLounge } from '$lib/loungeService.svelte.js'
  import { getUserContext } from '$lib/userService.svelte.js'
  import { getGenreContext } from '$lib/genreService.svelte.js'
  import { Badge } from '$lib/components/ui/badge'
  import { buttonVariants } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card'
  import * as AlertDialog from '$lib/components/ui/alert-dialog'
  import SubpageHeader from '$lib/components/layout/subpage-header/subpage-header.svelte'
  import { toast } from 'svelte-sonner'
  import { goto } from '$app/navigation'

  const ls = getLoungeContext()
  const us = getUserContext()
  const gs = getGenreContext()

  let excludedGenres = $derived(ls.lounge.settings.excludedGenres.map(String))
  let settings = $derived(ls.lounge.settings)

  // Calculate current year dynamically for open-ended limits
  const currentYear = new Date().getFullYear()

  async function handleDelete() {
    const result = await deleteLounge(ls.lounge.id)
    if (result.ok) {
      toast.success(`You deleted lounge #${ls.lounge.shortcode}.`)
      await goto('/home')
    } else {
      toast.error(result.error)
    }
  }

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
        <div class="flex flex-wrap gap-2 justify-end">
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

  {#if us.user.id === ls.lounge.creatorId }
    <Card.Root class="w-full overflow-hidden">
      <Card.Header>
        <Card.Title>Deletion</Card.Title>
        <Card.Description>Close and delete the lounge along with swipes and matches.</Card.Description>
      </Card.Header>
      <Card.Footer class="flex-col gap-2 items-start">
        <AlertDialog.Root>
          <AlertDialog.Trigger class={buttonVariants({ variant: "destructive" })}>
            Delete Lounge
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>Delete Confirmation</AlertDialog.Title>
              <AlertDialog.Description>
                You are about to delete the lounge, its swipes and other users activity. <br/>
                This action cannot be undone.
              </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Cancel>Keep the lounge</AlertDialog.Cancel>
              <AlertDialog.Action variant="destructive" onclick={handleDelete}>Delete the lounge</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </Card.Footer>
    </Card.Root>
  {/if}
</div>

