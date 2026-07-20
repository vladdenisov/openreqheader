<script>
  import { AppContent } from '@smui/drawer';
  import Snackbar, { Actions, Label as SnackbarLabel } from '@smui/snackbar';
  import IconButton from '@smui/icon-button';
  import Button from '@smui/button';
  import { mdiClose } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import lodashCloneDeep from 'lodash/cloneDeep';
  import TopBar from './TopBar.svelte';
  import Drawer from './Drawer.svelte';
  import Filters from './Filters.svelte';
  import Headers from './Headers.svelte';
  import ExportDialog from './ExportDialog.svelte';
  import ImportDialog from './ImportDialog.svelte';
  import CloudBackupDialog from './CloudBackupDialog.svelte';
  import { isPaused, undo, init } from '../js/datasource.js';
  import { FilterType } from '../js/filter.js';
  import { selectedProfile, save, updateProfile } from '../js/profile.js';
  import { addUrlRedirect, removeUrlRedirect } from '../js/url-redirect.js';
  import { addHeader, removeHeader } from '../js/header.js';
  import MdiIcon from './MdiIcon.svelte';
  import { toastMessage, undoable } from '../js/toast.js';
  import { KNOWN_REQUEST_HEADERS, KNOWN_RESPONSE_HEADERS } from '../js/constants.js';

  let snackbar;
  let snackbarMessage;

  window.addEventListener('unload', save);

  const unsubscribeToastMessage = toastMessage.subscribe((message) => {
    if (snackbar) {
      snackbarMessage = message;
      if (message.length > 0) {
        snackbar.open();
      } else {
        snackbar.close();
      }
    }
  });

  onDestroy(unsubscribeToastMessage);
</script>

{#await init() then initResult}
  <Drawer />

  <AppContent class="app-content">
    <div class="top-app-bar-container">
      <TopBar />
    </div>
    <div class="scroll-content {$isPaused ? 'disabled' : ''}">
      {#if $selectedProfile.headers.length > 0}
        <Headers
          id="request-header"
          headers={lodashCloneDeep($selectedProfile.headers)}
          class="extra-gap"
          title="Request headers"
          autocompleteListId="request-autocomplete"
          autocompleteNames={KNOWN_REQUEST_HEADERS}
          on:add={() => {
            updateProfile({ headers: addHeader($selectedProfile.headers) });
          }}
          on:remove={(event) => {
            updateProfile({
              headers: removeHeader($selectedProfile.headers, event.detail)
            });
          }}
          on:refresh={(event) => {
            updateProfile({ headers: event.detail });
          }}
        />
      {/if}
      {#if $selectedProfile.respHeaders.length > 0}
        <Headers
          id="response-header"
          headers={lodashCloneDeep($selectedProfile.respHeaders)}
          class="extra-gap"
          title="Response headers"
          autocompleteListId="response-autocomplete"
          autocompleteNames={KNOWN_RESPONSE_HEADERS}
          profile={selectedProfile}
          on:add={() => {
            updateProfile({
              respHeaders: addHeader($selectedProfile.respHeaders)
            });
          }}
          on:remove={(event) => {
            updateProfile({
              respHeaders: removeHeader($selectedProfile.respHeaders, event.detail)
            });
          }}
          on:refresh={(event) => {
            updateProfile({ respHeaders: event.detail });
          }}
        />
      {/if}
      {#if $selectedProfile.urlReplacements.length > 0}
        <Headers
          id="url-replacement"
          headers={lodashCloneDeep($selectedProfile.urlReplacements)}
          class="extra-gap"
          title="Redirect URLs"
          nameLabel="Original URL"
          valueLabel="Redirect URL"
          profile={$selectedProfile}
          on:add={async () => {
            updateProfile({
              urlReplacements: await addUrlRedirect($selectedProfile.urlReplacements)
            });
          }}
          on:remove={(event) => {
            updateProfile({
              urlReplacements: removeUrlRedirect($selectedProfile.urlReplacements, event.detail)
            });
          }}
          on:refresh={(event) => {
            updateProfile({ urlReplacements: event.detail });
          }}
        />
      {/if}
      <Filters
        id="url-filter"
        filters={lodashCloneDeep($selectedProfile.urlFilters)}
        filterType={FilterType.URLS}
        class="extra-gap"
      />
      <Filters
        id="exclude-url-filter"
        filters={lodashCloneDeep($selectedProfile.excludeUrlFilters)}
        filterType={FilterType.EXCLUDE_URLS}
        class="extra-gap"
      />
      <Filters
        id="resource-filter"
        filters={lodashCloneDeep($selectedProfile.resourceFilters)}
        filterType={FilterType.RESOURCE_TYPES}
        class="extra-gap"
      />
    </div>
  </AppContent>

  <ExportDialog />
  <ImportDialog />
  <CloudBackupDialog />

  <Snackbar timeoutMs={4000} bind:this={snackbar} labelText={snackbarMessage}>
    <SnackbarLabel />
    <Actions>
      {#if $undoable}
        <Button on:click={() => undo()}>Undo</Button>
      {/if}
      <IconButton dense on:click={() => snackbar.close()} title="Dismiss">
        <MdiIcon size="24" icon={mdiClose} color="white" />
      </IconButton>
    </Actions>
  </Snackbar>
{/await}

<style module>
  .app-content {
    margin-left: 0 !important;
    width: var(--app-content-width);
    position: absolute;
    left: 36px;
  }

  .top-app-bar-container {
    height: 48px;
  }

  /* Chrome caps the popup at 600px tall, so the header/filter list can't grow
     the window past that. Scroll it inside the remaining height instead of
     clipping (the top bar stays pinned at 48px). */
  .scroll-content {
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    overflow-x: hidden;
  }

  .extra-gap {
    margin: 2px;
  }
</style>
