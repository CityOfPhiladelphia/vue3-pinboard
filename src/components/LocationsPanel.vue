
<script setup>

import { useMainStore } from '../stores/MainStore.js';
import { useMapStore } from '../stores/MapStore.js';
import { useGeocodeStore } from '../stores/GeocodeStore.js';
import { useDataStore } from '../stores/DataStore.js';
import { useConfigStore } from '../stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, getCurrentInstance, onMounted, watch, onBeforeMount } from 'vue';

// import { Dropdown } from '@phila/phila-ui';
// import SingleCheckbox from './SingleCheckbox.vue';
// import PrintShareSection from '@phila/pinboard/src/components/PrintShareSection';

const MainStore = useMainStore();
const MapStore = useMapStore();
const GeocodeStore = useGeocodeStore();
const DataStore = useDataStore();

// import AddressSearchControl from './AddressSearchControl.vue';
import PrintShareSection from './PrintShareSection.vue';
import ExpandCollapse from './ExpandCollapse.vue';

const ConfigStore = useConfigStore();
const $config = ConfigStore.config;
const ExpandCollapseContent = $config.customComps.expandCollapseContent;
const CustomGreeting = $config.customComps.customGreeting;

const version = import.meta.env.VITE_VERSION;

const route = useRoute();
const router = useRouter();

const address = computed(() => MainStore.currentAddress);

const instance = getCurrentInstance();
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const $emit = defineEmits([ 'clear-bad-address' ]);

// const zipCode = computed(() => {
//   if (GeocodeStore.aisData && GeocodeStore.aisData.features) {
//     return GeocodeStore.aisData.features[0].properties.zip_code + '-' + GeocodeStore.aisData.features[0].properties.zip_4;
//   }
//   return '';
// });

const currentItems = computed(() => {
  return DataStore.covidFreeMealSites.features;
});

const props = defineProps({
  isMapVisible: {
    type: Boolean,
    default: true,
  },
});

// DATA
const searchDistance = ref(null);
const sortBy = ref('Alphabetically');
const printCheckboxes = ref([]);
const selectAllCheckbox = ref(false);

// onBeforeMount(async () => {
//   if (route.query || !$config.greeting && (!$config.customComps || !$config.customComps.customGreeting)) {
//     MainStore.shouldShowGreeting = false;
//   }
// })

onMounted(async () => {
  if (import.meta.env.VITE_DEBUG) console.log('LocationsPanel.vue mounted, $config:', $config, 'i18nLocale.value:', i18nLocale.value, 'route.query:', route.query);
  if (Object.keys(route.query).length || !$config.greeting && (!$config.customComps || !$config.customComps.customGreeting)) {
    MainStore.shouldShowGreeting = false;
  }

  let value, valueWithMiles;
  if ($config.searchBar.searchDistance && $config.searchBar.searchDistance != 1) {
    value = $config.searchBar.searchDistance;
    // valueWithMiles = $config.searchBar.searchDistance + ' ' + $i18n.messages[i18nLocale.value]['miles'];
    valueWithMiles = $config.searchBar.searchDistance + ' ' + t('miles');
  } else {
    value = 1;
    // valueWithMiles = 1 + ' ' + $i18n.messages[i18nLocale.value]['mile'];
    valueWithMiles = 1 + ' ' + t('mile');
  }
  searchDistance.value = valueWithMiles;
  MapStore.searchDistance = value;

  printCheckboxes.value = MainStore.printCheckboxes;
});




// COMPUTED
const tagsPhrase = computed(() => {
  let value;
  if ($config.locationInfo.tagsPhrase) {
    value = $config.locationInfo.tagsPhrase;
  } else {
    value = 'Tags';
  }
  return value;
});

const searchDistanceOptions = computed(() => {
  return [
    // '1 ' + $i18n.messages[i18nLocale.value]['mile'],
    '1 ' + t('mile'),
    '2 ' + t('miles'),
    '3 ' + t('miles'),
    '4 ' + t('miles'),
    '5 ' + t('miles')
  ];
});

