<script lang="ts">
  import type { PageProps } from './$types'
  import { Button } from '$lib/components/ui/button'
  import { Separator } from '$lib/components/ui/separator'
  import * as Avatar from '$lib/components/ui/avatar'
  import * as Item from '$lib/components/ui/item'
  import { FieldSeparator } from '$lib/components/ui/field/index.js'
  import { ThumbsUp, ThumbsDown, Bookmark, UserRound, LogOut } from '@lucide/svelte'
  import { goto } from '\$app/navigation'
  import { getUserContext } from '$lib/userService.svelte'
  import { createLounge } from '$lib/loungeService.svelte'
  import { flip } from 'svelte/animate'

  let { data }: PageProps = $props()

  const us = getUserContext()
  const userLounges = $derived(data.lounges)

  async function handleCreateLounge() {
    const result = await createLounge({ maxDuration: 300 })
    if (result.ok) {
      await goto(`${result.shortcode}/waiting`)
    } else {
      console.error(result.error)
    }
  }

  async function handleLeaveLounge(loungeId: string) {

  }

</script>

<header class="flex w-full flex-row justify-between px-4 pt-2">
  <h1 class="text-2xl font-bebas text-red-400/80">Couch<span class="text-yellow-500 font-bold">|</span>Rift</h1>
  <Button variant="ghost" class="rounded-full" size="icon" href="/me">
    <Avatar.Root class="size-10">
      <Avatar.Image src={`/uploads/avatars/${us.user.image}`} alt="User Avatar"/>
      <Avatar.Fallback>{us.user?.name[0]}</Avatar.Fallback>
    </Avatar.Root>
  </Button>
</header>

<!-- Main Actions -->
<section class="flex w-1/2 flex-col justify-center self-center gap-6 my-16 shrink-0">
  <Button href="/lounges">Enter Lounge</Button>
  <FieldSeparator>or</FieldSeparator>
  <Button variant="secondary" onclick={async () => await handleCreateLounge()}>Create Lounge</Button>
</section>

<!-- Active Lounges -->
<section class="flex flex-col flex-1 gap-2 items-center">
  <h4 class="text-muted-foreground">Active Lounges</h4>
  <div class="flex flex-1 overflow-y-auto min-h-0 w-full flex-col items-center gap-2 p-4 pb-8">
    {#each data.lounges as lounge (lounge.id)}

      <div class="w-full" animate:flip>
        <Item.Root variant="outline" class="w-full" onclick={() => goto(`/${lounge.shortcode}`)}>
          <Item.Media>
            <div class="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background items-center">

              {#each lounge.participants as participant (participant.id)}
                <Avatar.Root class={participant.id === lounge.creatorId ? 'size-12' : 'size-10'}>
                  <Avatar.Image src={`/uploads/avatars/${participant.image}`} alt="User Avatar"/>
                  <Avatar.Fallback>{participant.name[0]}.</Avatar.Fallback>
                </Avatar.Root>
              {/each}
            </div>
          </Item.Media>
          <Item.Content class="flex items-end mr-4">
            <Item.Title class="text-md font-mono font-semibold tracking-wider">{lounge.shortcode}</Item.Title>
            <Item.Description class="text-sm italic">2 min. ago</Item.Description>
          </Item.Content>
          <Item.Actions>
            <Button size="icon" variant="outline" onclick={async () => await handleLeaveLounge(lounge.id)}>
              <LogOut/>
            </Button>
          </Item.Actions>
        </Item.Root>
      </div>
    {:else}
      <span>No active lounges</span>
    {/each}
  </div>

</section>

<!-- Main Navigator -->
<footer class="flex w-full flex-col items-center justify-end gap-6 p-4 pb-8 shrink-0">
  <div class="flex w-full justify-between gap-6">
    <div class="flex w-12 flex-col items-center gap-1">
      <Button variant="outline" size="icon-lg">
        <ThumbsUp/>
      </Button>
      <span class="text-sm text-muted-foreground">Likes</span>
    </div>

    <div class="flex w-12 flex-col items-center gap-1">
      <Button variant="outline" size="icon-lg">
        <ThumbsDown/>
      </Button>
      <span class="text-sm text-muted-foreground">Dislikes</span>
    </div>

    <div class="flex w-12 flex-col items-center gap-1">
      <Button variant="outline" size="icon-lg">
        <Bookmark/>
      </Button>
      <span class="text-sm text-muted-foreground">Bookmarks</span>
    </div>

    <div class="flex w-12 flex-col items-center gap-1">
      <Button variant="outline" size="icon-lg">
        <UserRound/>
      </Button>
      <span class="text-sm text-muted-foreground">Friends</span>
    </div>
  </div>
</footer>
