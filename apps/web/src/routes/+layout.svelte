<script lang="ts">
  import './layout.css'
  import { Toaster } from '$lib/components/ui/sonner/index.js'

  let { children } = $props()
</script>

<Toaster position="top-center" richColors/>

<div class="min-h-svh w-full md:flex md:justify-center md:pt-[15vh] md:pb-[15vh]">
  <main
      class="
        flex
        flex-col
        w-full
        min-h-svh
        md:outline-1
        md:max-w-lg
        md:min-h-[60vh]
        md:rounded-3xl
        md:border-2
      md:border-neutral-900
      gap-6
      overflow-hidden
    "
  >
    {@render children()}
  </main>
</div>