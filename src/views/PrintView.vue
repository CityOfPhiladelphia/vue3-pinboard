<script setup>

import { ref, computed, onMounted } from 'vue';

import { useMainStore } from '../stores/MainStore.js';
const MainStore = useMainStore();
import { useDataStore } from '../stores/DataStore.js';
const DataStore = useDataStore();
import { useConfigStore } from '../stores/ConfigStore.js';
const ConfigStore = useConfigStore();
const $config = ConfigStore.config;

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const ExpandCollapseContent = $config.customComps.expandCollapseContent;

const locationOpen = ref(false);

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

// computed

const isMobile = computed(() => {
  return MainStore.windowDimensions.width < 768;
});

const printCheckboxes = computed(() =>{
  return MainStore.printCheckboxes;
});

const database = computed(() => {
  let value = {}
  if (DataStore.sources[DataStore.appType]) {
    // if (import.meta.env.VITE_DEBUG) console.log('DataStore.appType:', DataStore.appType, 'DataStore.sources[DataStore.appType]:', DataStore.sources[DataStore.appType]);
    value = DataStore.sources[DataStore.appType].data.rows || DataStore.sources[DataStore.appType].data.features || DataStore.sources[DataStore.appType].features;
  }
  return value;
});

const items = computed(() => {
  let filteredData;
  if (database.value) {
    if (import.meta.env.VITE_DEBUG) console.log('in PrintView.vue items computed, database.value:', database.value);
    filteredData = database.value.filter(item => {
      // if (import.meta.env.VITE_DEBUG) console.log('in PrintView.vue items computed, item._featureId:', item._featureId, 'printCheckboxes.value:', printCheckboxes.value, 'printCheckboxes.value.includes(item._featureId):', printCheckboxes.value.includes(item._featureId));
      return printCheckboxes.value.includes(item._featureId)
    });
  }
  return filteredData;
});

onMounted(async () => {
  if (printCheckboxes.value.length === 0) {
    router.push({ name: 'home' });
  } else {
    setTimeout(() => {
      window.print();
    }, 500);
  }
});

// methods

const clickedBackToHome = () => {
  // if (import.meta.env.VITE_DEBUG) console.log('clickedBackToHome is running');
  router.go(-1);
};

const parseAddress = (address) => {
  const formattedAddress = address.replace(/(Phila.+)/g, city => `<div>${city}</div>`).replace(/^\d+\s[A-z]+\s[A-z]+/g, lineOne => `<div>${lineOne}</div>`).replace(/,/, '');
  return formattedAddress;
};

const parseServiceList = (list) => {
  const formattedService = list;
  return formattedService;
};

const parseTagsList = (list) => {
  const formattedTags = list.slice().sort().join(", ");
  return formattedTags;
};

const makeValidUrl = (url) => {
  let newUrl = window.decodeURIComponent(url);
  newUrl = newUrl
    .trim()
    .replace(/\s/g, '');
  if (/^(:\/\/)/.test(newUrl)) {
    return `http${newUrl}`;
  }
  if (!/^(f|ht)tps?:\/\//i.test(newUrl)) {
    return `http://${newUrl}`;
  }
  return newUrl;
};

const getSiteName = (item) => {
  if (!item) {
    return;
  }
  let valOrGetter = $config.locationInfo.siteName;
  const valOrGetterType = typeof valOrGetter;
  let val;

  let currentQuery = { ...route.query };
  let currentQueryKeys = Object.keys(currentQuery);

  if (valOrGetterType === 'function') {
    const getter = valOrGetter;
    if (currentQueryKeys.includes('address') || currentQueryKeys.includes('zipcode')) {
      if (item && item.distance) {
        val = '(' + item.distance.toFixed(2) + 'miles) ' + getter(item);
      } else {
        val = getter(item);
      }
    } else {
      if (item) {
        val = getter(item);
      }
    }
  } else {
    if (currentQueryKeys.includes('address')) {
      if (item.distance) {
        val = item.distance.toFixed(2) + ' miles - ' + item[valOrGetter];
      } else {
        val = item[valOrGetter];
      }
    } else {
      val = item[valOrGetter];
    }
  }
  return val;
};

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
    // if (import.meta.env.VITE_DEBUG) console.log('t("app.title"):', t('app.title'));
    value = t('app.title');
  }
  return value;
});

