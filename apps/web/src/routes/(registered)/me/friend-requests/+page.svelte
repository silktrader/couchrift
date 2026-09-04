<script lang="ts">
  import SubpageHeader from "$lib/components/layout/subpage-header/subpage-header.svelte"
  import * as Alert from "$lib/components/ui/alert";
  import Info from '@lucide/svelte/icons/info'
  import ThumbsUp from '@lucide/svelte/icons/thumbs-up'
  import ThumbsDown from '@lucide/svelte/icons/thumbs-down'
  import {getUserContext} from "$lib/userService.svelte"
  import {Button} from "$lib/components/ui/button"
  import * as Item from "$lib/components/ui/item"
  import * as Avatar from "$lib/components/ui/avatar"
  import {toast} from "svelte-sonner";
  import {formatRelativeTime} from "$lib/dates";

  const us = getUserContext()

  async function declineRequest(requestId: string, requesterName: string) {
    const result = await us.declineFriendRequest(requestId)
    if (result.ok) {
      toast.success(`${requesterName}'s request was declined.`)
    } else {
      toast.error(`Could not decline ${requesterName}'s request: ${result.error}`)
    }
  }
</script>

<div class="flex flex-col m-4 flex-1">
    <SubpageHeader title="Friend Requests"/>

    <Alert.Root class="mb-8">
        <Info/>
        <Alert.Title>Your friends can ...</Alert.Title>
        <Alert.Description>
            <ul class="list-disc text-sm list-inside">
                <li>join your lounges without entering shortcodes</li>
                <li>view your bookmarks</li>
                <li>view your friends</li>
            </ul>
        </Alert.Description>
    </Alert.Root>

    {#if us.friendRequests.length < 1}
        <p class="text-muted-foreground w-full text-center">
            No friend requests received.
        </p>
    {:else}

        {#each us.friendRequests as request }

            <Item.Root variant="outline">
                <Item.Media>
                    <a href={`/users/${request.sender.id}`}>
                        <Avatar.Root class="size-12 ring-1">
                            {#if request.sender.image}
                                <Avatar.Image src={`/avatars/${request.sender.image}`} alt="User Avatar"/>
                            {/if}
                            <Avatar.Fallback>{request.sender.name[0].toLocaleUpperCase()}.</Avatar.Fallback>
                        </Avatar.Root>
                    </a>
                </Item.Media>
                <Item.Content>
                    <Item.Title>{request.sender.name}</Item.Title>
                    <Item.Description class="text-sm">{formatRelativeTime(request.createdAt)}</Item.Description>
                </Item.Content>
                <Item.Actions>
                    <Button variant="default" size="icon">
                        <ThumbsUp/>
                    </Button>
                    <Button variant="destructive" size="icon"
                            onclick={() => declineRequest(request.id, request.sender.name)}>
                        <ThumbsDown/>
                    </Button>
                </Item.Actions>
            </Item.Root>

        {/each}

    {/if}
</div>