<script setup>

import { useMapStore } from '@/stores/MapStore.js'
const MapStore = useMapStore();
import Map from '@/components/map/Map.vue';

import { computed } from 'vue';

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