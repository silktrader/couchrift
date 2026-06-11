<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import * as AlertDialog from '$lib/components/ui/alert-dialog'
  import { buttonVariants } from '$lib/components/ui/button'
  import { deleteLounge } from '$lib/loungeService.svelte'
  import { toast } from 'svelte-sonner'
  import { goto } from '$app/navigation'

  let { loungeId }: { loungeId: string } = $props()

  async function handleDelete() {
    const result = await deleteLounge(loungeId)
    if (result.ok) {
      toast.success(`Lounge deleted.`)
      await goto('/home')
    } else {
      toast.error(result.error)
    }
  }

</script>
<Card.Root class="w-full border-destructive/50 bg-destructive/5">
  <Card.Header>
    <Card.Title class="text-destructive">Deletion</Card.Title>
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