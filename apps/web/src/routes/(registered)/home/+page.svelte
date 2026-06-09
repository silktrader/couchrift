<script lang="ts">
  import type { PageProps } from './$types'
  import { Button } from '$lib/components/ui/button'
  import * as Avatar from '$lib/components/ui/avatar'
  import * as Item from '$lib/components/ui/item'
  import * as InputOTP from '$lib/components/ui/input-otp'
  import * as UnderlineTabs from '$lib/components/ui/underline-tabs'
  import { FieldSeparator } from '$lib/components/ui/field'
  import { ThumbsUp, ThumbsDown, Bookmark, UserRound, CircleAlert, X, ClipboardPaste } from '@lucide/svelte'
  import { goto } from '\$app/navigation'
  import { getUserContext } from '$lib/userService.svelte.js'
  import { createLounge, leaveLounge, defaultSettings } from '$lib/loungeService.svelte.js'
  import { flip } from 'svelte/animate'
  import { formatRelativeTime } from '$lib/dates'
  import { untrack } from 'svelte'
  import { ID_LENGTH } from '@couchrift/shared/config/ids'
  import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'bits-ui'
  import { client } from '$lib/et-api'
  import AppHeader from '$lib/components/layout/app-header.svelte'
  import { Badge } from '$lib/components/ui/badge'

  let { data }: PageProps = $props()

  const us = getUserContext()
  let activeLounges = $state(untrack(() => data.lounges.active))
  let endedLounges = $state(untrack(() => data.lounges.ended))

  let shortcode = $state('')
  let shortcodeError = $state('')

  async function handleCreateLounge() {
    const result = await createLounge(defaultSettings)
    if (result.ok) {
      await goto(`${result.data.shortcode}/waiting`)
    } else {
      // tk display error
      console.error(result.error)
    }
  }

  async function handleJoinLounge() {
    const { data, error } = await client.api.lounges.waiting({ shortcode }).participants.post()

    if (data) {
      await goto(`/${shortcode}/waiting`)
      return
    }

    switch (error.status) {
      case 404:
        shortcodeError = 'Lounge not found.'
        break
      case 409:
        shortcodeError = 'Lounge already started.'
        break
      case 422:
        shortcodeError = 'Malformed code.'
        break
      default:
        shortcodeError = 'Unknown error occurred.'
    }
  }

  async function handleGotoLounge(lounge: { shortcode: string, startedAt: number | null }) {
    if (lounge.startedAt === null) await goto(`/${lounge.shortcode}/waiting`)
    else await goto(`/${lounge.shortcode}`)
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      const cleaned = text.trim()
      shortcode = cleaned.slice(0, ID_LENGTH.shortcode)

      // Automatically trigger join lounge if the clipboard content is the correct length
      if (shortcode.length === ID_LENGTH.shortcode) {
        await handleJoinLounge()
      }
    } catch (err) {
      console.error('Failed to read clipboard contents:', err)
    }
  }

</script>

<AppHeader user={us.user}/>

