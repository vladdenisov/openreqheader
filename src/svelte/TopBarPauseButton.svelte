<script>
  import IconButton from '@smui/icon-button';
  import { mdiPlay, mdiPause } from '@mdi/js';
  import { buttonColor } from '../js/profile.js';
  import MdiIcon from './MdiIcon.svelte';
  import { isPaused } from '../js/datasource.js';
</script>

<IconButton
  dense
  on:click={() => isPaused.set(!$isPaused)}
  title={$isPaused ? 'Resume OpenReqHeader' : 'Pause OpenReqHeader'}
>
  {#if $isPaused}
    <MdiIcon size="24" icon={mdiPlay} color={$buttonColor} />
  {:else}
    <MdiIcon size="24" icon={mdiPause} color={$buttonColor} />
  {/if}
</IconButton>
