<script>
  // This fork has no PRO gating (see identity.js): every feature is unlocked, so
  // ProFeature just renders its content with no lock overlay or upgrade prompt.
  // Kept as a thin wrapper so existing call sites keep working unchanged.
  export let requirePro = true;
  requirePro; // referenced to keep the prop; intentionally unused.
</script>

<div class="pro-feature-container">
  <slot upgradeRequired={false} />
</div>

<style module>
  .pro-feature-container {
    position: relative;
    display: inline-block;
    height: 100%;
  }
</style>