const appSubTitle = computed(() => {
  let value;
  if (!isMobile.value) {
    if ($config.app.subtitle && $config.app.subtitle != 'i18n') {
      value = $config.app.subtitle;
    } else if (i18nEnabled.value && $config.app.subtitle == 'i18n') {
      // if (import.meta.env.VITE_DEBUG) console.log('t("app.subtitle"):', t('app.subtitle'));
      value = t('app.subtitle'); 
    }
  }
  return value;
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
    :is-sticky="false"
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

  <div
    id="print-view"
    class="print-view invisible-scrollbar"
  >
    <div
      class="loc-item open"
    >
      <div class="back-link no-print">
        <a @click="clickedBackToHome">
          < {{ $t('back') }}
        </a>
      </div>

      <!-- <div class="map-holder">
        <map-panel
          :view="'print'"
        />
      </div> -->
      <!-- @handle-search-form-submit="handleSubmit"
      @clear-search="clearSearchTriggered"
      @toggleMap="toggleMap" -->

      <!-- class="component-holder card-content" -->
      <div
        class="container single-item"
        v-for="item of items"
      >
        <div
          class="columns location-row is-mobile"
          tabindex="0"
        >
          <div class="location-title column is-11">
            <h2
              class="h5"
              :aria-expanded="locationOpen"
            >
              {{ getSiteName(item) }}
            </h2>
          </div>
        </div>
        <expand-collapse-content
          v-if="$config.customComps && Object.keys($config.customComps).includes('expandCollapseContent')"
          :item="item"
        />
        <div
          v-if="!Object.keys($config.customComps).includes('expandCollapseContent')"
          class="main-ec-content"
        >
          <div class="columns">
            <div class="column is-6">
              <div
                v-if="item.properties.street_address"
                class="columns is-mobile"
              >
                <div class="column is-1">
                  <font-awesome-icon icon="map-marker-alt" />
                </div>
                <div
                  class="column is-11"
                  v-html="parseAddress(item.properties.street_address)"
                >
                </div>
              </div>
            </div>

            <div class="column is-6">

              <div
                v-if="item.properties.phone_number"
                class="columns is-mobile"
              >
                <div
                  class="column is-1"
                >
                  <font-awesome-icon icon="phone" />
                </div>
                <div class="column is-11">
                  {{ item.properties.phone_number }}
                </div>
              </div>

              <div
                v-if="item.properties.email"
                class="columns is-mobile"
              >
                <div
                  class="column is-1"
                >
                  <font-awesome-icon icon="envelope" />
                </div>
                <div class="column is-11">
                  <a :href="`mailto:${item.properties.email}`">{{ item.properties.email }}</a>
                </div>
              </div>

              <div
                v-if="item.properties.website"
                class="columns is-mobile website-div"
              >
                <div
                  class="column is-1"
                >
                  <font-awesome-icon icon="globe" />
                </div>
                <div class="column is-11">
                  <a
                    target="_blank"
                    :href="makeValidUrl(item.properties.website)"
                  >
                    {{ item.properties.website }}
                    <font-awesome-icon icon="external-link-alt" />
                  </a>
                </div>
              </div>

              <div
                v-if="item.properties.facebook_name"
                class="columns is-mobile"
              >
                <div
                  class="column is-1"
                >
                  <font-awesome-icon :icon="['fab', 'facebook']" />
                </div>
                <div class="column is-11">
                  <a
                    target="_blank"
                    :href="item.properties.facebook_name"
                  >
                    Facebook
                  </a>
                </div>
              </div>

              <div
                v-if="item.properties.twitter"
                class="columns is-mobile"
              >
                <div
                  class="column is-1"
                >
                  <font-awesome-icon :icon="['fab', 'twitter']" />
                </div>
                <div class="column is-11">
                  <a
                    target="_blank"
                    :href="item.properties.twitter"
                  >
                    Twitter
                  </a>
                </div>
              </div>
            </div>

          </div>

          <div
            v-if="item.properties.services_offered"
          >
            <h3>
              Services offered
            </h3>
            <div class="columns is-multiline is-gapless">
              <div
                v-for="i in parseServiceList(item.properties.services_offered)"
                :key="i"
                class="column is-half"
              >
                {{ i }}
              </div>
            </div>
          </div>

          <div
            v-if="item.properties.tags && item.properties.tags.length"
          >
            <h3>
              Tags
            </h3>
            <div>
              {{ parseTagsList(item.properties.tags) }}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

</template>

<style scoped>

.single-item {
  margin-bottom: 2rem !important;
}

.location-row {
  background-color: #2176d2;
  color: white;
  padding: 0px;
  margin-top: 0px !important;
  margin-bottom: 0px !important;
  margin-left: 0px !important;
  margin-right: 0px !important;
  font-weight: 900 !important;
}

.location-title {
  padding-top: 1rem !important;
  padding-bottom: 1rem !important;
  padding-left: 1rem !important;
  padding-right: 1rem !important;
  font-weight: 900 !important;
}

h2 {
  font-weight: 900 !important;
}

.back-link {
  padding-left: 30px;
  padding-top: 10px;
  padding-bottom: 10px;
}

</style>