<!-- Main Actions -->
<section class="flex w-1/2 flex-col justify-center self-center gap-6 mt-4 mb-8 shrink-0 p-4">

  {#if shortcodeError}

    <div class="flex flex-col gap-6 min-h-20 justify-center">
      <Item.Root variant="outline" size="sm" class="bg-card">
        <Item.Media variant="icon" class="text-destructive">
          <CircleAlert/>
        </Item.Media>
        <Item.Content class="text-destructive">
          <Item.Title>{shortcodeError}</Item.Title>
        </Item.Content>
        <Item.Actions>
          <Button size="icon-sm" variant="ghost" onclick={() => shortcodeError = ''}>
            <X/>
          </Button>
        </Item.Actions>
      </Item.Root>
    </div>

  {:else}

    <div class="flex flex-col items-center gap-4 min-h-20">
      <span>Enter a lounge's code:</span>
      <div class="flex items-center gap-2">

        <Button
            variant="outline"
            size="icon"
            onclick={handlePaste}
            title="Paste from clipboard"
        >
          <ClipboardPaste class="size-5"/>
        </Button>

        <InputOTP.Root
            maxlength={ID_LENGTH.shortcode}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
            bind:value={shortcode}
            onComplete={handleJoinLounge}
        >
          {#snippet children({cells})}
            <InputOTP.Group class="m-auto">
              {#each cells as cell (cell)}
                <InputOTP.Slot {cell}/>
              {/each}
            </InputOTP.Group>
          {/snippet}
        </InputOTP.Root>

      </div>
    </div>
  {/if}

  <FieldSeparator>or</FieldSeparator>
  <Button variant="default" onclick={async () => await handleCreateLounge()}>Create Lounge</Button>
</section>

<!-- Active Lounges -->
<section class="flex flex-col flex-1 gap-2 items-center">
  <UnderlineTabs.Root value="active" class="w-full">
    <UnderlineTabs.List class="flex justify-center items-center">
      <UnderlineTabs.Trigger class="text-md" value="active">Active</UnderlineTabs.Trigger>
      <UnderlineTabs.Trigger class="text-md" value="ended">Ended</UnderlineTabs.Trigger>
    </UnderlineTabs.List>

    <!-- Active lounges -->
    <UnderlineTabs.Content value="active">
      <div class="flex flex-1 overflow-y-auto min-h-0 w-full flex-col items-center gap-2 p-4 pb-8">
        {#each activeLounges as lounge (lounge.id)}

          <div class="w-full" animate:flip>
            <Item.Root variant="outline" class="w-full" onclick={() => handleGotoLounge(lounge)}>
              <Item.Media>
                <div class="flex -space-x-2 items-center">

                  {#each lounge.participants as participant (participant.id)}
                    <Avatar.Root class="size-12 ring-1 ring-foreground">
                      {#if participant.image}
                        <Avatar.Image src={`/uploads/avatars/${participant.image}`} alt="User Avatar"/>
                      {/if}
                      <Avatar.Fallback>{participant.name[0].toLocaleUpperCase()}.</Avatar.Fallback>
                    </Avatar.Root>
                  {/each}
                </div>

              </Item.Media>

              <!-- Status -->
              <div class="flex flex-1 justify-end">
                <Badge class="min-h-5 min-w-5 rounded-full px-1 py-3 [font-variant:small-caps]" variant="secondary">
                  {lounge.startedAt === null ? 'waiting' : 'started'}
                </Badge>
              </div>

              <Item.Content class="flex items-end">
                <Item.Title class="text-md font-mono font-semibold tracking-wider">{lounge.shortcode}</Item.Title>
                <Item.Description class="text-sm italic">{formatRelativeTime(lounge.createdAt)}</Item.Description>
              </Item.Content>
            </Item.Root>
          </div>
        {:else}
          <span class="text-muted-foreground">No active lounges</span>
        {/each}
      </div>
    </UnderlineTabs.Content>

    <!-- Ended lounges -->
    <UnderlineTabs.Content value="ended">
      <div class="flex flex-1 overflow-y-auto min-h-0 w-full flex-col items-center gap-2 p-4 pb-8">
        {#each endedLounges as lounge (lounge.id)}

          <div class="w-full" animate:flip>
            <Item.Root variant="outline" class="w-full" onclick={() => goto(`/lounges/${lounge.id}`)}>
              <Item.Media>
                <div class="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-muted-foreground items-center">
                  {#each lounge.participants as participant (participant.id)}
                    <Avatar.Root class="size-12">
                      {#if participant.image}
                        <Avatar.Image src={`/uploads/avatars/${participant.image}`} alt="User Avatar"/>
                      {/if}
                      <Avatar.Fallback>{participant.name[0].toLocaleUpperCase()}.</Avatar.Fallback>
                    </Avatar.Root>
                  {/each}
                </div>
              </Item.Media>

              <!-- Status -->
              <!--               <div class="flex flex-1 justify-end"> -->
              <!--                 <Badge class="min-h-5 min-w-5 rounded-full px-1 py-3 [font-variant:small-caps]" variant="secondary"> -->
              <!--                   matched -->
              <!--                 </Badge> -->
              <!--               </div> -->

              <Item.Content class="flex items-end">
                <Item.Title
                    class="text-md font-bebas font-semibold tracking-wider">{lounge.matches[0].title}</Item.Title>
                <Item.Description class="text-sm italic">{formatRelativeTime(lounge.endedAt)}</Item.Description>
              </Item.Content>

            </Item.Root>
          </div>
        {:else}
          <span class="text-muted-foreground">No ended lounge</span>
        {/each}
      </div>
    </UnderlineTabs.Content>

  </UnderlineTabs.Root>

</section>

<!-- Main Navigator -->
<footer class="flex w-full flex-col items-center justify-end gap-6 p-8 shrink-0">
  <div class="flex w-full justify-between gap-6">
    <div class="flex w-12 flex-col items-center gap-1">
      <Button variant="outline" size="icon-lg">
        <ThumbsUp/>
      </Button>
      <span class="text-sm text-muted-foreground">Likes</span>
    </div>

    <div class="flex w-12 flex-col items-center gap-1">
      <Button variant="outline" size="icon-lg">
        <ThumbsDown/>
      </Button>
      <span class="text-sm text-muted-foreground">Dislikes</span>
    </div>

    <div class="flex w-12 flex-col items-center gap-1">
      <Button variant="outline" size="icon-lg">
        <Bookmark/>
      </Button>
      <span class="text-sm text-muted-foreground">Bookmarks</span>
    </div>

    <div class="flex w-12 flex-col items-center gap-1">
      <Button variant="outline" size="icon-lg">
        <UserRound/>
      </Button>
      <span class="text-sm text-muted-foreground">Friends</span>
    </div>
  </div>
</footer>
