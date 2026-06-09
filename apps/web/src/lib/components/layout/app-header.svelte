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

  <a href="/home" class="w-1/3">
    <img src="/full_logo.png" alt="logo" class="w-full max-w-40 h-auto"/>
  </a>

  <Button variant="ghost" class="rounded-full" size="icon" href="/me">
    <Avatar.Root class="size-12">
      {#if user.image}
        <Avatar.Image src={`/uploads/avatars/${user.image}`} class="ring-2" alt="User Avatar"/>
      {/if}
      <Avatar.Fallback>
        {user.name[0].toLocaleUpperCase()}
      </Avatar.Fallback>
    </Avatar.Root>
  </Button>
</header>