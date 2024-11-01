<script setup>

import { useMainStore } from './stores/MainStore.js';
import { useMapStore } from './stores/MapStore.js';
import { useGeocodeStore } from './stores/GeocodeStore.js';
import { useDataStore } from './stores/DataStore.js';
import { useConfigStore } from './stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, getCurrentInstance, onMounted, onBeforeMount, watch } from 'vue';

if (import.meta.env.VITE_DEBUG == 'true') console.log('App.vue setup is running in debug mode, useDataStore:', useDataStore);

import { RouterView } from 'vue-router'

import isMobileDevice from './util/is-mobile-device';
import isMac from './util/is-mac'; // this can probably be removed from App.vue, and only run in main.js

import i18nFromFiles from './i18n/i18n.js';
const languages = i18nFromFiles.i18n.languages;

// STORES
const DataStore = useDataStore();
const MainStore = useMainStore();

if (!import.meta.env.VITE_PUBLICPATH) {
  MainStore.publicPath = '/';
} else {
  MainStore.publicPath = import.meta.env.VITE_PUBLICPATH;
}
if (import.meta.env.VITE_DEBUG == 'true') console.log('import.meta.env.VITE_PUBLICPATH:', import.meta.env.VITE_PUBLICPATH, 'MainStore.publicPath:', MainStore.publicPath);

// const test = ref(null);

// ROUTER
const route = useRoute();
const router = useRouter();

// COMPONENTS
import LocationsPanel from './components/LocationsPanel.vue';
import MapPanel from './components/MapPanel.vue';
import RefinePanel from './components/RefinePanel.vue';

const instance = getCurrentInstance();
const locale = computed(() => instance.appContext.config.globalProperties.$i18n.locale);

onBeforeMount(async () => {
  MainStore.appVersion = import.meta.env.VITE_VERSION;
  MainStore.isMobileDevice = isMobileDevice();
  MainStore.isMac = isMac();
  await router.isReady()
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('App onMounted, route.params.topic:', route.params.topic, 'route.params.address:', route.params.address);
  if (route.name === 'not-found') {
    router.push({ name: 'home' });
  }

  // const main = document.getElementById('main');
  // main.scrollTop = -main.scrollHeight;

  window.addEventListener('resize', handleWindowResize);
  handleWindowResize();

  // DataStore.fillZipcodes();
  // DataStore.fillAppType();
  // DataStore.fillResources();
  DataStore.fillHolidays();
});

const links = [
  {
    type: 'native',
    href: 'https://phila.formstack.com/forms/atlas_feedback_form',
    text: 'Feedback',
    attrs: {
      target: '_blank',
    },
  },
];

const handleWindowResize = () => {
  const rootElement = document.getElementById('app');
  const rootStyle = window.getComputedStyle(rootElement);
  const rootWidth = rootStyle.getPropertyValue('width');
  const rootHeight = rootStyle.getPropertyValue('height');
  const rootWidthNum = parseInt(rootWidth.replace('px', ''));
  const rootHeightNum = parseInt(rootHeight.replace('px', ''));

  const dim = {
    width: rootWidthNum,
    height: rootHeightNum,
  };
  MainStore.windowDimensions = dim;
}

watch(
  () => MainStore.currentLang,
  (newLang, oldLang) => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('watch MainStore.currentLang:', newLang, oldLang, 'locale.value:', locale.value);
    if (newLang != locale.value) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('setting locale:', newLang);
      // const instance = getCurrentInstance();
      if (import.meta.env.VITE_DEBUG == 'true') console.log('instance:', instance);
      if (instance) {
        if (import.meta.env.VITE_DEBUG == 'true') console.log('instance:', instance);
        if (newLang) {
          instance.appContext.config.globalProperties.$i18n.locale = newLang;
        } else {
          instance.appContext.config.globalProperties.$i18n.locale = 'en-US';
        }
      }
    }
  }
)

watch(
  () => locale.value,
  (newLocale, oldLocale) => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('watch locale:', newLocale, oldLocale);
    if (newLocale === MainStore.currentLang) {
      return;
    } else if (newLocale && newLocale != 'en-US') {
      MainStore.currentLang = newLocale;
      router.push({ query: { 'lang': newLocale }});
    } else {
      MainStore.currentLang = null;
      router.push({ fullPath: route.path });
    }
  }
)

watch(
  () => MainStore.pageTitle,
  (newPageTitle) => {
    document.title = newPageTitle;
  }
)
const appTitle = computed(() => {
  return 'Vue3 Pinboard'
  // let version = 'Atlas';
  // if (import.meta.env.VITE_VERSION == 'cityatlas'){
  //   version = 'CityAtlas';
  // }
  // return version;
})

</script>

<template>
  <router-view></router-view>
  <!-- <a
    href="#main"
    class="skip-to-main-content-link"
  >Skip to main content</a>

  <app-header
    :app-title="appTitle"
    :app-subtitle="'test'"
    app-link="/"
    :is-sticky="true"
    :is-fluid="true"
  >
    <template #mobile-nav>
      <mobile-nav :links="links" />
    </template>
    <template #lang-selector-nav>
      <lang-selector
        :languages="languages"
      />
    </template>
  </app-header>

  <main
    id="main"
    class="main-column invisible-scrollbar"
  >
    <refine-panel />

    <div class="main-row">
      <div
        v-if="!isMobileDevice() && MainStore.windowDimensions.width > 768"
        class="topics-holder"
      >
        <locations-panel />
      </div>

      <div
        class="map-panel-holder"
      >
        <map-panel />
      </div>

      <div
        v-if="isMobileDevice() || MainStore.windowDimensions.width <= 768"
        class="topics-holder"
      >
        <locations-panel />
      </div>
    </div>
  </main>

  <app-footer
    :is-sticky="true"
    :is-hidden-mobile="true"
    :links="links"
  /> -->


</template>

<style>
</style>