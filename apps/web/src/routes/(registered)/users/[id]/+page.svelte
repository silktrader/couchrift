<script lang="ts">
  import {Button} from '$lib/components/ui/button'
  import * as Avatar from '$lib/components/ui/avatar'
  import * as Card from '$lib/components/ui/card'
  import * as Item from "$lib/components/ui/item"
  import SubpageHeader from '$lib/components/layout/subpage-header/subpage-header.svelte'
  import {ContactRound} from "@lucide/svelte"
  import {getUserContext} from "$lib/userService.svelte";

  let {data, params} = $props()
  const us = getUserContext()
  let user = $derived(data.details)

  let avatarUrl = $derived(user.image ? `/avatars/${user.image}` : null)

  async function requestFriendship() {
    if (params.id === us.user.id) return

    const result = await us.requestFriendship(params.id)
    if (result.ok) {
      alert("Successfully requested friendship")
      return
    }

    alert("Failed to request friendship: " + result.error)

  }

</script>

<div class="flex flex-col gap-8 m-4 flex-1">
    <SubpageHeader/>

    <section class="flex flex-col items-center m-8 gap-6">

        <div class="relative inline-block">
            <Avatar.Root class="size-30 ring-2 ring-foreground">
                <Avatar.Image src={avatarUrl} alt="User avatar"/>
                <Avatar.Fallback class="text-2xl font-bold">{user.name[0]}.</Avatar.Fallback>
            </Avatar.Root>
        </div>

        <div class="flex flex-col items-center gap-2">
            <h2 class="text-lg font-semibold">{user.name}</h2>
        </div>
    </section>


    <section class="flex flex-1 flex-col gap-4 items-center">
        {#if user.relationship === 'friend_request'}
            <Item.Root variant="muted" class="w-max">
                <Item.Media>
                    <ContactRound class="size-5"/>
                </Item.Media>
                <Item.Content>
                    <Item.Title>Friend Request Sent</Item.Title>
                </Item.Content>
            </Item.Root>
        {:else}
            <Button variant="default" class="w-1/2" size="lg" onclick={requestFriendship}>Add as Friend</Button>
        {/if}
    </section>

    <section class="flex flex-row gap-4 justify-center text-muted-foreground">

    </section>
</div>