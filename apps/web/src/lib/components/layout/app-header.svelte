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

<header class="flex w-full flex-row justify-between px-4 pt-2">
  <h1 class="text-2xl font-bebas text-red-400/80">
    Couch<span class="text-yellow-500 font-bold">|</span>Rift
  </h1>

  <Button variant="ghost" class="rounded-full" size="icon" href="/me">
    <Avatar.Root class="size-10">
      {#if user.image}
        <Avatar.Image src={`/uploads/avatars/${user.image}`} alt="User Avatar"/>
      {/if}
      <Avatar.Fallback>
        {user.name[0].toLocaleUpperCase()}
      </Avatar.Fallback>
    </Avatar.Root>
  </Button>
</header>