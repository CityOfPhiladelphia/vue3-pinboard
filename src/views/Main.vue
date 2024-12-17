<script setup>

import { useMainStore } from '../stores/MainStore.js';
import { useMapStore } from '../stores/MapStore.js';
import { useGeocodeStore } from '../stores/GeocodeStore.js';
import { useDataStore } from '../stores/DataStore.js';
import { useConfigStore } from '../stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, getCurrentInstance, onMounted, watch, onBeforeMount, nextTick } from 'vue';

const ConfigStore = useConfigStore();
const $config = ConfigStore.config;
// if (import.meta.env.VITE_DEBUG) console.log('$config:', $config);

import { format } from 'date-fns';
import { parseISO } from 'date-fns';
import { subWeeks } from 'date-fns';
import { addWeeks } from 'date-fns';

import Fuse from 'fuse.js'

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { featureCollection } from '@turf/helpers';
import { pointsWithinPolygon } from '@turf/points-within-polygon';
import distance from '@turf/distance';
import AlertBanner from '../components/AlertBanner.vue';
// import buffer from '@turf/buffer';
// import centerOfMass from '@turf/center-of-mass';
// import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';

// COMPONENTS
import LocationsPanel from '../components/LocationsPanel.vue';
import MapPanel from '../components/MapPanel.vue';
import RefinePanel from '../components/RefinePanel.vue';
import AddressSearchControl from '../components/AddressSearchControl.vue';

const instance = getCurrentInstance();
// if (import.meta.env.VITE_DEBUG) console.log('instance.appContext.config.globalProperties.$i18n:', instance.appContext.config.globalProperties.$i18n);

// STORES
const MapStore = useMapStore();
const MainStore = useMainStore();
const GeocodeStore = useGeocodeStore();
const DataStore = useDataStore();

// ROUTER
const route = useRoute();
const router = useRouter();

const publicPath = ref('/');
const isMapVisible = ref(false);
const isAlertModalOpen = ref(false);
const currentBuffer = ref(null);
const buttonText = ref('app.viewMap');

const brandingLink = ref(null);
const appLink = ref('/');

const searchString = ref(null);
const refineEnabled = ref(true);
const addressInputPlaceholder = ref(null);
const showForceHolidayBanner = ref(false);
const showAutomaticHolidayBanner = ref(false);

console.log('watch test');

if ($config.app.logoLink && $config.app.logoLink == 'none') {
  brandingLink.value = {
    style: 'pointer-events: none',
  }
}

if ($config.refineEnabled === false) {
  refineEnabled.value = false;
}

// computed

const brandingImage = computed(() => {
  let value = null;
  if (!isMobile.value) {
    if ($config.app.logoSrc) {
      value = {
        src: $config.app.logoSrc,
        alt: $config.app.logoAlt,
        width: $config.app.logoWidth || "200px",
      }
    }
  }
  return value;
});

const isMobile = computed(() => {
  return MainStore.isMobileDevice || MainStore.windowDimensions.width < 768;
});

const i18nLocale = computed(() => {
  return instance.appContext.config.globalProperties.$i18n.locale;
});

const refineTitle = computed(() => {
  return $config.refine.title;
});

// const shouldShowHeaderAlert = computed(() => {
//   let value = false;
//   if ($config.alerts && $config.alerts.header) {
//     value = $config.alerts.header.enabled(store.state);
//   }
//   return value;
// });

const alertModalTitle = computed(() => {
  let value = '';
  if ($config.alerts && $config.alerts.modal && $config.alerts.modal.title) {
    value = $config.alerts.modal.title;
  }
  return value;
});

