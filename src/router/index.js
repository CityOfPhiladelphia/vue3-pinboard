import { createRouter, createWebHistory } from 'vue-router';
import Main from '../views/Main.vue';
import PrintView from '../views/PrintView.vue';

import { useMainStore } from '../stores/MainStore.js';
import { useMapStore } from '../stores/MapStore.js';
import { useGeocodeStore } from '../stores/GeocodeStore.js';
import { useDataStore } from '../stores/DataStore.js';
import { useConfigStore } from '../stores/ConfigStore.js';

const getGeocodeAndPutInStore = async(address) => {
  const MapStore = useMapStore();
  MapStore.geolocation = null;
  const GeocodeStore = useGeocodeStore();
  const MainStore = useMainStore();
  await GeocodeStore.fillAisData(address);
  if (!GeocodeStore.aisData.features) {
    MainStore.currentAddress = null;
    MapStore.bufferForAddressOrLocationOrZipcode = null;
    if (import.meta.env.VITE_DEBUG) console.log('getGeocodeAndPutInStore, calling not-found');
    return;
  }
  MainStore.selectedZipcode = null;
  let currentAddress;
  if (GeocodeStore.aisData.features[0].properties.street_address) {
    currentAddress = GeocodeStore.aisData.features[0].properties.street_address;
  } else if (GeocodeStore.aisData.features[0].street_address) {
    currentAddress = GeocodeStore.aisData.features[0].street_address;
  }
  MainStore.setCurrentAddress(currentAddress);
}

const clearGeocode = async() => {
  const GeocodeStore = useGeocodeStore();
  const MainStore = useMainStore();
  GeocodeStore.aisData = {};
  MainStore.currentAddress = null;
}

const initData = async() => {
  if (import.meta.env.VITE_DEBUG) console.log('initData is running');
  const MainStore = useMainStore();
  if (!MainStore.firstRouteLoaded) {
    const DataStore = useDataStore();
    const ConfigStore = useConfigStore();
    const $config = ConfigStore.config;
    if ($config.agoTokenNeeded) {
      await DataStore.fillAgoToken();
    }
    await DataStore.fillAppType();
    await DataStore.fillResources();
    await DataStore.fillZipcodes();
    await DataStore.fillHolidays();
    MainStore.firstRouteLoaded = true;
  }
}

const initRouter = (publicPath) => {
  if (import.meta.env.VITE_DEBUG) console.log('router/index.js initRouter is running, publicPath:', publicPath);
  const router = createRouter({
    history: createWebHistory(publicPath),
    routes: [
      {
        path: '/',
        name: 'home',
        component: Main,
        beforeEnter: async (to, from) => {
          await initData();
        }
      },
      {
        path: '/print',
        name: 'printView',
        component: PrintView,
        beforeEnter: async (to, from) => {
          await initData();
        }
      }
    ]
  })

  router.afterEach(async (to, from) => {
    const DataStore = useDataStore();
    const MainStore = useMainStore();
    const MapStore = useMapStore();
    const GeocodeStore = useGeocodeStore();
    if (import.meta.env.VITE_DEBUG) console.log('router.afterEach to:', to, 'from:', from);
    // if (to.query.resource && to.query.resource != from.query.resource) {
    if (to.query.resource) {
      DataStore.selectedResource = to.query.resource;
    } else {
      DataStore.selectedResource = null;
    }
    if (to.query.address && to.query.address != from.query.address) {
      MainStore.selectedZipcode = null;
      await getGeocodeAndPutInStore(to.query.address);
      if (import.meta.env.VITE_DEBUG) console.log('router.afterEach is calling MapStore.fillBufferForAddressOrLocationOrZipcode, to.query.address:', to.query.address);
      if (GeocodeStore.aisData.features) {
        MapStore.fillBufferForAddressOrLocationOrZipcode();
      }
    } else if (!to.query.address || to.query.address == '') {
      clearGeocode();
    }
    if (to.query.zipcode && to.query.zipcode != from.query.zipcode) {
      if (import.meta.env.VITE_DEBUG) console.log('fillBufferForAddressOrLocationOrZipcode is running, DataStore.zipcodes.features:', DataStore.zipcodes.features);
      let zipcodesData = DataStore.zipcodes;
      let zipcode;
      if (zipcodesData) {
        zipcode = zipcodesData.features.filter(item => item.properties.CODE == to.query.zipcode)[0];
      }
      if (import.meta.env.VITE_DEBUG) console.log('router.afterEach has zipcode and is calling MapStore.fillBufferForAddressOrLocationOrZipcode');
      if (zipcode) {
        MapStore.geolocation = null;
        MainStore.selectedZipcode = to.query.zipcode;
        MapStore.fillZipcodeCenter(zipcode);
        MapStore.fillBufferForAddressOrLocationOrZipcode();
      }
    } else if (!to.query.address && !to.query.zipcode) {
      MapStore.bufferForAddressOrLocationOrZipcode = null;
    }
    if (to.query.services != from.query.services) {
      if (to.query.services && to.query.services.length) {
        MainStore.selectedServices = to.query.services.split(',');
      } else {
        MainStore.selectedServices = [];
      }
    }
    if (to.query.keyword && to.query.keyword.length) {
      MainStore.selectedKeywords = to.query.keyword.split(',');
    } else {
      MainStore.selectedKeywords = [];
    }

    MainStore.filterChangeCounter++;
  });

  return router;
};

export default initRouter;
