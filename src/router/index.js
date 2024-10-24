import { createRouter, createWebHistory } from 'vue-router';
import App from '../App.vue';
import Main from '../views/Main.vue';

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
  const MainStore = useMainStore();
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
  if (to.query.zipcode && to.query.zipcode != from.query.zipcode) {
    MainStore.selectedZipcode = to.query.zipcode;
  }
  if (to.query.services && to.query.services != from.query.services) {
    MainStore.selectedServices = to.query.services.split(',');
  }
  // DataStore.latestSelectedResourceFromExpand = selectedResource;
});

export default router