const anySearch = computed(() => {
  let value = true;
  if (Object.keys($config).includes('anySearch')) {
    value = $config.anySearch
  } //else {
  //   value = true;
  // }
  return value;
});

const showPrintAndShare = computed(() => {
  let value = false;
  if (route.name == 'home') {
    value = true;
  }
  return value;
});

const sortByOptions = computed(() => {
  let value = {};
  value.Alphabetically = t('alphabetically');
  value.Distance = t('distance');
  return value;
});

const allowPrint = computed(() => {
  let value = false;
  if ($config.allowPrint) {
    value = true;
  }
  return value;
});

const database = computed(() => {
  let value = {}
  if (DataStore.sources[DataStore.appType]) {
    // if (import.meta.env.VITE_DEBUG) console.log('DataStore.appType:', DataStore.appType, 'DataStore.sources[DataStore.appType]:', DataStore.sources[DataStore.appType]);
    value = DataStore.sources[DataStore.appType].data.rows || DataStore.sources[DataStore.appType].data.features || DataStore.sources[DataStore.appType].data;
  }
  return value;
});

// const database = computed(() => {
//   console.log('DataStore.appType:', DataStore.appType);
//   // console.log('DataStore.appType:', DataStore.appType, 'DataStore.sources:', DataStore.sources);
//   if (DataStore.appType) {
//     if (DataStore.sources[DataStore.appType].data.rows) {
//       return DataStore.sources[DataStore.appType].data.rows;
//     } else if (DataStore.sources[DataStore.appType].data.features) {
//       return DataStore.sources[DataStore.appType].data.features;
//     } else if (DataStore.sources[DataStore.appType].data) {
//       return DataStore.sources[DataStore.appType].data;
//     }
//   }
//   // return DataStore.sources[DataStore.appType].data.rows || DataStore.sources[DataStore.appType].data.features || DataStore.sources[DataStore.appType].data;
// });

const databaseLength = computed(() => {
  return database.value.length
});

const refineList = computed(() => {
  return MainStore.refineList;
});

const summarySentenceStart = computed(() => {
  let sentence = t('showing') + ' ' + currentData.value.length + ' ' + t('outOf') + ' ' + databaseLength.value + ' ' + t('results');
  if (selectedKeywords.value.length || zipcodeEntered.value || addressEntered.value || selectedServices.value.length) {
    sentence += ' ' + t('for') + ' ';
  }
  return sentence;
});

const summarySentenceEnd = computed(() => {
  let sentence = '';
  if (selectedKeywords.value.length) {
    for (let keyword of selectedKeywords.value) {
      sentence += '"' + keyword + '"';
      if (zipcodeEntered.value || addressEntered.value || selectedServices.value.length) {
        sentence += ' : ';
      }
    }
  }
  if (zipcodeEntered.value) {
    sentence += zipcodeEntered.value;

    sentence += ' - ';
    sentence += searchDistance.value;

    // let word;
    // if (searchDistance.value == 1) {
    //   word = ' ' + $i18n.messages[i18nLocale.value]['mile'];
    // } else {
    //   word = ' ' + $i18n.messages[i18nLocale.value]['miles'];
    // }
    // sentence += word;

    if (selectedServices.value.length) {
      sentence += ' : ';
    }
  }
  if (addressEntered.value) {
    sentence += addressEntered.value;
    sentence += ' - ';
    sentence += searchDistance.value;

    // let word;
    // if (searchDistance.value == 1) {
    //   word = ' ' + $i18n.messages[i18nLocale.value]['mile'];
    // } else {
    //   word = ' ' + $i18n.messages[i18nLocale.value]['miles'];
    // }
    // sentence += word;
    
    if (selectedServices.value.length) {
      sentence += ' : ';
    }
  }
  if (selectedServices.value.length) {
    if (typeof selectedServices.value == 'string') {
      // if (import.meta.env.VITE_DEBUG) console.log('t(selectedServices.value):', t(selectedServices.value));
      sentence += t(selectedServices.value);
    } else {
      if (Array.isArray(refineList.value)) {
        for (let service of selectedServices.value) {
          sentence += service;
          if (selectedServices.value.indexOf(service) < selectedServices.value.length-1) {
            sentence += ' : ';
          }
        }
      } else {
        for (let service of selectedServices.value) {
          // if (import.meta.env.VITE_DEBUG) console.log('in summarySentenceEnd, if else for service:', service);
          let refineList = MainStore.refineList;
          for (let key of Object.keys(refineList)) {
            for (let key2 of Object.keys(refineList[key])) {
              if (key2 === 'radio' || key2 === 'checkbox') {
                for (let key3 of Object.keys(refineList[key][key2])) {
                  if (refineList[key][key2][key3].unique_key == service) {
                    // if (import.meta.env.VITE_DEBUG) console.log('key:', key, 'key3:', key3, 'key[key3]:', key[key3]);
                    sentence += t(key+"."+key3);//.toLowerCase();
                  }
                }
              }
            }
          }
          if (selectedServices.value.indexOf(service) < selectedServices.value.length-1) {
            sentence += ' : ';
          }
        }
      }
    }
  }
  return sentence;
});

