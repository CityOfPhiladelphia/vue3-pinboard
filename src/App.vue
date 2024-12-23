<script setup>

if (import.meta.env.VITE_DEBUG == 'true') console.log('App.vue setup is running in debug mode');

import { useMainStore } from './stores/MainStore.js';
import { useConfigStore } from './stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { computed, getCurrentInstance, onBeforeMount, watch } from 'vue';

import { RouterView } from 'vue-router'

import isMobileDevice from './util/is-mobile-device';
import isMac from './util/is-mac'; // this can probably be removed from App.vue, and only run in main.js
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

// STORES
const ConfigStore = useConfigStore();
const $config = ConfigStore.config;
const MainStore = useMainStore();

if ($config.publicPath) {
  MainStore.publicPath = $config.publicPath;
} else {
  MainStore.publicPath = '/';
}
if (import.meta.env.VITE_DEBUG == 'true') console.log('$config.publicPath:', $config.publicPath, 'MainStore.publicPath:', MainStore.publicPath);

// ROUTER
const route = useRoute();
const router = useRouter();

const instance = getCurrentInstance();
const locale = computed(() => instance.appContext.config.globalProperties.$i18n.locale);

onBeforeMount(async () => {
  MainStore.isMobileDevice = isMobileDevice();
  MainStore.isMac = isMac();
  await router.isReady()
  if (import.meta.env.VITE_DEBUG == 'true') console.log('App onBeforeMount, route.params:', route.params, 'route.query:', route.query);

  if (route.query.lang) {
    instance.appContext.config.globalProperties.$i18n.locale = route.query.lang;
  }

  window.addEventListener('resize', handleWindowResize);
  handleWindowResize();
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

const i18nEnabled = computed(() => {
  if ($config.i18n && $config.i18n.enabled) {
    return true;
  } else {
    return false;
  }
});

const appTitle = computed(() => {
  let value;
  if ($config.app.title) {
    value = $config.app.title;
  } else if (i18nEnabled.value) {
    value = t('app.title');
  }
  return value;
});

</script>

<template>

  <div
    v-if="!MainStore.firstRouteLoaded"
    id="spinner-holder"
    class="is-flex is-justify-content-center"
  >
    <div
      id="loading-spinner"
      class="is-flex is-justify-content-center is-flex-direction-column"
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
  </div>

  <router-view></router-view>
</template>