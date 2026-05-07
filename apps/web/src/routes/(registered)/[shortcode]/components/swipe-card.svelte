<script lang="ts">
  import * as languages from '$lib/languages'
  import { formatDuration } from '$lib/dates'
  import { Calendar, Timer, Heart, X } from '@lucide/svelte/icons'

  let {
        film,
        depth,
        zIndex,
        onSwipe,
        onExit
      }: {
    film: any
    depth: number,
    zIndex: number,
    onSwipe?: (dir: 'left' | 'right', film: any) => Promise<boolean>
    onExit?: (film: any) => void
  } = $props()

  let x = $state(0)
  let y = $state(0)

  let dragging = $state(false)

  const isFront = $derived(depth === 0)

  let startX = 0
  let startY = 0
  let lastX = 0
  let velocityX = 0

  let frame: number | null = null

  const SWIPE_THRESHOLD = 150

  const rotate = $derived(x * 0.05)
  const scale = $derived(1 - depth * 0.1)
  const likeOpacity = $derived(x > 0 ? Math.min(x / 100, 1) : 0)
  const nopeOpacity = $derived(x < 0 ? Math.min(-x / 100, 1) : 0)
  //const footerOpacity = $derived(Math.max(0, 1 - Math.abs(x) / 120))

  function onPointerDown(e: PointerEvent) {
    if (!isFront) return

    dragging = true
    startX = e.clientX
    startY = e.clientY
    lastX = 0
    velocityX = 0
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return

    const newX = e.clientX - startX
    velocityX = newX - lastX
    lastX = newX

    x = newX
    y = (e.clientY - startY) * 0.2
  }

  function onPointerUp() {
    if (!dragging) return
    dragging = false

    const absX = Math.abs(x)

    if (absX > SWIPE_THRESHOLD || Math.abs(velocityX) > 15) {
      swipe(x > 0 ? 'right' : 'left')
    } else {
      springBack()
    }
  }

  // Animations

  async function swipe(dir: 'left' | 'right') {
    const target = dir === 'right' ? 500 : -500

    const swiped = await onSwipe?.(dir, film)

    animateTo(target, y + velocityX * 2, 0.2, () => {
      onExit?.(film)
      // Reset coordinates
      if (!swiped) {
        x = 0
        y = 0
      }
    })
  }

  function springBack() {
    springTo(0, 0)
  }

  function animateTo(tx: number, ty: number, duration: number, done?: () => void) {
    const start = performance.now()
    const sx = x
    const sy = y

    cancel()

    function loop(now: number) {
      const t = Math.min((now - start) / (duration * 1000), 1)
      const ease = 1 - Math.pow(1 - t, 3)

      x = sx + (tx - sx) * ease
      y = sy + (ty - sy) * ease

      if (t < 1) frame = requestAnimationFrame(loop)
      else done?.()
    }

    frame = requestAnimationFrame(loop)
  }

  function springTo(tx: number, ty: number) {
    cancel()

    let vx = velocityX
    let vy = 0

    function loop() {
      const dx = tx - x
      const dy = ty - y

      vx += dx * 0.1
      vy += dy * 0.1

      vx *= 0.8
      vy *= 0.8

      x += vx
      y += vy

      if (Math.abs(dx) > 0.5 || Math.abs(vx) > 0.5) {
        frame = requestAnimationFrame(loop)
      } else {
        x = tx
        y = ty
      }
    }

    frame = requestAnimationFrame(loop)
  }

  function cancel() {
    if (frame) cancelAnimationFrame(frame)
  }

  // expose programmatic API
  export const api = { swipe }
</script>

<div class="absolute inset-0" style={`z-index: ${zIndex}`}>
  <div
      class="relative w-full h-full overflow-hidden will-change-transform touch-none select-none"
      class:pointer-events-none={!isFront}
      style={`
        transform:
          translate(${x}px, ${y}px)
          rotate(${rotate}deg)
          scale(${scale});

          transition:
              ${dragging ? 'none' : 'transform 0.2s ease-out'};
      `}
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointerleave={onPointerUp}
      role="navigation"
  >
    <img
        src={`https://image.tmdb.org/t/p/w500/${film.poster}`}
        class="absolute inset-0 rounded-3xl object-contain m-auto"
        draggable="false"
        alt="Poster"
    />

    <!-- Footer -->
    <!--{#if isFront}-->
    <!--  <section class="absolute bottom-4 left-4 flex flex-col z-10 gap-2 justify-start pl-4"-->
    <!--           style={`opacity: ${footerOpacity}`}>-->
    <!--    <h2 class="text-2xl font-bold leading-tight drop-shadow-lg text-foreground line-clamp-2">-->
    <!--      {film.title}-->
    <!--    </h2>-->
    <!--    <div class="flex w-full flex-wrap gap-2">-->
    <!--      <img src={languages.getFlag(film.language)}-->
    <!--           width="18"-->
    <!--           alt="Film Language"/>-->

    <!--      <span-->
    <!--          class="flex gap-1 items-center font-medium h-5 px-3 py-4 rounded-4xl bg-secondary/60 [font-variant:small-caps]">-->
    <!--         <Calendar class="size-3"/> {film.year}-->
    <!--       </span>-->

    <!--      <span-->
    <!--          class="flex gap-1 items-center font-medium h-5 px-3 py-4 rounded-4xl bg-secondary/60 [font-variant:small-caps]">-->
    <!--         <Timer class="size-3"/>{formatDuration(film.runtime)}-->
    <!--       </span>-->

    <!--      <span-->
    <!--          class="flex items-center font-medium h-5 px-3 py-4 rounded-4xl bg-secondary/60 [font-variant:small-caps]">-->
    <!--         {film.genres[0]}-->
    <!--       </span>-->

    <!--    </div>-->
    <!--  </section>-->
    <!--{/if}-->

    <!-- LIKE -->
    <div
        class="absolute top-6 left-6 border-4 border-primary rounded-2xl text-primary px-4 py-1 -rotate-12 text-5xl font-black"
        style="opacity: {likeOpacity}"
    >
      LIKE
    </div>

    <!-- NOPE -->
    <div
        class="absolute top-6 right-6 border-4 rounded-2xl border-red-500 text-red-500 px-4 py-1 rotate-12 text-5xl font-black"
        style="opacity: {nopeOpacity}"
    >
      NOPE
    </div>
  </div>
</div>