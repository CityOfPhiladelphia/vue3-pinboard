<script setup>

import { ref, computed, getCurrentInstance, onMounted, watch } from 'vue';

// import Map from './map/Map.vue';

// import { useDataStore } from '../stores/DataStore.js';
// const DataStore = useDataStore();
// await DataStore.fillZipcodes();

const mapPanelClass = computed(() => {
  return 'map-panel';
});

</script>

<template>
  <div
    id="map-panel"
    :class="mapPanelClass"
  >
    <!-- <Map /> -->
  </div>
</template>

<style>

</style>