const i18nLocale = computed(() => {
  return instance.appContext.config.globalProperties.$i18n.locale;
});

const zipcodeEntered = computed(() => {
  return MainStore.selectedZipcode;
});

const geocode = computed(() => {
  return GeocodeStore.aisData;
});

const addressEntered = computed(() => {
  let address;
  let routeAddress = route.query.address;
  if (import.meta.env.VITE_DEBUG) console.log('addressEntered computed, routeAddress:', routeAddress);
  if (geocode.value && geocode.value.properties && geocode.value.properties.street_address) {
    address = geocode.value.properties.street_address;
  } else if (routeAddress) {
    address = routeAddress;
  }
  return address;
});

const watchPositionOn = computed(() => {
  return MapStore.watchPositionOn;
});

const shouldShowGreeting = computed(() => {
  return MainStore.shouldShowGreeting;
});

const i18nEnabled = computed(() => {
  let value;
  if ($config.i18n && $config.i18n.enabled) {
    value = true;
  } else {
    value = false;
  }
  return value;
});

const hasCustomGreeting = computed(() => {
  let value = false;
  if ($config.customComps) {
    value = Object.keys($config.customComps).includes('customGreeting');
  }
  return value;
});

const greetingText = computed(() => {
  let value;
  if ($config.greeting) {
    value = $config.greeting.message;
  } else {
    value = null;
  }
  return value;
});

const greetingOptions = computed(() => {
  let value;
  if ($config.greeting) {
    value = $config.greeting.options;
  } else {
    value = {};
  }
  return value;
});

const zipcode = computed(() => {
  return MainStore.selectedZipcode;
});

const geocodeStatus = computed(() => {
  if (GeocodeStore.aisData.features && GeocodeStore.aisData.features.length) {
    return 'success';
  } else if (GeocodeStore.aisData.status == 404) {
    return 'error';
  } else if (!GeocodeStore.aisData.features) {
    return 'none';
  }
});

const zipcodeCenter = computed(() => {
  return MapStore.zipcodeCenter;
});

const sortDisabled = computed(() => {
  let value;
  let geocode, zipCenter, watchPos;
  if (geocodeStatus.value) {
    geocode = geocodeStatus.value;
  }
  if (zipcodeCenter.value) {
    zipCenter = zipcodeCenter.value;
  }
  if (watchPositionOn.value) {
    watchPos = watchPositionOn.value;
  }
  // if (import.meta.env.VITE_DEBUG) console.log('computed sortDisabled, geocode:', geocode, 'zipcodeCenter:', zipcodeCenter);
  if (geocode || zipCenter[0] || watchPos) {
    value = false;
  } else {
    value = true;
  }
  return value;
});

