import { createRouter, createWebHistory } from 'vue-router';
import App from '../App.vue';
import Main from '../views/Main.vue';

import { useDataStore } from '@/stores/DataStore.js';
import { useGeocodeStore } from '@/stores/GeocodeStore.js';
import { useMainStore } from '@/stores/MainStore.js';

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


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Main
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
  if (import.meta.env.VITE_DEBUG) console.log('router.afterEach to:', to, 'from:', from);
  if (to.query.resource && to.query.resource != from.query.resource) {
    DataStore.selectedResource = to.query.resource;
  } else {
    DataStore.selectedResource = null;
  }
  if (to.query.address && to.query.address != from.query.address) {
    // DataStore.selectedAddress = to.query.address;
    getGeocodeAndPutInStore(to.query.address);
  }
  // DataStore.latestSelectedResourceFromExpand = selectedResource;
});

export default router
