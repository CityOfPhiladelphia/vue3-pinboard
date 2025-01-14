<script setup>

import { useMainStore } from '../stores/MainStore.js';
import { useMapStore } from '../stores/MapStore.js';
import { useGeocodeStore } from '../stores/GeocodeStore.js';
import { useDataStore } from '../stores/DataStore.js';
import { useConfigStore } from '../stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, getCurrentInstance, onMounted, watch, onBeforeMount, nextTick } from 'vue';
import { event } from 'vue-gtag'

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

const isMapVisible = ref(false);
const isAlertModalOpen = ref(false);
// const currentBuffer = ref(null);
const buttonText = ref('app.viewMap');

const brandingLink = ref(null);
const appLink = ref('/');

const searchString = ref(null);
const refineEnabled = ref(true);
const addressInputPlaceholder = ref(null);
const showForceHolidayBanner = ref(false);
const showAutomaticHolidayBanner = ref(false);

if (import.meta.env.VITE_DEBUG) console.log('watch test');

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

    event('language-click', {
      'event_category': $config.gtag.category,
      'event_label': nexti18nLocale,
    })
  }
);

watch(
  () => MapStore.bufferForAddressOrLocationOrZipcode,
  async nextBufferForAddressOrLocationOrZipcode => {
    // if (Object.keys(nextBufferForAddressOrLocationOrZipcode).length) {
      if (import.meta.env.VITE_DEBUG) console.log('watch MapStore.bufferForAddressOrLocationOrZipcode is calling filterPoints, nextBufferForAddressOrLocationOrZipcode:', nextBufferForAddressOrLocationOrZipcode);
      filterPoints();
    // }
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
    if (import.meta.env.VITE_DEBUG) console.log('watch dataStatus, nextDataStatus:', nextDataStatus);
    if (nextDataStatus === 'success') {
      filterPoints();
    }
  }
);

watch(
  () => route.query,
  async() => {
    await nextTick();
    setHeights();
  }
)

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
    mainRow.style.setProperty('height', `calc(100dvh - ${refinePanelOffsetHeight+headerOffsetHeight+holidayBannerOffsetHeight+addressSearchHolderOffsetHeight}px)`);
  } else if (isMobile.value) {
    mainRow.style.setProperty('height', `calc(100dvh - ${refinePanelOffsetHeight+headerOffsetHeight+holidayBannerOffsetHeight+addressSearchHolderOffsetHeight+46}px)`);
  } else {
    mainRow.style.setProperty('height', `calc(100dvh - ${refinePanelOffsetHeight+holidayBannerOffsetHeight+headerOffsetHeight+46}px)`);
  }
  const map = document.querySelector('#map');
  if (isMobile.value && !MapStore.cyclomediaOn) {
    map.style.setProperty('height', `calc(100dvh - ${refinePanelOffsetHeight+headerOffsetHeight+holidayBannerOffsetHeight+addressSearchHolderOffsetHeight+46}px)`);
  } else if (isMobile.value) {
    map.style.setProperty('height', `calc(50dvh - ${(refinePanelOffsetHeight+holidayBannerOffsetHeight+headerOffsetHeight+84)/2}px)`);
  } else if (!MapStore.cyclomediaOn) {
    map.style.setProperty('height', `calc(100dvh - ${refinePanelOffsetHeight+holidayBannerOffsetHeight+headerOffsetHeight+46}px)`);
  } else {
    map.style.setProperty('height', `calc(50dvh - ${(refinePanelOffsetHeight+holidayBannerOffsetHeight+headerOffsetHeight+44)/2}px)`);
  }

  const cyclomediaPanel = document.querySelector('#cyclomedia-panel');
  if (isMobile.value && MapStore.cyclomediaOn) {
    cyclomediaPanel.style.setProperty('height', `calc(50dvh - ${(refinePanelOffsetHeight+holidayBannerOffsetHeight+headerOffsetHeight+84)/2}px)`);
  } else if (MapStore.cyclomediaOn) {
    cyclomediaPanel.style.setProperty('height', `calc(50dvh - ${(refinePanelOffsetHeight+holidayBannerOffsetHeight+headerOffsetHeight+44)/2}px)`);
  }

  const mapStoreMap = MapStore.map;
  mapStoreMap.resize();
};

watch(
  () => MapStore.cyclomediaOn,
  async() => {
    await nextTick();
    setHeights();
  }
);

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
    DataStore.selectedResource = selectedResource[0];
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
};

const geolocate = () => {
  clearGeocodeAndZipcode();
  MapStore.geolocate();
  MainStore.selectedZipcode = null;
}

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
  MapStore.bufferForAddressOrLocationOrZipcode = null;
  MainStore.currentSearch = null;
};

