<script setup>

import { computed } from 'vue';
import { useMainStore } from '@/stores/MainStore.js'
const MainStore = useMainStore();
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
const GeocodeStore = useGeocodeStore();
import { useDataStore } from '@/stores/DataStore.js'
const DataStore = useDataStore();

import AddressSearchControl from '@/components/AddressSearchControl.vue';
import ExpandCollapse from '@/components/ExpandCollapse.vue';

import { useRoute } from 'vue-router';

const version = import.meta.env.VITE_VERSION;

const route = useRoute();

const address = computed(() => MainStore.currentAddress);

// const zipCode = computed(() => {
//   if (GeocodeStore.aisData && GeocodeStore.aisData.features) {
//     return GeocodeStore.aisData.features[0].properties.zip_code + '-' + GeocodeStore.aisData.features[0].properties.zip_4;
//   }
//   return '';
// });

const currentItems = computed(() => {
  return DataStore.covidFreeMealSites.features;
});

</script>

<template>
      
  <!-- FRONT PAGE CONTENT -->

  <!-- ADDRESS NOT FOUND CONTENT -->
  <div
    v-if="route.name == 'not-found'"
    id="locations-panel-no-locations"
    class="section"
  >
    <div :class="MainStore.fullScreenTopicsEnabled ? 'topic-panel-half': ''">
      <h1 class="subtitle is-3">We couldn't find that address.</h1>
      <p class="subtitle is-4">Are you sure everything was spelled correctly?</p>
      <p>Here are some examples of things you can search for:</p>
      <ul class="bullet-list">
        <li>1234 Market St</li>
        <li>1001 Pine Street #201</li>
        <li>12th & Market</li>
        <li>883309050 (an OPA number with no hyphens or other characters)</li>
        <li>001S070144 (a DOR number with no hyphens of other characters)</li>
      </ul>
    </div>
  </div>

  <!-- IF AN ADDRESS IS LOADED, SHOW THE LOCATIONS  -->

  <div
    v-if="route.name !== 'not-found'"
    id="locations-panel-content"
    class="locations"
  >
    <div v-for="item in currentItems">
      <ExpandCollapse
        :item="item"
        :is-map-visible="true"
      >
        <!-- :is-map-visible="isMapVisible"
        :checked="selectAllCheckbox" -->
        <!-- @print-box-checked="printBoxChecked" -->
      </ExpandCollapse>
    </div>
  </div>
</template>

<style>

.address-and-marker {
  margin-top: .5rem !important;
  margin-bottom: 0px !important;
}

</style>