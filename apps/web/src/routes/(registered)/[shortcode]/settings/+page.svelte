<script lang="ts">
  import { getLoungeContext, deleteLounge } from '$lib/loungeService.svelte.js'
  import { getUserContext } from '$lib/userService.svelte.js'
  import { getGenreContext } from '$lib/genreService.svelte.js'
  import { Badge } from '$lib/components/ui/badge'
  import { buttonVariants } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card'
  import * as AlertDialog from '$lib/components/ui/alert-dialog'
  import SubpageHeader from '$lib/components/layout/subpage-header/subpage-header.svelte'
  import LoungeFilters from '$lib/components/settings/lounge-filters/lounge-filters.svelte'
  import { toast } from 'svelte-sonner'
  import { goto } from '$app/navigation'

  const ls = getLoungeContext()
  const us = getUserContext()

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

  <LoungeFilters settings={ls.lounge.settings}/>

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

