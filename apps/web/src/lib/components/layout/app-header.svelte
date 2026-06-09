<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import * as Avatar from '$lib/components/ui/avatar'

  let { user } = $props<{
    user: {
      name: string
      image?: string | null | undefined
    }
  }>()
</script>

<header class="flex w-full flex-row justify-between items-center px-8 py-4">
  <img src="/full_logo.png" alt="logo" class="w-1/3 max-w-40 h-auto"/>

  <Button variant="ghost" class="rounded-full outline-1" size="icon" href="/me">
    <Avatar.Root class="size-14">
      {#if user.image}
        <Avatar.Image src={`/uploads/avatars/${user.image}`} class="ring-2 ring-foreground" alt="User Avatar"/>
      {/if}
      <Avatar.Fallback>
        {user.name[0].toLocaleUpperCase()}
      </Avatar.Fallback>
    </Avatar.Root>
  </Button>
</header>