<script setup>
import { computed } from 'vue';
import { useMapStore } from '../../stores/MapStore.js';
const MapStore = useMapStore();

defineEmits(['geolocate']);

const controlClass = computed(() => {
  let value = 'geolocate-control-off';
  if (MapStore.geolocation) {
    value = 'geolocate-control-on';
  }
  return value;
});

const imgSrc = computed(() => {
  return 'images/location-crosshairs-solid.svg';
});

</script>

<template>
  <div :class="controlClass + ' geolocate-control'">
    <button
      class="geolocate-button"
      :title="'Find your location'"
      @click="$emit('geolocate')"
    >
      <img
        class="img-src"
        alt="imagery-or-basemap"
        :src="imgSrc"
      >
    </button>
  </div>
</template>

<style scoped>

button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  width: 32px;
}

.geolocate-control-on {
  background-color: rgb(243, 198, 19);
}

.geolocate-control-off {
  background-color: white;
}

.geolocate-control {
  height: 32px;
  width: 32px;
  position: absolute;
  bottom: 106px;
  right: 9px;
  z-index: 2;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  border-color: rgb(167, 166, 166)
}

.geolocate-button {
  padding: 0px;
}

.img-src {
  margin-left: -4px;
  margin-top: 5px;
  width: 18px;
  height: 18px;
  max-width: 300%;
}

/* @media 
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {

  @supports (-webkit-touch-callout: none) {
    CSS specific to iOS devices
    .img-src {
      margin-left: -10px !important;
      width: 36x;
    }
  }
} */

</style>