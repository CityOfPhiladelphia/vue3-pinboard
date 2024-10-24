<script setup>

import Map from './map/Map.vue';

const mapPanelClass = computed(() => {
  return 'map-panel';
});

</script>

<template>
  <div
    id="map-panel"
    :class="mapPanelClass"
  >
    <Map />
  </div>
</template>

<style>

</style>