<script lang="ts">
  import { fly, scale } from 'svelte/transition'
  import { quintOut, cubicOut } from 'svelte/easing'
  import * as Drawer from '$lib/components/ui/drawer'
  import * as Avatar from '$lib/components/ui/avatar'
  import { Button, buttonVariants } from '$lib/components/ui/button'
  import { getLoungeContext } from '$lib/loungeService.svelte'
  import { FilmCard } from '$lib/components/films/film-card'
  import AvatarsList from '$lib/components/layout/avatars-list/avatars-list.svelte'

  const ls = getLoungeContext()

  let match = $derived(ls.match!)
  let participants = $derived(ls.lounge.participants)

</script>

<div class="relative flex flex-col flex-1 min-h-0 w-full justify-between items-center">

  <!-- Background -->
  <div class="absolute inset-0 -z-10 overflow-hidden">
    <img
        src={`https://image.tmdb.org/t/p/original/${match.backdrop}`}
        alt="Backdrop"
        aria-hidden="true"
        fetchpriority="high"
        decoding="async"
        class="
          h-full
          w-full
          object-cover
          blur-md
          scale-[1.1]
          opacity-60
        "
    />

  </div>

  <!-- Top Overlay -->
  <div class="flex z-10">

    <div class="
        flex
        flex-col
        items-center
        justify-center
        gap-2
      "
    >

      <span transition:fly={{ x: -40, duration: 600, easing: cubicOut }}
            class="
              text-4xl
              font-bold
              font-bebas
              uppercase
              italic
              text-foreground
              p-8
              drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]
            ">
        It's a match!
      </span>

      <div transition:fly={{ x: -40, duration: 600, delay: 300, easing: cubicOut }}
           class="flex justify-center -space-x-2 *:data-[slot=avatar]:ring-1 *:data-[slot=avatar]:ring-white items-center">

        <AvatarsList users={participants}/>

      </div>

      <span transition:fly={{ x: -40, duration: 600, delay: 400, easing: cubicOut }}
            class="
        italic
        opacity-80
        drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]
      ">... all agreed to watch:</span>

    </div>

  </div>

  <!-- Poster -->
  <div class="relative z-10 flex flex-col flex-1 min-h-0 w-full justify-center items-center">
    <div transition:scale={{
            start: 0.6,
            duration: 450,
            easing: quintOut
          }}
         class="flex flex-col items-center justify-center h-full min-h-0 w-full"
    >

      <img
          src={`https://image.tmdb.org/t/p/w780/${match.poster}`}
          alt={match.title}
          draggable="false"
          class="
              max-w-2/3
              rounded-3xl
              object-cover
              select-none
              poster-hero
              ring-3
            "
      />
    </div>
  </div>

  <!-- Actions -->
  <div class="flex w-full flex-col gap-4 px-8 mb-4">
    <Drawer.Root>
      <Drawer.Trigger class={buttonVariants({ variant: "default" })}>
        View Details
      </Drawer.Trigger>
      <Drawer.Content class="md:max-w-lg mx-auto">
        <FilmCard film={match}/>
      </Drawer.Content>
    </Drawer.Root>
    <Button size="lg" variant="secondary" href={`/lounges/${ls.lounge.id}`}>Review Session</Button>
    <Button size="lg" variant="secondary" href="/home">View Dashboard</Button>
  </div>
</div>

<style>
    @keyframes poster-hover {
        0% {
            transform: translateY(0px) rotate(1deg) scale(1);
        }

        50% {
            transform: translateY(-10px) rotate(-1deg) scale(1.02);
        }

        100% {
            transform: translateY(0px) rotate(1deg) scale(1);
        }
    }

    .poster-hero {
        animation: poster-hover 6s ease-in-out infinite backwards;

        animation-delay: 600ms;

        will-change: transform,
        box-shadow;
    }
</style>