const checkServices = (row) => {
  // if (import.meta.env.VITE_DEBUG) console.log('Main.vue checkServices is running, index:', index, 'row:', row);
  const selectedServices = MainStore.selectedServices;
  if (!selectedServices.length) {
    return true;
  }
  let value;
  let selectedGroups = [];
  switch ($config.refine.type) {
    case 'categoryField_value':
      value = $config.refine.value(row);
      return selectedServices.includes(value);
    case 'categoryField_array':
      let servicesSplit = $config.refine.value(row);
      // if (import.meta.env.VITE_DEBUG) console.log('servicesSplit:', servicesSplit);
      if (typeof servicesSplit === 'string') {
        servicesSplit = servicesSplit.split(',');
      }
      if (servicesSplit) {
        let servicesFiltered = servicesSplit.filter(f => selectedServices.includes(f));
        return servicesFiltered.length == selectedServices.length;
      }
    case 'multipleFields':
      for (let field in $config.refine.multipleFields) {
        if (selectedServices.includes(field)) {
          let getter = $config.refine.multipleFields[field];
          let val = getter(row);
          if (!val) {
            return false;
          }
        }
      }
      return true;
    case 'multipleFieldGroups':
      let booleanConditions = [];
      for (let value of selectedServices) {
        // if (import.meta.env.VITE_DEBUG) console.log('value:', value);
        let valueGroup = value.split('_', 1)[0];
        if (!selectedGroups.includes(valueGroup)) selectedGroups.push(valueGroup);
      }
      for (let group of selectedGroups) {
        // if (import.meta.env.VITE_DEBUG) console.log('group:', group);
        let groupValues = [];
        for (let service of selectedServices) {
          if (service.split('_', 1)[0] === group) {
            let dependentServices = [];
            let radioOrCheckbox;
            if (group !== 'keyword' && service.split('_', 1)[0] === group && $config.refine.multipleFieldGroups[group]['radio']) radioOrCheckbox = 'radio';
            else if (group !== 'keyword' && service.split('_', 1)[0] === group && $config.refine.multipleFieldGroups[group]['checkbox']) radioOrCheckbox = 'checkbox';
            let dependentGroups = $config.refine.multipleFieldGroups[group][radioOrCheckbox][service.split('_')[1]]['dependentGroups'] || [];
            let getter = $config.refine.multipleFieldGroups[group][radioOrCheckbox][service.split('_')[1]]['value'];
            for (let service of selectedServices) {
              if (dependentGroups.length && dependentGroups.includes(service.split('_')[0])) dependentServices.push(service.split('_')[1]);
            }
            let val = getter(row, dependentServices);
            groupValues.push(val);
          }
        }
        switch ($config.refine.andOr) {
          case 'and':
            if (groupValues.includes(false)) booleanConditions.push(false);
            else booleanConditions.push(true);
            break;
          case 'or':
            if (groupValues.includes(true)) booleanConditions.push(true);
            else booleanConditions.push(false);
            break;
          default:
            if (groupValues.includes(true)) booleanConditions.push(true);
            else booleanConditions.push(false);
        }
      }

      if (booleanConditions.includes(false)) return false;
      else return true;
    default:
      return true;
  }
};

const getDistances = (row) => {
  if (import.meta.env.VITE_DEBUG) console.log('getDistances, row:', row);
  if (row.geometry) {
    let comparePoint;
    if (GeocodeStore.aisData.features) {
      comparePoint = GeocodeStore.aisData.features[0].geometry;
    } else if (MapStore.zipcodeCenter) {
      comparePoint = MapStore.zipcodeCenter;
    } else if (MapStore.geolocation) {
      comparePoint = MapStore.geolocation;
    }
    row.distance = distance(comparePoint, row.geometry, { units: 'miles' });
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
        if (tag.type == 'boolean' && row.properties[tag.field] == 'Yes') {
          description.push(tag.value);
        } else if (tag.type == 'value' && row.properties[tag.field] !== null && row.properties[tag.field] != ' ') {
          // if (import.meta.env.VITE_DEBUG) console.log('in else if, row.properties[tag.field]:', row.properties[tag.field]);
          let value = row.properties[tag.field].toLowerCase();
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
  // if (import.meta.env.VITE_DEBUG) console.log('buffer', buffer);
  let pointsAfterBuffer = database.value;
  
  // do buffer check without loop first
  if (buffer) {
    if (import.meta.env.VITE_DEBUG) console.log('Main.vue filterPoints is running, buffer:', buffer);
    pointsAfterBuffer = pointsWithinPolygon(featureCollection(database.value), buffer).features;
  }
  if (import.meta.env.VITE_DEBUG) console.log('pointsAfterBuffer', pointsAfterBuffer);

  // for (const [index, row] of [ ...pointsAfterBuffer.entries( )]) {
  for (let row of pointsAfterBuffer) {
    // if (import.meta.env.VITE_DEBUG) console.log('row:', row);
    let booleanKeywords = true;
    let booleanServices = checkServices(row);

    if (booleanServices) {
      booleanKeywords = checkKeywords(row);
    }

    // only get distances if there is a reason
    if (buffer && booleanServices && booleanKeywords) {
      getDistances(row);
    } else {
      row.distance = null;
    }

    // if (import.meta.env.VITE_DEBUG) console.log('booleanServices:', booleanServices, 'booleanKeywords:', booleanKeywords);
    if (booleanServices && booleanKeywords) {
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

const popupClicked = () => {
  if (import.meta.env.VITE_DEBUG) console.log('popupClicked is running');
  if (isMobile.value) {
    toggleToList();
  }
};

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
          @popup-clicked="popupClicked"
        />
          <!-- @geolocate-control-fire="geolocateControlFire" -->
      </div>
    </div>

  </div>
  <div
    v-show="toggleButtonsVisible"
    class="toggle-buttons-holder"
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
