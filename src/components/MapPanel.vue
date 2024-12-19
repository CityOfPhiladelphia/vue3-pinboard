<script setup>

import { ref, computed, getCurrentInstance, onMounted, watch } from 'vue';

import { useMapStore } from '../stores/MapStore.js'
const MapStore = useMapStore();
import Map from './map/Map.vue';

defineEmits(['geolocate']);

// import { useDataStore } from '../stores/DataStore.js';
// const DataStore = useDataStore();
// await DataStore.fillZipcodes();

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
    />
  </div>
</template>

<style>

</style>