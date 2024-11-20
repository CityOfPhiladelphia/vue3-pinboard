import { createRouter, createWebHistory } from 'vue-router';
// import App from '../App.vue';
import Main from '../views/Main.vue';

import { useMainStore } from '../stores/MainStore.js';
import { useMapStore } from '../stores/MapStore.js';
import { useGeocodeStore } from '../stores/GeocodeStore.js';
import { useDataStore } from '../stores/DataStore.js';
import { useConfigStore } from '../stores/ConfigStore.js';

import { polygon, point } from '@turf/helpers';

const getGeocodeAndPutInStore = async(address) => {
  const GeocodeStore = useGeocodeStore();
  const MainStore = useMainStore();
  await GeocodeStore.fillAisData(address);
  if (!GeocodeStore.aisData.features) {
    MainStore.currentAddress = null;
    if (import.meta.env.VITE_DEBUG == 'true') console.log('getGeocodeAndPutInStore, calling not-found');
    router.push({ name: 'not-found' });
    return;
  }
  let currentAddress;
  if (GeocodeStore.aisData.features[0].properties.street_address) {
    currentAddress = GeocodeStore.aisData.features[0].properties.street_address;
  } else if (GeocodeStore.aisData.features[0].street_address) {
    currentAddress = GeocodeStore.aisData.features[0].street_address;
  }
  MainStore.setCurrentAddress(currentAddress);
  // MainStore.addressSearchRunning = false;
}

const clearGeocode = async() => {
  const GeocodeStore = useGeocodeStore();
  const MainStore = useMainStore();
  const MapStore = useMapStore();
  GeocodeStore.aisData = {};
  MainStore.currentAddress = null;
  MapStore.bufferForAddressOrZipcode = null;
  MainStore.selectedZipcode = null;
  // MapStore.bufferForAddressOrZipcode = point([]);
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Main,
      beforeEnter: async (to, from) => {
        if (import.meta.env.VITE_DEBUG) console.log('router beforeEnter is running to:', to, 'from:', from);
        const MainStore = useMainStore();
        const DataStore = useDataStore();
        const ConfigStore = useConfigStore();
        const $config = ConfigStore.config;
        if ($config.agoTokenNeeded) {
          await DataStore.fillAgoToken();
        }
        await DataStore.fillAppType();
        await DataStore.fillResources();
        // await DataStore.fillHolidays();
        await DataStore.fillZipcodes();
        MainStore.firstRouteLoaded = true;
        if (import.meta.env.VITE_DEBUG) console.log('router beforeEnter is running, DataStore.zipcodes:', DataStore.zipcodes);
      }
    },
    {
      path: '/not-found',
      name: 'not-found',
      component: Main,
    },
  ]
})

router.afterEach(async (to, from) => {
  const DataStore = useDataStore();
  const MainStore = useMainStore();
  const MapStore = useMapStore();
  const GeocodeStore = useGeocodeStore();
  if (import.meta.env.VITE_DEBUG) console.log('router.afterEach to:', to, 'from:', from);
  if (to.query.resource && to.query.resource != from.query.resource) {
    DataStore.selectedResource = to.query.resource;
  } else {
    DataStore.selectedResource = null;
  }
  if (to.query.address && to.query.address != from.query.address) {
    await getGeocodeAndPutInStore(to.query.address);
    // if (import.meta.env.VITE_DEBUG) console.log('router.afterEach is calling MapStore.fillBufferForAddressOrZipcode');
    MapStore.fillBufferForAddressOrZipcode();
  } else {
    clearGeocode();
  }
  if (to.query.zipcode && to.query.zipcode != from.query.zipcode) {
    if (import.meta.env.VITE_DEBUG) console.log('router.afterEach has zipcode and is calling MapStore.fillBufferForAddressOrZipcode');
    MainStore.selectedZipcode = to.query.zipcode;
    MapStore.fillBufferForAddressOrZipcode();
  }
  if (to.query.services != from.query.services) {
    if (to.query.services && to.query.services.length) {
      MainStore.selectedServices = to.query.services.split(',');
    } else {
      MainStore.selectedServices = [];
    }
  }
  // DataStore.latestSelectedResourceFromExpand = selectedResource;
});

export default router