const isMobile = computed(() => {
  return MainStore.isMobileDevice;
})

const selectedKeywords = computed(() => {
  return MainStore.selectedKeywords;
});

const selectedServices = computed(() => {
  return MainStore.selectedServices;
});

const selectedResource = computed(() => {
  return DataStore.selectedResource;
});

const currentData = computed(() => {
  let locations = [...DataStore.currentData];

  let valOrGetter = locationInfo.value.siteName;
  const valOrGetterType = typeof valOrGetter;
  let val;

  // if (import.meta.env.VITE_DEBUG) console.log('LocationsPanel.vue, currentData, sortBy.value:', sortBy.value, 'locations:', locations, 'valOrGetter:', valOrGetter, 'valOrGetterType:', valOrGetterType);

  if (sortBy.value == 'Distance') {
    if (import.meta.env.VITE_DEBUG) console.log('LocationsPanel.vue currentData computed, sortBy.value:', sortBy.value);
    val = 'distance';
    // if (import.meta.env.VITE_DEBUG) console.log('it includes address');
    locations.sort(function(a, b) {
      if (import.meta.env.VITE_DEBUG) console.log('a:', a, 'b:', b, 'val:', val);
      if (a[val] < b[val]) {
        return -1;
      }
      if (a[val] > b[val]) {
        return 1;
      }
      return 0;
    });
  } else {
    if (import.meta.env.VITE_DEBUG) console.log('LocationsPanel.vue currentData computed, sortBy.value:', sortBy.value);
    if (valOrGetterType === 'function') {
      const getter = valOrGetter;
      locations.sort(function(a, b) {
        let valueA = getter(a);
        let valueB = getter(b);
        let value;
        if (valueA && valueB) {
          value = valueA.localeCompare(valueB, undefined, { numeric: true });
        }
        return value;
      });
    } else {
      val = valOrGetter;
      locations.sort(function(a, b) {
        // if (import.meta.env.VITE_DEBUG) console.log('a:', a, 'b:', b, 'val:', val);
        if (a[val] != null && b[val] != null) {
          return a[val].localeCompare(b[val]);
        }
      });
    }
  }
  return locations;
});

const currentDataList = computed(() => {
  return currentData.value.map(row => row._featureId);
});

const dataStatus = computed(() => {
  let value;
  if (DataStore.sources[$config.app.type]) {
    value = DataStore.sources[$config.app.type].status;
  }
  return 'success';
});

const locationInfo = computed(() => {
  return $config.locationInfo;
});

const noLocations = computed(() => {
  return t('noLocations');
});

const copiedUrl = computed(() => {
  return t('copiedUrl');
});

const loadingSources = computed(() => {
  return DataStore.loadingSources;
});

watch(
  () => i18nLocale,
  async nexti18nLocale => {
    let value = searchDistance.value.split(' ')[0];
    if (import.meta.env.VITE_DEBUG) console.log('i18nLocale change, nexti18nLocale:', nexti18nLocale, 'value:', value);
    if (value == 1) {
      searchDistance.value = value + ' ' + t('mile');
    } else {
      searchDistance.value = value + ' ' + t('miles');
    }
  }
);

watch(
  () => searchDistance.value,
  async nextSearchDistance => {
    if (import.meta.env.VITE_DEBUG) console.log('watch searchDistance, nextSearchDistance:', nextSearchDistance, 'parseInt(nextSearchDistance):', parseInt(nextSearchDistance));
    MapStore.searchDistance = parseInt(nextSearchDistance);
    // if (GeocodeStore.aisData.features) {
    //   MapStore.fillBufferForAddress();
    // }
  }
);

