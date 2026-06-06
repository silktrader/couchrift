<script lang="ts">
  import { ArrowLeft } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { browser } from '$app/environment'

  function goBack() {
    if (browser) window.history.back()
  }

  let { title = '', backAction = goBack }: { title?: string, backAction?: () => void } = $props()
</script>

<header class="flex w-full h-12 mb-6 gap-16 items-center">
  <Button size="icon-lg" variant="ghost" onclick={backAction}>
    <ArrowLeft class="size-8"/>
  </Button>
  <span class="text-3xl font-bebas">{title}</span>
</header>