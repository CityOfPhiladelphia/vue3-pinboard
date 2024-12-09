<script setup>

if (import.meta.env.VITE_DEBUG == 'true') console.log('App.vue setup is running in debug mode');

import { useMainStore } from './stores/MainStore.js';
// import { useMapStore } from './stores/MapStore.js';
// import { useGeocodeStore } from './stores/GeocodeStore.js';
import { useDataStore } from './stores/DataStore.js';
import { useConfigStore } from './stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, getCurrentInstance, onMounted, onBeforeMount, watch, nextTick } from 'vue';

if (import.meta.env.VITE_DEBUG == 'true') console.log('App.vue setup is running in debug mode, useDataStore:', useDataStore);

import { RouterView } from 'vue-router'

import isMobileDevice from './util/is-mobile-device';
import isMac from './util/is-mac'; // this can probably be removed from App.vue, and only run in main.js

import i18nFromFiles from './i18n/i18n.js';
const languages = i18nFromFiles.i18n.languages;

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

// STORES
const DataStore = useDataStore();
const MainStore = useMainStore();

const $config = useConfigStore().config;

if (!import.meta.env.VITE_PUBLICPATH) {
  MainStore.publicPath = '/';
} else {
  MainStore.publicPath = import.meta.env.VITE_PUBLICPATH;
}
if (import.meta.env.VITE_DEBUG == 'true') console.log('import.meta.env.VITE_PUBLICPATH:', import.meta.env.VITE_PUBLICPATH, 'MainStore.publicPath:', MainStore.publicPath);

// ROUTER
const route = useRoute();
const router = useRouter();

const instance = getCurrentInstance();
const locale = computed(() => instance.appContext.config.globalProperties.$i18n.locale);

const brandingImage = ref(null);
const brandingLink = ref(null);
const appLink = ref('/');

onBeforeMount(async () => {
  MainStore.appVersion = import.meta.env.VITE_VERSION;
  MainStore.isMobileDevice = isMobileDevice();
  MainStore.isMac = isMac();
  await router.isReady()
  if (import.meta.env.VITE_DEBUG == 'true') console.log('App onBeforeMount, route.params:', route.params, 'route.query:', route.query);

  if (route.query.lang) {
    instance.appContext.config.globalProperties.$i18n.locale = route.query.lang;
    // MainStore.currentLang = route.query.lang;
  }

  window.addEventListener('resize', handleWindowResize);
  handleWindowResize();

  DataStore.fillHolidays();

  if ($config.app.logoSrc) {
    brandingImage.value = {
      src: $config.app.logoSrc,
      alt: $config.app.logoAlt,
      width: $config.app.logoWidth || "200px",
    }
  }

  if ($config.appLink) {
    appLink.value = $config.appLink;
  } else {
    appLink.value = '.';
  }
});

const isMobile = computed(() => {
  return MainStore.isMobileDevice || MainStore.windowDimensions.width < 768;
});

const footerLinks = computed(() => {
  if ($config.footer) {
    let newValues = []
    for (let i of $config.footer) {
      let value = {}
      for (let j of Object.keys(i)) {
        // if (import.meta.env.VITE_DEBUG) console.log('i:', i, 'j:', j);
        if (!i18nEnabled.value || j !== "text") {
          value[j] = i[j];
        } else {
          value[j] = t(i[j]);
        }
      }
      newValues.push(value)
    }
    return newValues;
  }
});

const handleWindowResize = () => {
  const rootElement = document.getElementById('app');
  const rootStyle = window.getComputedStyle(rootElement);
  const rootWidth = rootStyle.getPropertyValue('width');
  const rootHeight = rootStyle.getPropertyValue('height');
  const rootWidthNum = parseInt(rootWidth.replace('px', ''));
  const rootHeightNum = parseInt(rootHeight.replace('px', ''));
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('handleWindowResize, rootElement:', rootElement, 'rootWidth:', rootWidth, 'rootHeight:', rootHeight, 'rootWidthNum:', rootWidthNum, 'rootHeightNum:', rootHeightNum);

  const dim = {
    width: rootWidthNum,
    height: rootHeightNum,
  };
  MainStore.windowDimensions = dim;
}

watch(
  () => locale.value,
  (newLocale, oldLocale) => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('watch locale:', newLocale, oldLocale);
    let startQuery = { ...route.query };

    delete startQuery['lang'];
    if (import.meta.env.VITE_DEBUG) console.log('watch i18nLocale, startQuery:', startQuery);

    if (newLocale !== 'en-US') {
      let query = { 'lang': newLocale };
      router.push({ query: { ...startQuery, ...query }});
    } else {
      router.push({ query: { ...startQuery }});
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
  let value;
  if ($config.app.title) {
    value = $config.app.title;
  } else if (i18nEnabled.value) {
    // if (import.meta.env.VITE_DEBUG) console.log('t("app.title"):', t('app.title'));
    value = t('app.title');
  }
  return value;
});

const appSubTitle = computed(() => {
  let value;
  if (!isMobile.value) {
    if ($config.app.subtitle) {
      value = $config.app.subtitle;
    } else if (i18nEnabled.value) {
      // if (import.meta.env.VITE_DEBUG) console.log('t("app.subtitle"):', t('app.subtitle'));
      value = t('app.subtitle'); 
    }
  }
  return value;
});

const i18nEnabled = computed(() => {
  if ($config.i18n && $config.i18n.enabled) {
    return true;
  } else {
    return false;
  }
});

const i18nLanguages = computed(() => {
  let values = [];
  // if (import.meta.env.VITE_DEBUG) console.log('i18nLanguages, $config.i18n:', $config.i18n);
  if ($config.i18n.languages) {
    values = $config.i18n.languages;
  }
  return values;
});

</script>

<template>
  
  <app-header
    :app-title="appTitle"
    :app-subtitle="appSubTitle"
    :app-link="appLink"
    :is-sticky="true"
    :is-fluid="true"
    :branding-image="brandingImage"
    :branding-link="brandingLink"
    >
    <template #mobile-nav>
      <mobile-nav :links="footerLinks" />
    </template>
    
    <template
      v-if="i18nEnabled"
      #lang-selector-nav
    >
      <lang-selector
        v-if="i18nEnabled"
        :languages="i18nLanguages"
      />
    </template>
  </app-header>

  <main id="main" class="main invisible-scrollbar">
    
    <div
      v-if="MainStore.firstRouteLoaded === false"
      id="loading-spinner"
      class="is-flex is-justify-content-center is-align-items-center is-flex-direction-column"
    >
      <font-awesome-icon
        icon="fa-solid fa-spinner"
        class="fa-6x center-spinner"
        spin
      />
      <div class="mt-6">
        Loading {{ appTitle.toLowerCase() }}
      </div>
    </div>

    <router-view></router-view>

  </main>

  <app-footer
    :is-sticky="true"
    :is-hidden-mobile="true"
    :links="footerLinks"
  >
  </app-footer>

</template>

<style>

</style>