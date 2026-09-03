<script>
    import SubpageHeader from "$lib/components/layout/subpage-header/subpage-header.svelte"
    import * as Alert from "$lib/components/ui/alert";
    import Info from '@lucide/svelte/icons/info'
    import ThumbsUp from '@lucide/svelte/icons/thumbs-up'
    import ThumbsDown from '@lucide/svelte/icons/thumbs-down'
    import {getUserContext} from "$lib/userService.svelte"
    import {Button} from "$lib/components/ui/button"
    import * as Item from "$lib/components/ui/item"
    import * as Avatar from "$lib/components/ui/avatar"
    import {formatRelativeTime} from "$lib/dates";

    const us = getUserContext()
</script>

<div class="flex flex-col gap-4 m-4 flex-1">
    <SubpageHeader title="Friend Requests"/>
    <Alert.Root>
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
        No friend requests received.
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
                    <Button variant="destructive" size="icon">
                        <ThumbsDown/>
                    </Button>
                </Item.Actions>
            </Item.Root>

        {/each}

    {/if}
</div>