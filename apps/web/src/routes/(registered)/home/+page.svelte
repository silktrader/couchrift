<script lang="ts">
  import type { PageProps } from './$types'
  import { Button } from '$lib/components/ui/button'
  import { Separator } from '$lib/components/ui/separator'
  import * as Avatar from '$lib/components/ui/avatar'
  import * as Item from '$lib/components/ui/item'
  import * as InputOTP from '$lib/components/ui/input-otp'
  import { FieldSeparator } from '$lib/components/ui/field'
  import { ThumbsUp, ThumbsDown, Bookmark, UserRound, LogOut } from '@lucide/svelte'
  import { goto } from '\$app/navigation'
  import { getUserContext } from '$lib/userService.svelte.js'
  import { createLounge, leaveLounge, joinLounge } from '$lib/loungeService.svelte.js'
  import { flip } from 'svelte/animate'
  import { formatRelativeTime } from '$lib/dates'
  import { untrack } from 'svelte'
  import { ID_LENGTH } from '@couchrift/shared/config/ids'
  import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'bits-ui'

  let { data }: PageProps = $props()

  const us = getUserContext()
  let activeLounges = $state(untrack(() => data.lounges))
  let shortcode = $state('')

  async function handleCreateLounge() {
    const result = await createLounge({ maxDuration: 300 })
    if (result.ok) {
      await goto(`${result.shortcode}/waiting`)
    } else {
      console.error(result.error)
    }
  }

  async function handleLeaveLounge(loungeId: string) {
    const result = await leaveLounge(loungeId)
    switch (result.type) {
      case 'success':
        activeLounges = activeLounges.filter(lounge => lounge.id !== loungeId)
        if (result.data.deletedLounge) alert('You were the last participant: lounge deleted.')
        break
      default:
        // tk Improve error handling and display
        alert('Failed to leave lounge.')
    }
  }

  async function handleJoinLounge() {
    const result = await joinLounge(shortcode)
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

  <div class="flex flex-col items-center gap-4">
    <span>Enter a lounge's code:</span>
    <InputOTP.Root
        maxlength={ID_LENGTH.shortcode}
        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
        bind:value={shortcode}
        onComplete={handleJoinLounge}
    >
      {#snippet children({cells})}
        <InputOTP.Group class="m-auto">
          {#each cells as cell (cell)}
            <InputOTP.Slot {cell}/>
          {/each}
        </InputOTP.Group>
      {/snippet}
    </InputOTP.Root>
  </div>

  <FieldSeparator>or</FieldSeparator>
  <Button variant="secondary" onclick={async () => await handleCreateLounge()}>Create Lounge</Button>
</section>

<!-- Active Lounges -->
<section class="flex flex-col flex-1 gap-2 items-center">
  <h4 class="text-muted-foreground">Active Lounges</h4>
  <div class="flex flex-1 overflow-y-auto min-h-0 w-full flex-col items-center gap-2 p-4 pb-8">
    {#each activeLounges as lounge (lounge.id)}

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
            <Item.Description class="text-sm italic">{formatRelativeTime(lounge.createdAt)}</Item.Description>
          </Item.Content>
          <Item.Actions>
            <Button size="icon" variant="outline"
                    onclick={async (e) => {
						          e.stopPropagation()
                      e.preventDefault()
						          await handleLeaveLounge(lounge.id)}
						        }>
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
