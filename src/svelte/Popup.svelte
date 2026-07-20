<script>
  import App from './App.svelte';
</script>

<App />

<style module>
  body {
    /* Chrome caps popup size at 600x800; a fixed 460 height clipped longer
       header lists with no scroll. Use 600 (the cap) so content fits. */
    height: 600px;
    /** Fix FF popup disappearance on long window. */
    width: 620px !important;
  }

  :root {
    --app-content-width: 580px;
    --top-bar-width: 585px;
    --profiles-list-min-height: 460px;
  }
</style>
