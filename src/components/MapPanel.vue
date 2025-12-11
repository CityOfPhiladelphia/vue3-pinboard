<script setup>

import { computed } from 'vue';
import { useMapStore } from '../stores/MapStore.js'
import Map from './map/Map.vue';

const MapStore = useMapStore();

defineEmits(['geolocate', 'popup-clicked']);

const mapPanelClass = computed(() => {
  if (MapStore.cyclomediaOn || MapStore.eagleviewOn) {
    return 'map-panel cyclomedia-eagleview';
  } else {
    return 'map-panel';
  }
});

</script>

<template>
  <div
    id="map-panel"
    :class="mapPanelClass"
  >
    <Map
      @geolocate="$emit('geolocate')"
      @popup-clicked="$emit('popup-clicked')"
    />
  </div>
</template>

<style>

</style>
