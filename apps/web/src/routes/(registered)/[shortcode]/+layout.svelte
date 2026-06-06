<script lang="ts">
  import { untrack } from 'svelte'
  import { LoungeService, setLoungeContext } from '$lib/loungeService.svelte'
  import { goto } from '\$app/navigation'
  import { page } from '$app/state'

  let { children, data } = $props()

  const ls = setLoungeContext(untrack(() => new LoungeService(data.lounge)))
  const loungeWaiting = $derived(ls.lounge.startedAt === null)
  const pageWaiting = $derived(page.url.pathname.startsWith(`/${ls.lounge.shortcode}/waiting`))

  // Clean up web socket connections on navigating away
  $effect(() => {
    return () => ls.destroy()
  })

  // Redirect users when they attempt to access a lounge whose state doesn't match the URL
  $effect(() => {
    if (loungeWaiting && !pageWaiting) {
      goto(`/${ls.lounge.shortcode}/waiting`, { replaceState: true })
    } else if (!loungeWaiting && pageWaiting) {
      goto(`/${ls.lounge.shortcode}`, { replaceState: true })
    }
  })
</script>

<!-- Render elements only when the URL matches the lounge's state -->
{#if (loungeWaiting && pageWaiting)}
  {@render children()}
{:else if (!loungeWaiting && !pageWaiting)}
  {@render children()}
{/if}

