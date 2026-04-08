<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Separator } from '$lib/components/ui/separator'
  import * as Avatar from '$lib/components/ui/avatar'
  import { FieldSeparator } from '$lib/components/ui/field/index.js'
  import { ThumbsUp, ThumbsDown, Bookmark, UserRound } from '@lucide/svelte'
  import { goto } from '\$app/navigation'
  import { getUserContext } from '$lib/userService.svelte'
  import { createLounge } from '$lib/loungeService.svelte'

  const us = getUserContext()

  async function handleCreateLounge() {
    const result = await createLounge({ maxDuration: 300 })
    if (result.ok) {
      await goto(`/lounges/${result.shortcode}`)
    } else {
      console.error(result.error)
    }
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
    <span>No active lounges</span>
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
