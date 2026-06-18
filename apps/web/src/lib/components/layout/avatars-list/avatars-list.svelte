<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar'

  let { users }: {
    users: {
      id: string
      image?: string | null
      name: string
      liked?: number
      disliked?: number
    } []
  } = $props()
</script>

<div class="flex -space-x-2 items-center">
  {#each users as user (user.id)}
    <Avatar.Root class="size-12 ring-1">
      {#if user.image}
        <Avatar.Image src={`/avatars/${user.image}`} alt="User Avatar"/>
      {/if}
      <Avatar.Fallback>{user.name[0].toLocaleUpperCase()}.</Avatar.Fallback>
    </Avatar.Root>
  {/each}
</div>