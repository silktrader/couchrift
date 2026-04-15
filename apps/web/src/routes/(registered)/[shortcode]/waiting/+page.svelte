<script lang="ts">
  import { getLoungeContext } from '$lib/loungeService.svelte.js'
  import { Button } from '$lib/components/ui/button'
  import * as Item from '$lib/components/ui/item'
  import * as Card from '$lib/components/ui/card'
  import * as Avatar from '$lib/components/ui/avatar'
  import { Share2, Copy, RefreshCw, UserX } from '@lucide/svelte'
  import { page } from '$app/state'
  import { getUserContext } from '$lib/userService.svelte'
  import AppHeader from '$lib/components/layout/app-header.svelte'

  const ls = getLoungeContext()
  const us = getUserContext()

  let shortcode = $derived(page.params.shortcode)
  let participants = $derived(ls.lounge?.participants ?? [])
  let user = $derived(us.user!)

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
            {#if participant.id === user.id}
              <Item.Title class="font-semibold">You</Item.Title>
            {:else}
              <Item.Title class="font-semibold">{participant.name}</Item.Title>
              <Item.Description class="italic">online</Item.Description>
            {/if}
          </Item.Content>
          <Item.Actions>
            <Button size="icon-lg" variant="outline" class="rounded-full" aria-label="Kick Out">
              <UserX/>
            </Button>
          </Item.Actions>
        </Item.Root>
      {/each}
    </div>
  </div>

  {#if ls.lounge.creatorId === user.id}
    <div class="flex items-center justify-center gap-6">
      <!--         <Button size="lg" onclick={() => ls.startLounge()}>Start</Button> -->
      <Button size="lg" variant="destructive">Delete</Button>
    </div>
  {/if}
</div>