watch(
  () => selectAllCheckbox,
  async nextSelectAllCheckbox => {
    if (import.meta.env.VITE_DEBUG) console.log('watch selectAllCheckbox, nextSelectAllCheckbox:', nextSelectAllCheckbox);
    if (nextSelectAllCheckbox == false) {
      printCheckboxes.value = [];
      let inputs = document.querySelectorAll('.location-checkbox');
      // if (import.meta.env.VITE_DEBUG) console.log('inputs:', inputs);
      for (var i = 0; i < inputs.length; i++) {
        inputs[i].checked = false;
      }
    } else {
      printCheckboxes.value = currentDataList.value;
      let inputs = document.querySelectorAll('.location-checkbox');
      // if (import.meta.env.VITE_DEBUG) console.log('inputs:', inputs);
      for (var i = 0; i < inputs.length; i++) {
        inputs[i].checked = true;
      }
    }
    MainStore.printCheckboxes = printCheckboxes.value;
  }
);

watch(
  () => route.query,
  async nextRoute => {
    if (import.meta.env.VITE_DEBUG) console.log('LocationsPanel watch route, nextRoute:', nextRoute);
    MainStore.shouldShowGreeting = false;
  }
)

// watch(
//   () => zipcode,
//   async nextZipcode => {
//     MainStore.shouldShowGreeting = false;
//   }
// );

watch(
  () => geocodeStatus,
  async nextGeocodeStatus => {
    // MainStore.shouldShowGreeting = false;
    if (nextGeocodeStatus == null) {
      sortBy.value = 'Alphabetically';
    } else {
      sortBy.value = 'Distance';
    }
  }
)

watch(
  () => zipcodeCenter,
  async nextZipcodeCenter => {
    if (nextZipcodeCenter[0]) {
      sortBy.value = 'Distance';
    } else {
      sortBy.value = 'Alphabetically';
    }
  }
);

// watch(
//   () => selectedKeywords,
//   async nextSelectedKeywords => {
//     // if (import.meta.env.VITE_DEBUG) console.log('watch, nextSelectedKeywords:', nextSelectedKeywords);
//     MainStore.shouldShowGreeting = false;
//   }
// );

// watch(
//   () => selectedServices,
//   async nextSelectedServices => {
//     // if (import.meta.env.VITE_DEBUG) console.log('watch, nextSelectedServices:', nextSelectedServices);
//     if (nextSelectedServices.length) {
//       MainStore.shouldShowGreeting = false;
//     }
//   }
// );

// watch(
//   () => selectedResource,
//   async nextselectedResource => {
//     // if (import.meta.env.VITE_DEBUG) console.log('watch, nextselectedResource:', nextselectedResource);
//     MainStore.shouldShowGreeting = false;
//   }
// );


// METHODS
const clickedShare = () => {
  if (import.meta.env.VITE_DEBUG) console.log('clickedShare is running');
  var dummy = document.createElement('input'),
    text = window.location.href;

  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand('copy');
  document.body.removeChild(dummy);

  this.$success(copiedUrl.value, {
    duration: 3000,
    closeOnClick: true,
  });
};

const clearBadAddress = () => {
  $emit('clear-bad-address');
};

// clickedSinglePrint(item) {
//   if (import.meta.env.VITE_DEBUG) console.log('clickedSinglePrint is running');
//   store.commit('setPrintCheckboxes', [ item._featureId ]);
//   router.push({ name: 'printView'  });
// },

const clickedPrint = () => {
  MainStore.selectedZipcode = null;
  if (import.meta.env.VITE_DEBUG) console.log('clickedPrint is running');
  if (!printCheckboxes.value.length) {
    this.$warning(noLocations.value, {
      duration: 3000,
      closeOnClick: true,
    });
    return;
  }
  router.push({ name: 'printView'  });
};

const printBoxChecked = (id) => {
  if (import.meta.env.VITE_DEBUG) console.log('LocationsPanel printBoxChecked, id:', id);
  if (printCheckboxes.value.includes(id)) {
    printCheckboxes.value.splice(printCheckboxes.value.indexOf(id), 1);
    MainStore.printCheckboxes = printCheckboxes.value;
  } else {
    printCheckboxes.value.push(id);
    MainStore.printCheckboxes = printCheckboxes.value;
  }
};

