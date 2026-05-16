<script lang="ts">
  import type { TmdbFilm } from '@couchrift/shared/schemas/tmdbFilm.ts'

  let {
        film,
        depth,
        zIndex,
        onSwipe,
        onExit,
        onTap
      }: {
    film: TmdbFilm
    depth: number,
    zIndex: number,
    onSwipe?: (dir: 'left' | 'right', film: any) => Promise<boolean>
    onExit?: () => void
    onTap?: () => void
  } = $props()

  let x = $state(0)
  let y = $state(0)

  let dragging = $state(false)
  let moved = false

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

  function onPointerDown(e: PointerEvent) {
    if (!isFront) return

    dragging = true
    moved = false // tracks movement for the onclick handler

    startX = e.clientX
    startY = e.clientY
    lastX = 0
    velocityX = 0
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return

    const newX = e.clientX - startX
    const newY = e.clientY - startY

    // Detect movement and set a flag
    if (Math.abs(newX) > 8 || Math.abs(newY) > 8) {
      moved = true
    }

    velocityX = newX - lastX
    lastX = newX

    x = newX
    y = newY * 0.2
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging) return
    dragging = false

    // Detect taps and trigger callbacks
    if (!moved) {
      onTap?.()
      return
    }

    const absX = Math.abs(x)

    if (absX > SWIPE_THRESHOLD || Math.abs(velocityX) > 15) {
      swipe(x > 0 ? 'right' : 'left')
    } else {
      springBack()
    }
  }

  // Animations
  // 1. start animation immediately
  // 2. send request in parallel
  // 3. remove card only after animation completes
  // 4. when the request fails, restore the card

  async function swipe(dir: 'left' | 'right') {
    const target = dir === 'right' ? 600 : -600

    // Set initial random velocity
    const throwY = y + (dir === 'right' ? 40 : -40)

    // Start request immediately, but don't await yet
    const swipePromise = onSwipe?.(dir, film)

    if (dir === 'right') {
      x += 20
    } else {
      x -= 20
    }

    // Animate immediately
    animateTo(target, throwY, 0.5, async () => {
      const swiped = await swipePromise

      if (swiped) {
        // Dequeue film
        onExit?.()
      } else {
        // Restore card
        springBack()
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
      const ease = t * (2 - t) // quadratic ease

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

<!-- Outer wrapper for scale animation -->
<div
    class="absolute inset-0 duration-300 ease-out transition-transform"
    style={`
    z-index:${zIndex};
    transform: scale(${scale});
  `}
>

  <div
      class="relative w-full h-full overflow-hidden will-change-transform touch-none select-none"
      class:pointer-events-none={!isFront}
      style={`
        transform:
          translate(${x}px, ${y}px)
          rotate(${rotate}deg);
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