const alertModalBody = computed(() => {
  let value = '';
  if ($config.alerts && $config.alerts.modal && $config.alerts.modal.body) {
    value = $config.alerts.modal.body;
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

const i18nSelectorHidden = computed(() => {
  if ($config.i18n && $config.i18n.selectorHidden) {
    return true;
  } else {
    return false;
  }
});

const selectedKeywords = computed(() => {
  return MainStore.selectedKeywords;
});

const selectedServices = computed(() => {
  return MainStore.selectedServices;
});

const dataStatus = computed(() => {
  let value;
  if (DataStore.sources[$config.app.type]) {
    if (DataStore.sources[$config.app.type].status === 200) {
      value = 'success';
    } else if (DataStore.sources[$config.app.type].status === 404) {
      value = 'error';
    } else {
      value = null;
    }
  }
  return value;
});

const database = computed(() => {
  let value = {}
  if (DataStore.sources[DataStore.appType]) {
    // if (import.meta.env.VITE_DEBUG) console.log('DataStore.appType:', DataStore.appType, 'DataStore.sources[DataStore.appType]:', DataStore.sources[DataStore.appType]);
    value = DataStore.sources[DataStore.appType].data.rows || DataStore.sources[DataStore.appType].data.features || DataStore.sources[DataStore.appType].features;
  }
  return value;
});

// const shouldLoadCyclomediaWidget = computed(() => {
//   return $config.cyclomedia && $config.cyclomedia.enabled && !isMobile.value;
// });

// const cyclomediaActive = computed(() => {
//   return store.state.cyclomedia.active;
// });

// const cycloLatlng = computed(() => {
//   if (store.state.cyclomedia.orientation.xyz !== null) {
//     const xyz = store.state.cyclomedia.orientation.xyz;
//     return [ xyz[1], xyz[0] ];
//   }
//   const center = $config.map.center;
//   return center;
// });

// const cycloRotationAngle = computed(() => {
//   return store.state.cyclomedia.orientation.yaw * (180/3.14159265359);
// });

// const cycloHFov = computed(() => {
//   return store.state.cyclomedia.orientation.hFov;
// });

const selectedResource = computed(() => {
  return DataStore.selectedResource;
});

const layoutDescription = computed(() => {
  let value;
  if (isMobile.value && !refineEnabled.value) {
    value = 'mobileNoRefine';
  } else if (isMobile.value && refineEnabled.value && refineOpen.value) {
    value = 'mobileRefineOpen';
  } else if (isMobile.value && refineEnabled.value && !refineOpen.value) {
    value = 'mobileRefineClosed';
  } else if (!refineEnabled.value) {
    value = 'nonMobileNoRefine';
  } else {
    value = 'nonMobileRefine';
  }
  return value;
});

const locationsPanelVisible = computed(() => {
  return !isMobile.value || layoutDescription.value !== 'mobileRefineOpen' && !isMapVisible.value;
});

const mapPanelVisible = computed(() => {
  return !isMobile.value || layoutDescription.value !== 'mobileRefineOpen' && isMapVisible.value;
});

const toggleButtonsVisible = computed(() => {
  return isMobile.value && layoutDescription.value !== 'mobileRefineOpen' && !MainStore.shouldShowGreeting;
});

const refineOpen = computed(() => {
  return MainStore.refineOpen;
});

const searchDistance = computed(() => {
  return MapStore.searchDistance;
});

const holidays = computed(() => {
  return DataStore.holidays;
});

const holiday = computed(() => {
  return MainStore.holiday;
});

const futureHolidayClosure = computed(() => {
  let holiday = MainStore.holiday;
  if (holiday.coming_soon) {
    return true;
  } 
  return false;
});

const currentHolidayClosure = computed(() => {
  let holiday = MainStore.holiday;
  if (holiday.current) {
    return true;
  } 
  return false;
});

const justPassedHolidayClosure = computed(() => {
  let holiday = MainStore.holiday;
  if (holiday.just_passed) {
    return true;
  } 
  return false;
});

const closureMessage = computed(() => {
  let holiday = MainStore.holiday;
  let message;
  if (currentHolidayClosure.value) {
    message = t('holidayClosure') + holiday.holiday_label + ' ' + format(parseISO(holiday.start_date), 'MM/dd/yyyy');
  } else if (futureHolidayClosure.value) {
    message = t('futureHolidayClosure') + holiday.holiday_label + ' ' + format(parseISO(holiday.start_date), 'MM/dd/yyyy');
    // message = t('futureHolidayClosure') + transforms.toLocaleDateString.transform(item.attributes.close_holiday_start);
  } else {
    message = null;
  }
  return message;
});

const closureMessageAllSites = computed(() => {
  let holiday = MainStore.holiday;
  let message;
  if ($config.holidays && $config.holidays.forceBannerMessage) {
    message = t($config.holidays.forceBannerMessage);
  } else if (currentHolidayClosure.value) {
    message = t(holiday.holiday_label) + ' - ' + t('holidayClosureAllSites');// + holiday.holiday_label + ' ' + format(parseISO(holiday.start_date), 'MM/dd/yyyy');
  } else if (futureHolidayClosure.value) {
    message = t(holiday.holiday_label) + ' - ' + t('futureHolidayClosureAllSites');// + holiday.holiday_label + ' ' + format(parseISO(holiday.start_date), 'MM/dd/yyyy');
    // message = t('futureHolidayClosure') + transforms.toLocaleDateString.transform(item.attributes.close_holiday_start);
  } else if (justPassedHolidayClosure.value) {
    message = t(holiday.holiday_label) + ' - ' + t('holidayClosureAllSites');// + holiday.holiday_label + ' ' + format(parseISO(holiday.start_date), 'MM/dd/yyyy');
    // message = t('futureHolidayClosure') + transforms.toLocaleDateString.transform(item.attributes.close_holiday_start);
  } else {
    message = null;
  }
  return message;
});

  // watch
watch(
  () => holidays,
  async nextHolidays => {
    if (import.meta.env.VITE_DEBUG) console.log('watch holidays, nextHolidays:', nextHolidays);
    let currentYear = format(new Date(), 'yyyy');
    let currentMonth = format(new Date(), 'MM');
    let currentDay = format(new Date(), 'dd');
    let dateStart = new Date(currentYear, currentMonth-1, currentDay);
    // let dateStart = new Date(2023, 0, 2);
    // if (import.meta.env.VITE_DEBUG) console.log('currentYear:', currentYear, 'currentMonth:', currentMonth, 'currentDay:', currentDay, 'dateStart:', dateStart, 'dateStartUnix:', parseInt(format(dateStart, 'T')));
    let currentUnixDate = parseInt(format(dateStart, 'T'));

    let holi = {
      holiday_label: '',
      start_date: '',
      coming_soon: false,
      current: false,
      just_passed: false,
    };

    for (let holiday of nextHolidays.holidays) {
      // if (import.meta.env.VITE_DEBUG) console.log('holiday.start_date:', holiday.start_date, parseISO(format(holiday.start_date, 'T')));
      // if (import.meta.env.VITE_DEBUG) console.log('currentUnixDate:', currentUnixDate, 'holiday.start_date:', holiday.start_date, parseInt(format(parseISO(holiday.start_date), 'T')));

      let oneWeekAhead = parseInt(format(subWeeks(parseISO(holiday.start_date), 1), 'T'));
      let actualHoliday = parseInt(format(parseISO(holiday.start_date), 'T'));
      let oneWeekBehind = parseInt(format(addWeeks(parseISO(holiday.start_date), 1), 'T'));

      if (currentUnixDate >= oneWeekAhead && currentUnixDate < actualHoliday) {
        holi.holiday_label = holiday.holiday_label;
        holi.coming_soon = true;
        holi.start_date = holiday.start_date;
      } else if (currentUnixDate == actualHoliday) {
        holi.holiday_label = holiday.holiday_label;
        holi.current = true;
        holi.start_date = holiday.start_date;
      } else if (currentUnixDate <= oneWeekBehind && currentUnixDate > actualHoliday) {
        holi.holiday_label = holiday.holiday_label;
        holi.just_passed = true;
        // holi.start_date = holiday.start_date;
      }

      // if (import.meta.env.VITE_DEBUG) console.log('holiday.start_date:', holiday.start_date, format(holiday.start_date, 'T'));
    }
    // if (import.meta.env.VITE_DEBUG) console.log('watch holidays, holi.holiday_label:', holi.holiday_label, 'holi.coming_soon:', holi.coming_soon, 'holi.current:', holi.current);
    MainStore.holiday = holi;
  }
);

watch(
  () => database,
  async nextDatabase => {
    DataStore.databaseWithoutHiddenItems = nextDatabase;
  }
);

watch(
  () => i18nLocale,
  async nexti18nLocale => {
    // if (import.meta.env.VITE_DEBUG) console.log('watch i18nLocale, nexti18nLocale:', nexti18nLocale);
    let startQuery = { ...route.query };

    delete startQuery['lang'];
    if (import.meta.env.VITE_DEBUG) console.log('watch i18nLocale, startQuery:', startQuery);

    if (nexti18nLocale !== 'en-US') {
      let query = { 'lang': nexti18nLocale };
      router.push({ query: { ...startQuery, ...query }});
    } else {
      router.push({ query: { ...startQuery }});
    }

    // $gtag.event('language-click', {
    //   'event_category': store.state.gtag.category,
    //   'event_label': nexti18nLocale,
    // })
  }
);

// watch(
//   () => MapStore.geolocation,
//   async newLocation => {
//     if (newLocation) {
//       clearGeocodeAndZipcode();
//     }
//   }
// );

watch(
  () => MapStore.bufferForAddressOrLocationOrZipcode,
  async => {
    if (import.meta.env.VITE_DEBUG) console.log('watch MapStore.bufferForAddressOrLocationOrZipcode is calling filterPoints');
    filterPoints();
  }
);

watch(
  () => selectedServices.value,
  async => {
    if (import.meta.env.VITE_DEBUG) console.log('watch selectedServices is firing');
    if (database.value) {
      if (import.meta.env.VITE_DEBUG) console.log('watch selectedServices is calling filterPoints');
      filterPoints();
    }
  }
);

watch(
  () => selectedKeywords.value.length,
  async nextKeywords => {
    if (import.meta.env.VITE_DEBUG) console.log('watch selectedKeywords is firing, nextKeywords:', nextKeywords);
    if (database.value) {
      filterPoints();
    }
  }
);

watch(
  () => dataStatus.value,
  async nextDataStatus => {
    console.log('watch dataStatus, nextDataStatus:', nextDataStatus);
    if (nextDataStatus === 'success') {
      filterPoints();
    }
  }
);

const setHeights = () => {
  // if (import.meta.env.VITE_DEBUG) console.log('setHeights is running');
  let header = document.querySelector("#app-header");
  let headerOffsetHeight = header.offsetHeight;
  // if (import.meta.env.VITE_DEBUG) console.log('header:', header, 'header.offsetHeight:', header.offsetHeight);
  let addressSearchHolder = document.querySelector("#address-search-holder");
  let addressSearchHolderOffsetHeight = addressSearchHolder.offsetHeight;
  const refinePanel = document.querySelector('#refine-panel-component');
  let refinePanelOffsetHeight = refinePanel.offsetHeight;
  const holidayBanner = document.querySelector('#holiday-banner');
  let holidayBannerOffsetHeight;
  if (holidayBanner) {
    holidayBannerOffsetHeight = holidayBanner.offsetHeight;
  } else {
    holidayBannerOffsetHeight = 0;
  }
  const mainRow = document.querySelector('#main-row');
  if (isMobile.value && MainStore.shouldShowGreeting) {
    mainRow.style.setProperty('height', `calc(100vh - ${refinePanelOffsetHeight+headerOffsetHeight+holidayBannerOffsetHeight+addressSearchHolderOffsetHeight}px)`);
  } else if (isMobile.value) {
    mainRow.style.setProperty('height', `calc(100vh - ${refinePanelOffsetHeight+headerOffsetHeight+holidayBannerOffsetHeight+addressSearchHolderOffsetHeight+46}px)`);
  } else {
    mainRow.style.setProperty('height', `calc(100vh - ${refinePanelOffsetHeight+holidayBannerOffsetHeight+headerOffsetHeight+46}px)`);
  }
  const map = document.querySelector('#map');
  if (isMobile.value) {
    map.style.setProperty('height', `calc(100vh - ${refinePanelOffsetHeight+headerOffsetHeight+holidayBannerOffsetHeight+addressSearchHolderOffsetHeight+46}px)`);
  } else {
    map.style.setProperty('height', `calc(100vh - ${refinePanelOffsetHeight+holidayBannerOffsetHeight+headerOffsetHeight+46}px)`);
  }
}

watch(
  () => refineOpen.value,
  async() => {
    await nextTick();
    setHeights();
  }
);

watch(
  () => MainStore.shouldShowGreeting,
  async() => {
    if (isMobile.value) {
      await nextTick();
      setHeights();
    }
  }
)

onBeforeMount(() => {
  if ($config.appLink) {
    appLink.value = $config.appLink;
  } else {
    appLink.value = '.';
  }
});

onMounted(async() => {
  await nextTick();
  setHeights();

  $config.searchBar.searchTypes.forEach(item => {
    if (route.query[item]) {
      searchString.value = route.query[item];
    }
  });

  if (route.query.resource) {
    if (import.meta.env.VITE_DEBUG) console.log('App.vue mounted, route.query.resource:', route.query.resource);
    let selectedResource = [ route.query.resource ];
    DataStore.selectedResource = selectedResource;
  }
  
  if (route.query.lang) {
    // if (import.meta.env.VITE_DEBUG) console.log('App.vue mounted language:', route.query.lang);
    i18nLocale.value = route.query.lang;
  }

  if ($config.searchBar) {
    let routeQuery = Object.keys(route.query);
    // if (import.meta.env.VITE_DEBUG) console.log('App.vue mounted in searchTypes section, route:', route, 'routeQuery:', routeQuery, 'Object.keys(route.query)[0]', Object.keys(route.query)[0]);
    let value;
    for (let query of routeQuery) {
      if (query === 'address' || query === 'keyword') {
        value = route.query[query];
      }
    }
    MainStore.currentSearch = value

    addressInputPlaceholder.value = $config.searchBar.placeholder;
  }

  // if ($config.appLink) {
  //   appLink.value = $config.appLink;
  // } else {
  //   appLink.value = '.';
  // }

  if (!i18nEnabled.value) {
    buttonText.value = isMapVisible.value ? 'List' : 'Map';
  } else {
    buttonText.value = isMapVisible.value ? 'app.list' : 'app.map';
  }

  if ($config.alerts && $config.alerts.modal && $config.alerts.modal.enabled) {
    isAlertModalOpen.value = true;
  }

  // if ($config.gtag && $config.gtag.category) {
  //   store.commit('setGtagCategory', $config.gtag.category);
  // }

  if ($config.app.trustedSite && $config.app.trustedSite === 'hidden') {
    let trusted = document.getElementById('trusted-site');
    if (import.meta.env.VITE_DEBUG) console.log('trusted:', trusted);
    trusted.classList.add("trusted-site-hidden");
  }

  if ($config.app.skipGreeting) {
    MainStore.shouldShowGreeting = false;
  }

  if ($config.holidays && $config.holidays.automaticBanner) {
    showAutomaticHolidayBanner.value = true;
    await nextTick();
    setHeights();
  }

  if ($config.holidays && $config.holidays.forceBanner) {
    showForceHolidayBanner.value = true;
    await nextTick();
    setHeights();
  }

  filterPoints();

});

// METHODS
const closeHolidayBanner = async() => {
  showAutomaticHolidayBanner.value = false;
  showForceHolidayBanner.value = false;
  await nextTick();
  setHeights();
  // let holiday = {
  //   holiday_label: '',
  //   coming_soon: false,
  //   current: false,
  //   start_date: '',
  // };
  // store.commit('setHoliday', holiday);
};

const geolocate = () => {
  clearGeocodeAndZipcode();
  MapStore.geolocate();
  MainStore.selectedZipcode = null;
}


// const geolocateControlFire = async(e) => {
//   if (import.meta.env.VITE_DEBUG) console.log('Pinboard Main.vue geolocateControlFire is running, e:', e);
//   // if (import.meta.env.VITE_DEBUG) console.log('Pinboard Main.vue geolocateControlFire is running, e.coords.latitude:', e.coords.latitude, 'e.coords.longitude:', e.coords.longitude);
//   if (e.lng != null) {

//     clearGeocodeAndZipcode();

//     await nextTick()
//     // runBuffer({ coordinates: [ e.lng, e.lat ] });
//     if (MainStore.shouldShowGreeting) {
//       MainStore.shouldShowGreeting = false;
//     }
    
//   } else {
//     // if (import.meta.env.VITE_DEBUG) console.log('Main.vue geolocateControlFire is running, remove currentBuffer.value');
//     MapStore.bufferForAddressOrLocationOrZipcode = {};
//     currentBuffer.value = null;
//   }
// };

const clearGeocodeAndZipcode = async() => {
  let startQuery = { ...route.query };
  delete startQuery['address'];
  delete startQuery['zipcode'];
  router.push({ query: { ...startQuery }});
};

const clearBadAddress = () => {
  if (import.meta.env.VITE_DEBUG) console.log('clearBadAddress is running');
  let startQuery = { ...route.query };
  delete startQuery['address'];
  router.push({ query: startQuery });
  searchString.value = '';
  MainStore.currentSearch = null;
};

// const geocodeFailed = () => {
//   if (import.meta.env.VITE_DEBUG) console.log('geocodeFailed is running');
//   MapStore.bufferForAddressOrLocationOrZipcode = null;
// };

// const compareArrays = (arr1, arr2) => {
//   const finalArray = [];
//   arr1.forEach((e1) => arr2.forEach((e2) =>
//     {
//       if (e1 === e2) {
//         finalArray.push(e1);
//       }
//     }
//   ));
//   return finalArray;
// };

const clearSearchTriggered = () => {
  let startQuery = { ...route.query };
  // if (import.meta.env.VITE_DEBUG) console.log('in clearSearchTriggered1, route.query:', route.query, 'startQuery:', startQuery);
  delete startQuery['address'];
  delete startQuery['zipcode'];
  delete startQuery['keyword'];
  // if (import.meta.env.VITE_DEBUG) console.log('in clearSearchTriggered2, route.query:', route.query, 'startQuery:', startQuery);
  router.push({ query: startQuery });
  searchString.value = '';
  MainStore.selectedKeywords = [];
  MainStore.selectedZipcode = null;
  MapStore.bufferForAddressOrLocationOrZipcode = {};
  MainStore.currentSearch = null;
};

const checkServices = (index, row) => {
  // if (import.meta.env.VITE_DEBUG) console.log('Main.vue checkServices is running, index:', index, 'row:', row);
  const selectedServices = MainStore.selectedServices;
  if (!selectedServices.length) {
    return true;
  }
  if ($config.refine && $config.refine.type && ['multipleFields', 'multipleFieldGroups', 'multipleDependentFieldGroups'].includes($config.refine.type)) {
    let booleanConditions = [];

    if (selectedServices.length === 0) {
      booleanConditions.push(true);
    } else {

      // if refine.type = multipleFields
      if ($config.refine.type === 'multipleFields') {
        for (let field in $config.refine.multipleFields) {
          if (selectedServices.includes(field)) {

            let getter = $config.refine.multipleFields[field];
            let val = getter(row);
            booleanConditions.push(val);
          }
        }
      } else if ($config.refine.type === 'multipleFieldGroups') {
        // if refine.type = multipleFieldGroups
        let selectedGroups = [];
        for (let value of selectedServices) {
          // if (import.meta.env.VITE_DEBUG) console.log('Main.vue checkServices value:', value);
          let valueGroup;
          if (value) {
            valueGroup = value.split('_', 1)[0];
          }
          if (valueGroup && !selectedGroups.includes(valueGroup)) {
            selectedGroups.push(valueGroup)
          }
        }
        // if (import.meta.env.VITE_DEBUG) console.log('Main.vue checkServices is running on multipleFieldGroups, selectedServices:', selectedServices, 'selectedGroups:', selectedGroups);
        let groupValues = [];
        for (let group of selectedGroups) {
          let groupBooleanConditions = [];
          for (let service of selectedServices) {
            // if (import.meta.env.VITE_DEBUG) console.log('Main.vue checkServices loop, service:', service, 'group:', group);
            if (group !== 'keyword' && service.split('_', 1)[0] === group && $config.refine.multipleFieldGroups[group]['radio']) {
              // if (import.meta.env.VITE_DEBUG) console.log('group:', group, '$config.refine.multipleFieldGroups[group]["radio"]:', $config.refine.multipleFieldGroups[group]['radio']);
              let dependentGroups = $config.refine.multipleFieldGroups[group]['radio'][service.split('_')[1]]['dependentGroups'] || [];
              // if (import.meta.env.VITE_DEBUG) console.log('dependentGroup:', dependentGroup, 'service.split("_", 1)[0]:', service.split('_', 1)[0], 'service.split("_")[1]:', service.split('_')[1], 'group', group, '$config.refine.multipleFieldsGroups[group]', $config.refine.multipleFieldsGroups[group], '$config.refine.multipleFieldsGroups[group][service.split("_")[1]]:', $config.refine.multipleFieldsGroups[group][service.split('_')[1]]);
              let getter = $config.refine.multipleFieldGroups[group]['radio'][service.split('_')[1]]['value'];
              let dependentServices = [];
              for (let service of selectedServices) {
                if (dependentGroups.length && dependentGroups.includes(service.split('_')[0])) {
                  dependentServices.push(service.split('_')[1]);
                }
              }
              // if (import.meta.env.VITE_DEBUG) console.log('getter:', getter, 'dependentGroups:', dependentGroups, 'selectedServices:', selectedServices, 'dependentServices:', dependentServices);
              let val = getter(row, dependentServices);
              groupBooleanConditions.push(val);
            }
            if (group !== 'keyword' && service.split('_', 1)[0] === group && $config.refine.multipleFieldGroups[group]['checkbox']) {
              // if (import.meta.env.VITE_DEBUG) console.log('group:', group, '$config.refine.multipleFieldGroups[group]["dependent"]:', $config.refine.multipleFieldGroups[group]['dependent']);
              let dependentGroups = $config.refine.multipleFieldGroups[group]['checkbox'][service.split('_')[1]]['dependentGroups'] || [];
              // if (import.meta.env.VITE_DEBUG) console.log('dependentGroup:', dependentGroup, 'service.split("_", 1)[0]:', service.split('_', 1)[0], 'service.split("_")[1]:', service.split('_')[1], 'group', group, '$config.refine.multipleFieldsGroups[group]', $config.refine.multipleFieldsGroups[group], '$config.refine.multipleFieldsGroups[group][service.split("_")[1]]:', $config.refine.multipleFieldsGroups[group][service.split('_')[1]]);
              let getter = $config.refine.multipleFieldGroups[group]['checkbox'][service.split('_')[1]]['value'];
              let dependentServices = [];
              for (let service of selectedServices) {
                if (dependentGroups.length && dependentGroups.includes(service.split('_')[0])) {
                  dependentServices.push(service.split('_')[1]);
                }
              }
              // if (import.meta.env.VITE_DEBUG) console.log('getter:', getter, 'dependentGroups:', dependentGroups, 'selectedServices:', selectedServices, 'dependentServices:', dependentServices);
              let val = getter(row, dependentServices);
              groupBooleanConditions.push(val);
            }
          }
          // if (import.meta.env.VITE_DEBUG) console.log('$config.refine.andOr:', $config.refine.andOr, 'group:', group, 'groupBooleanConditions:', groupBooleanConditions);
          if ($config.refine.andOr) {
            if ($config.refine.andOr == 'and') {
              if (groupBooleanConditions.includes(false)) {
                booleanConditions.push(false);
              } else {
                booleanConditions.push(true);
              }
            } else if ($config.refine.andOr == 'or') {
              if (groupBooleanConditions.includes(true)) {
                booleanConditions.push(true);
              } else {
                booleanConditions.push(false);
              }
            }
          } else {
            if (groupBooleanConditions.includes(true)) {
              booleanConditions.push(true);
            } else if (groupBooleanConditions.length) {
              booleanConditions.push(false);
            }
          }
        }
      } else {
        // if refine.type = multipleDependentFieldGroups
        let selectedGroups = [];
        for (let value of selectedServices) {
          let valueGroup = value.split('_', 1)[0]
          if (!selectedGroups.includes(valueGroup)) {
            selectedGroups.push(valueGroup)
          }
        }
        // if (import.meta.env.VITE_DEBUG) console.log('Main.vue checkServices is running on multipleDependentFieldGroups, selectedServices:', selectedServices, 'selectedGroups:', selectedGroups);
        let groupValues = [];
        for (let group of selectedGroups) {
          let groupBooleanConditions = [];
          for (let service of selectedServices) {
            if (service.split('_', 1)[0] === group) {
              let ind = $config.refine.multipleDependentFieldGroups[group]['independent'];
              let serviceEnd = service.split('_')[1];
              // if (import.meta.env.VITE_DEBUG) console.log('ind:', ind, 'serviceEnd:', serviceEnd, 'selectedServices:', selectedServices);
              let getter;
              if ($config.refine.multipleDependentFieldGroups[group]['dependent'][service.split('_')[1]]) {
                getter = $config.refine.multipleDependentFieldGroups[group]['dependent'][service.split('_')[1]]['value'];
                let dependentServices = [];
                if (ind) {
                  for (let service of selectedServices) {
                    if (Object.keys(ind).includes(service.split('_')[1])) {
                      dependentServices.push(service.split('_')[1]);
                    }
                  }
                }
                let val = getter(row, dependentServices);
                // if (import.meta.env.VITE_DEBUG) console.log('getter:', getter, 'selectedServices:', selectedServices, 'dependentServices:', dependentServices, 'val:', val);
                groupBooleanConditions.push(val);
              }
            }
          }
          // if (import.meta.env.VITE_DEBUG) console.log('groupBooleanConditions:', groupBooleanConditions);
          if (groupBooleanConditions.includes(true) || !groupBooleanConditions.length) {
            booleanConditions.push(true);
          } else {
            booleanConditions.push(false);
          }
        }
      }
    }
    // if (import.meta.env.VITE_DEBUG) console.log('booleanConditions:', booleanConditions);
    if (!booleanConditions.includes(false)) {
      return true
    }

  // if refine.type = categoryField_value
  } else if ($config.refine && $config.refine.type === 'categoryField_value') {
    if (selectedServices.length === 0) {
      return true;
    } else {
      let value = $config.refine.value(row);
      return selectedServices.includes(value);
    }

  } else {
    // the original default version, or refine.type = 'categoryField_array'
    // if (import.meta.env.VITE_DEBUG) console.log('in else, row:', row, 'row.services_offered:', row.services_offered);
    let servicesSplit;
    if ($config.refine) {
      servicesSplit = $config.refine.value(row);
    } else if (row.services_offered) {
      servicesSplit = row.services_offered;
    }

    // if (import.meta.env.VITE_DEBUG) console.log('1 servicesSplit:', servicesSplit, 'typeof servicesSplit:', typeof servicesSplit);
    if (typeof servicesSplit === 'string') {
      servicesSplit = servicesSplit.split(',');
    }
    // if (import.meta.env.VITE_DEBUG) console.log('2 servicesSplit:', servicesSplit, 'typeof servicesSplit:', typeof servicesSplit);

    if (selectedServices.length === 0) {
      return true;
    } else {
      let servicesFiltered = [];
      if (servicesSplit) {
        servicesFiltered = servicesSplit.filter(f => selectedServices.includes(f));
      }
      // if (import.meta.env.VITE_DEBUG) console.log('servicesFiltered:', servicesFiltered, 'selectedServices:', selectedServices);
      return servicesFiltered.length == selectedServices.length;
    }
    // if (import.meta.env.VITE_DEBUG) console.log('services else is running, row:', row, 'selectedServices:', selectedServices, 'booleanServices:', booleanServices);
  }
};

const checkBuffer = (row) => {
  // if (import.meta.env.VITE_DEBUG) console.log('checkBuffer, row:', row);
  const buffer = MapStore.bufferForAddressOrLocationOrZipcode;
  if (!Object.keys(buffer).length) {
    // if (import.meta.env.VITE_DEBUG) console.log('!MapStore.bufferForAddressOrLocationOrZipcode');
    return true;
  } else if (row.geometry) {
    let comparePoint;
    if (GeocodeStore.aisData.features) {
      comparePoint = GeocodeStore.aisData.features[0].geometry;
    } else if (MapStore.zipcodeCenter) {
      comparePoint = MapStore.zipcodeCenter;
    } else if (MapStore.geolocation) {
      comparePoint = MapStore.geolocation;
    }
    row.distance = distance(comparePoint, row.geometry, { units: 'miles' });
    return true;
  }
};

const checkKeywords = (row) => {
  // if (import.meta.env.VITE_DEBUG) console.log('checkKeywords, row:', row, '$config.tags', $config.tags, 'selectedKeywords.value:', selectedKeywords.value, 'selectedKeywords.value.length:', selectedKeywords.value.length);
  let booleanKeywords;
  if (selectedKeywords.value.length > 0) {
    booleanKeywords = false;
    let description = [];
    if (Array.isArray(row.properties.tags)) {
      description = row.properties.tags;
    } else if (row.properties.tags) {
      description = row.properties.tags.split(', ');
    } else if ($config.tags && $config.tags.type == 'tagLocation') {
      if (Array.isArray($config.tags.location(row))) {
        description = $config.tags.location(row);
      } else if ($config.tags.location(row)) {
        description = $config.tags.location(row).split(', ');
      }
    } else if ($config.tags && $config.tags.type == 'fieldValues') {
      for (let tag of $config.tags.tags) {
        // if (import.meta.env.VITE_DEBUG) console.log('tag:', tag, 'tag.field:', tag.field, 'row.attributes[tag.field]:', row.attributes[tag.field]);
        if (tag.type == 'boolean' && row.attributes[tag.field] == 'Yes') {
          description.push(tag.value);
        } else if (tag.type == 'value' && row.attributes[tag.field] !== null && row.attributes[tag.field] != ' ') {
          // if (import.meta.env.VITE_DEBUG) console.log('in else if, row.attributes[tag.field]:', row.attributes[tag.field]);
          let value = row.attributes[tag.field].toLowerCase();
          // if (import.meta.env.VITE_DEBUG) console.log('value.split(","):', value.split(','));
          description = description.concat(value.split(','));
        }
      }
    }
    // if (import.meta.env.VITE_DEBUG) console.log('still going, selectedKeywords.value[0]:', selectedKeywords.value[0], 'row.properties.tags:', row.properties.tags, 'description:', description);

    let threshold = 0.2;
    if ($config.searchBar.fuseThreshold) {
      threshold = $config.searchBar.fuseThreshold;
    };

    const options = {
      // isCaseSensitive: false,
      // includeScore: false,
      // shouldSort: true,
      // includeMatches: false,
      // findAllMatches: true,
      minMatchCharLength: 3,
      location: 0,
      threshold: threshold,
      // distance: 100,
      // useExtendedSearch: false,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,

      // keys: [
      //   "title",
      //   "author.firstName"
      // ]
    };

    const fuse = new Fuse(description, options);
    let results = {};
    for (let keyword of selectedKeywords.value) {
      // if (import.meta.env.VITE_DEBUG) console.log('in selectedKeywords loop, keyword.toString():', keyword.toString(), 'description:', description);//'description[0].split(","):', description[0].split(','));
      if ($config.skipFuse) {
        let keywordString = '' + keyword;
        // if (import.meta.env.VITE_DEBUG) console.log('skipFuse, keywordString:', keywordString);
        if (description.includes(keywordString)) {
          // if (import.meta.env.VITE_DEBUG) console.log('19148 is in description');
          results[keyword] = ['true'];
        }
      } else {
        if (import.meta.env.VITE_DEBUG) console.log('fuse.search(keyword):', fuse.search(keyword), 'description:', description);
        results[keyword] = fuse.search(keyword);
      }
    }
    for (let keyword of Object.keys(results)) {
      if (results[keyword].length > 0) {
        booleanKeywords = true;
      }
    }
  } else {
    booleanKeywords = true;
  }
  return booleanKeywords;
}

const filterPoints = () => {
  if (import.meta.env.VITE_DEBUG) console.log('Main.vue filterPoints is running, database.value:', database.value);
  const filteredRows = [];

  if (!database.value) {
    return;
  }
  let startQuery = { ...route.query };
  if (!Object.keys(startQuery)) {
    if (import.meta.env.VITE_DEBUG) console.log('Main.vue filterPoints is running, no startQuery');
    DataStore.currentData = database.value;
    return;
  }

  const buffer = MapStore.bufferForAddressOrLocationOrZipcode;
  console.log('buffer', buffer);
  let pointsAfterBuffer = database.value;
  if (Object.keys(buffer).length) {
    if (import.meta.env.VITE_DEBUG) console.log('Main.vue filterPoints is running, buffer:', buffer);
    pointsAfterBuffer = pointsWithinPolygon(featureCollection(database.value), buffer).features;
  }
  console.log('pointsAfterBuffer', pointsAfterBuffer);

  for (const [index, row] of [ ...pointsAfterBuffer.entries() ]) {
    // if (import.meta.env.VITE_DEBUG) console.log('row:', row, 'index:', index);
    // if (import.meta.env.VITE_DEBUG) console.log('row.services_offered:', row.services_offered);

    let booleanBuffer = true;
    let booleanKeywords = true;

    let booleanServices = checkServices(index, row);
    if (booleanServices) {
      booleanBuffer = checkBuffer(row);
    }
    if (booleanServices && booleanBuffer) {
      booleanKeywords = checkKeywords(row);
    }

    // if (import.meta.env.VITE_DEBUG) console.log('booleanServices:', booleanServices, 'booleanBuffer:', booleanBuffer, 'booleanKeywords:', booleanKeywords);

    if (booleanServices && booleanBuffer && booleanKeywords) {
      // if (import.meta.env.VITE_DEBUG) console.log('Main.vue filterPoints is pushing a row, row:', row);
      filteredRows.push(row);
    }
  }
  // if (import.meta.env.VITE_DEBUG) console.log('filteredRows:', filteredRows);

  DataStore.currentData = filteredRows;
};

// todo move to Map.vue
const toggleToMap = () => {
  if (import.meta.env.VITE_DEBUG) console.log('toggleToMap is running');
  isMapVisible.value = true;
};

const toggleToList = () => {
  if (import.meta.env.VITE_DEBUG) console.log('toggleToList is running');
  isMapVisible.value = false;
};

const closeModal = () => {
  isAlertModalOpen.value = false;
};

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

const i18nLanguages = computed(() => {
  let values = [];
  // if (import.meta.env.VITE_DEBUG) console.log('i18nLanguages, $config.i18n:', $config.i18n);
  if ($config.i18n.languages) {
    values = $config.i18n.languages;
  }
  return values;
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
      v-if="i18nEnabled && !i18nSelectorHidden"
      :languages="i18nLanguages"
    />
  </template>
</app-header>

<main id="main" class="main invisible-scrollbar">

  <div
    v-show="isAlertModalOpen"
    class="modalWrapper"
    @click="closeModal"
  >
    <modal
      type="none"
      :hide-close-button="true"
      :close="closeModal"
    >
      <template #title>
        {{ alertModalTitle }}
      </template>
      <slot>
        <div class="content">
          <div
            v-html="alertModalBody"
          ></div>
        </div>
      </slot>
      <template #actions-before>
        <button
          class="button is-secondary"
          @click="closeModal"
        >
          Close
        </button>
      </template>
    </modal>
  </div>
    
  <div
    id="main-column"
    class="main-column invisible-scrollbar"
  >

    <div
      v-if="showForceHolidayBanner || showAutomaticHolidayBanner && holiday.coming_soon || showAutomaticHolidayBanner && holiday.current"
      id="holiday-banner"
      class="holiday-banner columns is-mobile"
    >
      <div class="column holiday-banner-column is-11">
        {{ closureMessageAllSites }}
      </div>
      <div class="column holiday-banner-column is-1">
        <button
          style="height: 100% !important;"
          class="button is-primary is-small is-pulled-right holiday-banner-close-button"
          @click="closeHolidayBanner"
        >
          x
        </button>
      </div>
    </div>

    <address-search-control
      v-if="isMobile"
      :input-id="'address-search-input'"
    />

    <div>
      <refine-panel
        :refine-title="refineTitle"
      />
      <!-- @geolocate-control-fire="geolocateControlFire" -->
    </div>

    <div
      v-show="!isMobile || isMobile && !refineOpen"
      id="main-row"
      class="main-row"
    >
      <div
        v-show="locationsPanelVisible"
        class="locations-holder"
      >
        <locations-panel
          :is-map-visible="isMapVisible"
          @clear-bad-address="clearBadAddress"
          @clicked-view-map="toggleToMap"
        />
      </div>
      <div
        v-show="mapPanelVisible"
        id="map-panel-holder"
        class="map-panel-holder"
      >
        <map-panel
          @clear-search="clearSearchTriggered"
          @toggleMap="toggleToMap"
          @geolocate="geolocate"
        />
          <!-- @geolocate-control-fire="geolocateControlFire" -->
      </div>
    </div>

  </div>
  <div
    v-show="toggleButtonsVisible"
  >
    <button
      class="capitalized toggle-button toggle-button-left"
      :class="isMapVisible ? 'toggle-button-inactive' : 'toggle-button-active'"
      @click="toggleToList"
    >
      <div class="text-div">
        <font-awesome-icon
          icon="fa-solid fa-rectangle-list"
          class="toggle-button-icon"
        />
        {{ $t('app.list') }}
      </div>
    </button>
    <button
      class="capitalized toggle-button toggle-button-right"
      :class="isMapVisible ? 'toggle-button-active' : 'toggle-button-inactive'"
      @click="toggleToMap"
    >
      <div class="text-div">
        <font-awesome-icon
          icon="fa-solid fa-map-marker-alt"
          class="toggle-button-icon"
        />
        {{ $t('app.map') }}
      </div>
    </button>
  </div>

</main>

<app-footer
  :is-sticky="true"
  :is-hidden-mobile="true"
  :links="footerLinks"
>
</app-footer>

</template>

<style lang="scss">

.text-div {
  height: 100%;
  width: 100%;
  padding: 12px;
}

.skip-to-main-content-link {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: .5em;
  background-color: #0f4d90;
  color: white;
  opacity: 0;
  text-decoration: underline;
}

.skip-to-main-content-link:focus {
  left: 0px;
  opacity: 1;
}

.skip-to-main-content-link:hover {
  color: white;
}

#app-header {
  .trusted-site-hidden {
    display: none;
  }
}

.capitalized {
  text-transform: uppercase;
}

.mobile-refine-panel-holder-open {
  flex-grow: 1;
  background: #f0f0f0;
}

.refine-panel-holder-open {
  background: #f0f0f0;
  border-width: 0px 0px 1px 0px;
  border-style: solid;
  border-color: #cfcfcf;
}

.refine-panel-holder {
  border-width: 0px 0px 1px 0px;
  border-style: solid;
  border-color: #cfcfcf;
}

.toggle-button {
  padding: 0px;
  font-family: "Montserrat-Bold", "Montserrat Bold", "Montserrat", sans-serif;
  // font-family: "ArialMT", "Arial", sans-serif !important;
  font-weight: 700 !important;
  font-size: 18px;
  height: 46px;
  border-top-width: 1px;
  border-bottom-width: 0px;
  background-color: #f0f0f0;
  border-color: #cfcfcf !important;
  color: #0f4d90 !important;
  width: 50%;
}

.toggle-button-icon {
  color: inherit;
}

.toggle-button-active {
 background-color: #ffffff;
}

.toggle-button-inactive {
  background-color: #f0f0f0;
  cursor: pointer;
}

.toggle-button-inactive :hover {
  background-color: #0f4d90;
  color: #ffffff;
}

.toggle-button-left {
  border-left-width: 0px;
  border-right-width: 1px;
}

.toggle-button-right {
  border-left-width: 1px;
  border-right-width: 0px;
}

.no-scroll{
  overflow: hidden;
  height: 100vh;
}

@media print {

  .locations-panel-holder {
    overflow-y: visible;
  }

  .locations-panel {
    overflow-y: visible;
  }

  .no-scroll {
    overflow: visible;
  }

  .locations-and-map-panels-holder {
    overflow-y: visible;
  }
}

.holiday-banner {
  margin-top: 0px !important;
  margin-bottom: 0px !important;
  padding-left: 1rem;
  background-color: #fff7d0;
}

.holiday-banner-column {
  padding-top: 0px !important;
  padding-bottom: 0px !important;
}

.holiday-banner-close-button {
  justify-content: center !important;
  width: 48px !important;
  height: 100% !important;
  padding-top: 0px !important;
  padding-bottom: 0px !important;
}

.modalWrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

</style>