const clickedSelectAll = () => {
  if (import.meta.env.VITE_DEBUG) console.log('LocationsPanel clickedSelectAll is running');
  if (selectAllCheckbox.value) {
    if (import.meta.env.VITE_DEBUG) console.log('clickedSelect all if');
    selectAllCheckbox.value = false;
  } else {
    if (import.meta.env.VITE_DEBUG) console.log('clickedSelect all else');
    selectAllCheckbox.value = true;
  }
};

const clickedViewList = () => {
  MainStore.shouldShowGreeting = false;
  // $gtag.event('click', {
  //   'event_category': store.state.gtag.category,
  //   'event_label': 'view list',
  // });
};

const getLocationsList = () => {
  const locations = sources.value[$config.app.type].data.rows;
  return locations;
};

// TODO: handle edge cases
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

</script>

<template>
  <div id="locations-panel-content" class="locations">

    <div
      v-if="shouldShowGreeting"
      class="topics-container cell medium-cell-block-y"
    >
      <custom-greeting
        v-if="shouldShowGreeting && hasCustomGreeting"
        @view-list="clickedViewList"
      />
      
    </div>

    <div
      v-if="!shouldShowGreeting && loadingSources"
      class="columns is-vcentered is-align-content-center has-text-centered loading-data"
    >
      <!-- Loading Data -->
      <div class="column">
        <font-awesome-icon
          icon="fa-solid fa-spinner"
          class="fa-6x center-spinner"
          spin
        />
      </div>
      <!-- <div>Loading Data</div> -->
    </div>

    <div
      v-if="!shouldShowGreeting && !loadingSources && dataStatus === 'success'"
      class="summary-and-location-container"
    >
      
      <div class="summary-container">
        <div
          v-if="!isMobile && geocodeStatus !== 'error' > 0"
          class="columns is-desktop cut-right mb-0"
        >
          <div
            v-if="allowPrint"
            class="column is-6-desktop is-12-tablet mr-0 mb-0 pb-0 columns loc-panel-widget"
          >
            <div class="field column is-6 pt-5">
              <input
                class="is-checkradio location-checkbox"
                id="locationsPanelCheckbox"
                type="checkbox"
                name="locationsPanelCheckbox"
                @click="clickedSelectAll"
              >
              <label for="locationsPanelCheckbox">
                <span
                  v-if="!i18nEnabled"
                >
                  Select All
                </span>
                <span
                  v-if="i18nEnabled"
                  v-html="$t('selectAll')"
                />
              </label>
            </div>
            <div class="column is-6 pt-3">
              <button
                @click="clickedPrint"
                class="button app-button"
                :class="!printCheckboxes.length ? 'disabled' : '' "
              >
                <p
                  v-if="!i18nEnabled"
                >
                  Print
                </p>
                <p
                  v-if="i18nEnabled"
                  v-html="$t('print')"
                />
            </button>
            </div>
          </div>

          <div
            v-if="anySearch"
            class="column is-6-desktop is-12-tablet mr-0 mb-0 pb-0 pr-0 columns loc-panel-widget"
          >
            <div
              class="column is-6-tablet is-7-desktop p-0"
            >
              <dropdown
                v-model="sortBy"
                :options="sortByOptions"
                :placeholder="$t('sortBy')"
                :disabled="sortDisabled"
              />
            </div>
            <div
              class="column is-6-tablet is-5-desktop p-0"
            >
              <dropdown
                v-model="searchDistance"
                :options="searchDistanceOptions"
                :placeholder="$t('distance')"
                :disabled="sortDisabled"
              />
            </div>
          </div>
        </div>

        <div
          v-if="isMobile && geocodeStatus !== 'error'"
          class="columns is-mobile mb-0"
        >
          <div
            class="mb-1 p-0 mobile-dropdown-container column is-6"
          >
            <dropdown
              v-model="sortBy"
              :options="sortByOptions"
              placeholder="Sort By"
              :disabled="sortDisabled"
            />
          </div>
          <div
            class="mb-1 p-0 mobile-dropdown-container column is-6"
          >
            <dropdown
              v-model="searchDistance"
              :options="searchDistanceOptions"
              placeholder="Distance"
              :disabled="sortDisabled"
            />
          </div>
        </div>

        <div
          v-if="geocodeStatus !== 'error'"
          class="mt-2 mb-2"
        >
          {{ summarySentenceStart }} <b><i>{{ summarySentenceEnd }}</i></b>
        </div>
      </div>

      <div
        v-if="geocodeStatus === 'error'"
        class="h3 no-results"
      >
        <p class="pb-4">The address that was searched is not a valid Philadelphia address.</p>
        <button
          class="button app-button is-vcentered"
          @click="clearBadAddress"
        >
          Clear Address
        </button>
      </div>
      <div
        v-if="geocodeStatus !== 'error' && currentData.length === 0"
        class="h3 no-results"
      >
        <p
          v-if="!i18nEnabled"
        >
          We're sorry, there are no results for that search.
          Adjust the filters you've selected and try again.
        </p>
        <p
          v-if="i18nEnabled"
          v-html="$t('app.noResults')"
        />
      </div>

      <div
        v-if="geocodeStatus !== 'error'"
        class="location-container"
      >
      
        <div
          v-for="item in currentData"
          :key="item._featureId"
        >
          <expand-collapse
            :item="item"
            :is-map-visible="isMapVisible"
            :checked="selectAllCheckbox"
            @print-box-checked="printBoxChecked"
          >

          <!-- v-if="$config.customComps && Object.keys($config.customComps).includes('expandCollapseContent') && item._featureId == DataStore.selectedResource" -->
            <expand-collapse-content
              v-if="item._featureId == DataStore.selectedResource"
              :item="item"
              :is-map-visible="isMapVisible"
            />

            <div
              v-if="!$config.customComps || !Object.keys($config.customComps).includes('expandCollapseContent') && item._featureId == DataStore.selectedResource"
              :class="isMobile ? 'main-content-mobile' : 'main-content'"
            >
              <print-share-section
                :item="item"
              >
              </print-share-section>

              <div class="columns top-section">
                <div class="column is-6">
                  <div
                    v-if="item.street_address"
                    class="columns is-mobile"
                  >
                    <div class="column is-1">
                      <font-awesome-icon icon="map-marker-alt" />
                    </div>
                    <div
                      class="column is-11"
                      v-html="parseAddress(item.street_address)"
                    >
                    </div>
                  </div>
                </div>

                <div class="column is-6">

                  <div
                    v-if="item.phone_number"
                    class="columns is-mobile"
                  >
                    <div
                      class="column is-1"
                    >
                      <font-awesome-icon icon="phone" />
                    </div>
                    <div class="column is-11">
                      {{ item.phone_number }}
                    </div>
                  </div>

                  <div
                    v-if="item.email"
                    class="columns is-mobile"
                  >
                    <div
                      class="column is-1"
                    >
                      <font-awesome-icon icon="envelope" />
                    </div>
                    <div class="column is-11">
                      <a :href="`mailto:${item.email}`">{{ item.email }}</a>
                    </div>
                  </div>

                  <div
                    v-if="item.website"
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
                        :href="makeValidUrl(item.website)"
                      >
                        {{ item.website }}
                        <font-awesome-icon icon="external-link-alt" />
                      </a>
                    </div>
                  </div>

                  <div
                    v-if="item.facebook_name"
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
                        :href="item.facebook_name"
                      >
                        Facebook
                      </a>
                    </div>
                  </div>

                  <div
                    v-if="item.twitter"
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
                        :href="item.twitter"
                      >
                        Twitter
                      </a>
                    </div>
                  </div>
                </div>

              </div>

              <div
                v-if="item.services_offered"
              >
                <h3 v-if="!i18nEnabled">
                  Services offered
                </h3>
                <h3 v-if="i18nEnabled">
                  {{ $t('servicesOffered') }}
                </h3>

                <div
                  v-if="!i18nEnabled"
                  class="columns is-multiline is-gapless"
                >
                  <div
                    v-for="i in parseServiceList(item.services_offered)"
                    :key="i"
                    class="column is-half"
                  >
                    {{ i }}
                  </div>
                </div>

                <div
                  v-if="i18nEnabled"
                  class="columns is-multiline is-gapless"
                >
                  <div
                    v-for="service in parseServiceList(item.services_offered)"
                    :key="service"
                    class="column is-half"
                  >
                    {{ $t(service) }}
                  </div>
                </div>

                
              </div>

              <div
                v-if="item.tags && item.tags.length"
              >
                <h3 v-if="!i18nEnabled">
                  {{ tagsPhrase }}
                </h3>
                <h3 v-if="i18nEnabled">
                  {{ $t(tagsPhrase) }}
                </h3>
                <div>
                  {{ parseTagsList(item.tags) }}
                </div>
              </div>
            </div>

          </expand-collapse>
        </div>

      </div>

    </div>

  </div>
