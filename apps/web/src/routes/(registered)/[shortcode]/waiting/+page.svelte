<script lang="ts">
  import { getLoungeContext, leaveLounge, kickUser, deleteLounge } from '$lib/loungeService.svelte.js'
  import { Button } from '$lib/components/ui/button'
  import * as Item from '$lib/components/ui/item'
  import * as Card from '$lib/components/ui/card'
  import * as Avatar from '$lib/components/ui/avatar'
  import { Share2, Copy, RefreshCw, UserX, LogOut } from '@lucide/svelte'
  import { getUserContext } from '$lib/userService.svelte'
  import AppHeader from '$lib/components/layout/app-header.svelte'
  import { goto } from '\$app/navigation'
  import { toast } from 'svelte-sonner'
  import type { LoungeParticipant } from '@couchrift/shared/schemas/primitives.ts'

  const ls = getLoungeContext()
  const us = getUserContext()

  let participants = $derived(ls.lounge?.participants ?? [])
  let isCreator = $derived(ls.lounge.creatorId === us.user.id)

  $effect(() => {
    const subscriptions: (() => void)[] = []

    subscriptions.push(
      ls.onEvent((event) => {
        if (event.type === 'user_removed') {
          if (event.user.id === us.user.id) {
            toast.warning(`You were removed from lounge #${ls.lounge.shortcode}.`)
            goto('/home')
          } else {
            toast.info(`${event.user.name} was removed from the lounge.`)
          }
        }
      })
    )

    subscriptions.push(
      ls.onEvent((event) => {
        if (event.type === 'user_left' && event.user.id !== us.user.id)
          toast.info(`${event.user.name} left the lounge.`)
      })
    )

    subscriptions.push(
      ls.onEvent((event) => {
        if (event.type === 'user_joined' && event.user.id !== us.user.id)
          toast.info(`${event.user.name} joined the lounge.`)
      })
    )

    subscriptions.push(
      ls.onEvent((event) => {
        if (event.type === 'lounge_deleted' && ls.lounge.creatorId !== us.user.id) {
          toast.warning(`Lounge #${ls.lounge.shortcode} deleted. You were redirected to your home page.`)
          goto('/home')
        }
      })
    )

    return () => subscriptions.forEach((unsub) => unsub())
  })

  async function handleLeaveLounge() {
    const result = await leaveLounge(ls.lounge.id, us.user.id)
    if (result.ok) {
      toast.success(`You left lounge #${ls.lounge.shortcode}.`)
      await goto('/home')
    } else {
      toast.error(result.error)
    }
  }

  async function handleKickUser(participant: LoungeParticipant) {
    const result = await kickUser(ls.lounge.id, participant.id)
    if (result.ok) {
      toast.success(`You removed ${participant.name} from the lounge. Good riddance!`)
    } else {
      toast.error(result.error)
    }
  }

  async function handleDeleteLounge() {
    const result = await deleteLounge(ls.lounge.id)
    if (result.ok) {
      toast.success(`You deleted lounge #${ls.lounge.shortcode}.`)
      await goto('/home')
    } else {
      toast.error(result.error)
    }
  }

</script>

<div class="flex h-full w-full flex-col gap-12">

  <AppHeader user={us.user}/>

  <div class="flex w-full max-w-lg flex-col items-center gap-4">
    <span class="text-muted-foreground">Shortcode</span>
    <Card.Root>
      <Card.Content>
        <div class="flex w-full flex-col items-center gap-4">
          <span class="font-mono text-3xl tracking-widest">{ls.lounge.shortcode}</span>
          <div class="flex gap-2">
            <Button variant="outline" size="icon">
              <RefreshCw/>
            </Button>
            <Button variant="outline" size="icon">
              <Share2/>
            </Button>
            <Button variant="outline" size="icon">
              <Copy/>
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <!--    Participants-->
  <div class="flex w-full max-w-lg flex-1 flex-col items-center gap-4">
    <h3 class="text-muted-foreground">Participants</h3>
    <div class="flex w-full flex-col justify-center gap-6">
      {#each participants as participant (participant.id)}
        {@const isUser = participant.id === us.user.id}
        <Item.Root variant="outline">
          <Item.Media>
            <Avatar.Root class="size-12">
              {#if participant.image}
                <Avatar.Image src={`/uploads/avatars/${participant.image}`}/>
              {/if}
              <Avatar.Fallback>{participant.name[0].toLocaleUpperCase()}</Avatar.Fallback>
            </Avatar.Root>
          </Item.Media>
          <Item.Content>
            {#if isUser}
              <Item.Title class="font-semibold">You</Item.Title>
            {:else}
              <Item.Title class="font-semibold">{participant.name}</Item.Title>
              <Item.Description class="italic">online</Item.Description>
            {/if}
          </Item.Content>
          <Item.Actions>
            {#if isUser && !isCreator}
              <Button size="icon-lg" variant="outline" class="rounded-full" aria-label="Leave"
                      onclick={handleLeaveLounge}>
                <LogOut/>
              </Button>
            {:else if !isUser && isCreator}
              <Button size="icon-lg" variant="outline" class="rounded-full" aria-label="Kick User Out"
                      onclick={() => handleKickUser(participant)}>
                <UserX/>
              </Button>
            {/if}
          </Item.Actions>
        </Item.Root>
      {/each}
    </div>
  </div>

  {#if isCreator}
    <div class="flex items-center justify-center gap-6">
      <Button size="lg">Start</Button>
      <Button size="lg" variant="destructive" onclick={handleDeleteLounge}>Delete</Button>
    </div>
  {/if}
</div>
