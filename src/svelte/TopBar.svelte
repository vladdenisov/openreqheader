<script>
  import TopAppBar, { Row, Section } from '@smui/top-app-bar';
  import Snackbar, { Actions, Label } from '@smui/snackbar';
  import IconButton from '@smui/icon-button';
  import Button from '@smui/button';
  import { mdiShare, mdiUndo } from '@mdi/js';
  import TopBarAddMenu from './TopBarAddMenu.svelte';
  import TopBarPauseButton from './TopBarPauseButton.svelte';
  import TopBarTabLockButton from './TopBarTabLockButton.svelte';
  import TopBarMoreMenu from './TopBarMoreMenu.svelte';
  // import TopBarSignInButton from './TopBarSignInButton.svelte'; // see disabled usage below
  import ProfileBadgeDialog from './ProfileBadgeDialog.svelte';
  import MdiIcon from './MdiIcon.svelte';
  import { isPaused, isLocked, undo } from '../js/datasource.js';
  import { selectedProfile, updateProfile, buttonColor } from '../js/profile.js';
  import { canUndoChange } from '../js/change-stack.js';
  import { showExportDialog } from '../js/dialog.js';

  let pauseSnackbar;
  let tabLockSnackbar;
  let profileBadgeDialog;

  $: {
    if (pauseSnackbar && tabLockSnackbar) {
      if ($isPaused) {
        tabLockSnackbar.close();
        pauseSnackbar.open();
      } else {
        pauseSnackbar.close();
        if ($isLocked) {
          tabLockSnackbar.open();
        } else {
          tabLockSnackbar.close();
        }
      }
    }
  }
</script>

<ProfileBadgeDialog bind:this={profileBadgeDialog} />

<TopAppBar
  variant
  dense
  class="top-bar"
  style="background-color: {$selectedProfile.backgroundColor};"
>
  <Row>
    <Section>
      <IconButton
        dense
        class="top-bar-profile-badge-icon"
        on:click={() => {
          profileBadgeDialog.show();
        }}
        title="Change profile badge"
      >
        <span class="top-bar-profile-badge" style="background: {$selectedProfile.backgroundColor}">
          <span class="top-bar-profile-badge-text" style="color: {$selectedProfile.textColor}">
            {$selectedProfile.shortTitle}
          </span>
        </span>
      </IconButton>

      <input
        class="mdc-text-field__input profile-title"
        style="color: {$selectedProfile.textColor}"
        value={$selectedProfile.title}
        on:input={(event) => updateProfile({ title: event.target.value })}
      />
    </Section>
    <Section align="end">
      {#if $canUndoChange}
        <IconButton dense on:click={() => undo()} title="Undo">
          <MdiIcon size="24" icon={mdiUndo} color={$buttonColor} />
        </IconButton>
      {/if}
      <TopBarAddMenu />
      <TopBarPauseButton />
      <TopBarTabLockButton />
      <IconButton
        dense
        on:click={() => showExportDialog.set(true)}
        title="Export / share profile(s)"
      >
        <MdiIcon size="24" icon={mdiShare} color={$buttonColor} />
      </IconButton>
      <!--
        Sign-in disconnected from modheader.com: that domain belonged to the
        original project, whose later builds shipped spyware (see README).
        Re-enable once this fork has its own account backend.
        <TopBarSignInButton />
      -->
      <TopBarMoreMenu />
    </Section>
  </Row>
</TopAppBar>

<Snackbar timeoutMs={10000} bind:this={pauseSnackbar}>
  <Label>OpenReqHeader is Paused</Label>
  <Actions>
    <Button on:click={() => isPaused.set(false)}>Resume</Button>
  </Actions>
</Snackbar>
<Snackbar timeoutMs={10000} bind:this={tabLockSnackbar}>
  <Label>Tab lock is active</Label>
  <Actions>
    <Button on:click={() => isLocked.set(false)}>Unlock</Button>
  </Actions>
</Snackbar>

<style module>
  .profile-title {
    border: none;
    background: none;
    color: #fff;
    margin: 0 10px;
    font-size: 18px;
    outline: none;
    padding: 0;
  }

  .top-bar {
    width: var(--top-bar-width);
  }

  .top-bar-profile-badge {
    border: 2px solid white;
    border-radius: 50%;
    font-size: 20px;
    top: 10px;
    position: absolute;
    left: 8px;
  }

  .top-bar-profile-badge-text {
    width: 24px;
    display: flex;
    justify-content: center;
  }
</style>