</template>

<style lang="scss">

.loading-data {
  height: 100%;
}

.mobile-dropdown-container {
  // margin-left: -10px;
  margin-right: -10px;
}

.dropdown-div {
  padding-top: 0px !important;
}

.locations-panel {
  overflow-y: visible !important;
  // width: 100%;
}

.summary-and-location-container {
  // padding: 1rem;
  // width: 100%;
  overflow-y: visible;
}

.summary-container {
  // position: absolute;
  padding-left: 1rem;
  // padding-right: 1rem;
  padding-top: 1rem;
  // background-color: rgba(225, 225, 225, 1);
  // width: 48%;
  z-index:9;
  background:#fff
}

@media (max-width: 767px) {
  .summary-container {
    // width: 100%;
  }
}

.location-container {
  padding: 1rem;
}

@media (min-width: 1024px) {
  .location-container {
    width: 100%;
  }

  .summary-container {
    width: 100%;
    position: sticky;
    top: 0;
    width: 100%;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .location-container {
    // padding-top: 170px;
    width: 100%;
  }

  .summary-container {
    position: sticky;
    top: 0;
    width: 100%;
    padding-top: .5rem;
  }

  .loc-panel-widget {
    padding-top: 0px !important;
  }

}

@media (max-width: 767px) {
  .location-container {
    // padding-top: 120px;
  }

  .summary-container {
    position: sticky;
    top: 0;
    width: 100%;
  }
}

.cut-right {
  margin-right: .1rem !important;
}

.no-results {
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 1rem;
  padding-top: 12rem;
}

.section-title {
  margin-bottom: .5rem !important;
}

.main-content {
  padding-top: .5rem;
  padding-bottom: 1.5rem;
}

.app-button:focus {
  color: white !important;
}

.card-button {
  border-width: 0px !important;
  color: #0f4d90 !important;
}

.card-button:hover {
  color: black !important;
}

.card-button:focus:not(:active), .card-button.is-focused:not(:active) {
  box-shadow: none !important;
}
.card-button-text {
  font-family: "OpenSans-Regular", "Open Sans", sans-serif;
  font-size: 14px;
  padding-left: 5px;
  text-transform: none;
}

.top-section {
  padding-top: 1rem;
}

.button.disabled, fieldset.disabled .button {
  // background-color: #878787 !important;
  // border-color: #878787 !important;
  background-color: #cfcfcf !important;
  border-color: #cfcfcf !important;
}

.button.disabled, fieldset.disabled .button {
  // background-color: #878787 !important;
  // border-color: #878787 !important;
  background-color: #cfcfcf !important;
  border-color: #cfcfcf !important;
  cursor: not-allowed;
}

.button.disabled:focus:not(:active), .button.disabled.is-medium:focus:not(:active), .button.disabled.is-default:focus:not(:active) {
  box-shadow: 0 0 0 0em #25cef7 !important;
}

</style>
