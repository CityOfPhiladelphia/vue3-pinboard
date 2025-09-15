<script setup>
// VUE IMPORTS
import { ref, computed, getCurrentInstance, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { findIconDefinition } from '@fortawesome/fontawesome-svg-core';

// COMPONENT IMPORTS
import Radio from '@phila/phila-ui-radio';
import TooltipCheckbox from './TooltipCheckbox.vue';
import IconToolTip from './IconToolTip.vue';

// STORES IMPORTS
import { useMainStore } from '../stores/MainStore.js';
import { useMapStore } from '../stores/MapStore.js';
import { useGeocodeStore } from '../stores/GeocodeStore.js';
import { useDataStore } from '../stores/DataStore.js';
import { useConfigStore } from '../stores/ConfigStore.js';

// STORES
const MapStore = useMapStore();
const MainStore = useMainStore();
const GeocodeStore = useGeocodeStore();
const DataStore = useDataStore();
const ConfigStore = useConfigStore();

// ROUTER
const route = useRoute();
const router = useRouter();

// PROPS
const props = defineProps({
  refineTitle: {
    type: String,
    default: 'FILTER',
  },
});

// EMITS
const $emit = defineEmits(['geolocate-control-fire']);

// REFs
const selected = ref();
const selectedList = ref({});
const viewerHeight = ref(window.innerHeight);
const appHeaderHeight = ref(document.querySelector('#app-header').offsetHeight);
const refineTopHeight = ref(46);

// INITIALIZE
const $config = ConfigStore.config;
const instance = getCurrentInstance();
const { t } = useI18n();
selected.value = ($config.refine.type === 'categoryField_value') ? null : [];

// COMPUTED VALUES
const addressEntered = computed(() => {
  if (geocode.value && geocode.value.data && geocode.value.data.properties && geocode.value.data.properties.street_address) {
    return geocode.value.data.properties.street_address;
  }
  return route.query.address ? route.query.address : null;
});

const angleIconWeight = computed(() => { return findIconDefinition({ prefix: 'far', iconName: 'angle-down' }) ? 'far' : 'fas' });
const anyValueEntered = computed(() => { return (zipcodeEntered.value != null || addressEntered.value != null || keywordsEntered.value.length != 0) });
const bottomHeight = computed(() => { return viewerHeight.value - (appHeaderHeight.value + refineTopHeight.value) });
const database = computed(() => { return DataStore.sources[DataStore.appType] ? (DataStore.sources[DataStore.appType].data.rows || DataStore.sources[DataStore.appType].data.features || DataStore.sources[DataStore.appType].data) : {} });
const dropdownRefine = computed(() => { return $config.dropdownRefine ? true : false });
const geocode = computed(() => { return GeocodeStore.aisData });
const i18nEnabled = computed(() => { return $config.i18n && $config.i18n.enabled });
const i18nLocale = computed(() => { return instance.appContext.config.globalProperties.$i18n.locale });
const isMobile = computed(() => { return MainStore.windowDimensions.width < 768 });
const keywordsEntered = computed(() => { return MainStore.selectedKeywords });
const NumRefineColumns = computed(() => { return isMobile.value ? 1 : 4 });
const refineList = computed(() => { return MainStore.refineList });

const refineListTranslated = computed(() => {
  if (!refineList.value || !Object.keys(refineList.value).length) return {};
  switch (refineType.value) {
    case 'categoryField_value': { return refineListTranslated_categoryField() };
    case 'multipleFieldGroups': { return refineListTranslated_multipleFieldGroups() };
    case 'multipleDependentFieldGroups': { return refineListTranslated_multipleDependentFieldGroups() };
    default: { return refineListTranslated_default() };
  }
});

const refineOpen = computed(() => { return MainStore.refineOpen });

const refinePanelClass = computed(() => {
  if (isMobile.value) { return refineOpen.value ? 'refine-panel refine-panel-open invisible-scrollbar' : 'refine-panel refine-panel-closed invisible-scrollbar' };
  if (retractable.value) { return refineOpen.value ? 'refine-panel refine-retractable-open refine-panel-non-mobile invisible-scrollbar' : 'refine-panel refine-retractable-closed refine-panel-non-mobile-closed invisible-scrollbar' };
  return $config.dropdownRefine ? 'refine-panel refine-dropdown-closed refine-panel-non-mobile-closed invisible-scrollbar' : 'refine-panel refine-panel-non-mobile invisible-scrollbar';
});

const refineTitleClass = computed(() => { return retractable.value ? 'retractable-refine-title' : null });
const refineType = computed(() => { return $config.refine ? $config.refine.type : null });
const retractable = computed(() => { return ($config.retractableRefine) ? true : false });

const searchDistance = computed(() => {
  const distance = MapStore.searchDistance;
  const word = distance == 1 ? t('mile') : t('miles');
  return distance + ' ' + word;
});

const selectedArray = computed(() => {
  // if (import.meta.env.VITE_DEBUG) console.log('selectedArray computed is running, selected.value:', selected.value, 'selectedList.value:', selectedList.value);
  const selL = { ...selectedList.value };
  const compiled = [];
  if (Object.keys(selL).length) {
    Object.keys(selL).forEach((value) => {
      const valSplit = value.split('_')[0];
      if (valSplit === 'radio' && !(typeof selL[value] === 'string')) {
        compiled.push(selL[value][0]);
      }
      else if (valSplit === 'radio' || (valSplit === 'checkbox' && !Array.isArray(selL[value]))) {
        compiled.push(selL[value]);
      }
      else { selL[value].forEach((sel) => { compiled.push(sel) }) }
    })
  }
  else if (selected.value && selected.value.length) {
    refineType.value === 'categoryField_value' ? compiled.push(selected.value) : selected.value.forEach((selected) => { compiled.push(selected) });
  }
  return compiled;
});

const selectedServices = computed(() => { return MainStore.selectedServices })
const timesIconWeight = computed(() => { return findIconDefinition({ prefix: 'far', iconName: 'times' }) ? 'far' : 'fas' });
const zipcodeEntered = computed(() => { return MainStore.selectedZipcode });

// WATCHERS
watch(
  () => database.value,
  async nextDatabase => {
    getRefineSearchList();
  }
);

watch(
  () => selectedServices.value.length,
  async nextSelectedServices => {
    // if (import.meta.env.VITE_DEBUG) console.log('RefinePanel watch selectedServices is firing, selectedServices.value:', selectedServices.value);
    selected.value = selectedServices.value.length ?
      $config.refine.type === 'categoryField_value' ? selectedServices.value[0] : selectedServices.value :
      $config.refine.type === 'categoryField_value' ? null : [];

    for (let key of Object.keys(refineList.value)) {
      for (let key2 of Object.keys(refineList.value[key])) {
        if (key2 === 'radio' || key2 === 'checkbox') {
          const uniq = getUniqueFieldsObject();
          selectedList.value = selected.value.length ? getSelectedNowObject(uniq) : {};
        }
      }
    }
  }
);

watch(
  () => selectedArray.value,
  async (nextSelected, lastSelected) => {
    if (nextSelected === lastSelected) return;
    // if (import.meta.env.VITE_DEBUG) console.log('watch selectedArray is firing, nextSelected:', nextSelected, 'lastSelected:', lastSelected);
    // checked MainStore.clearAllClicked condition so that this doesn't re-route again if clearAll is clicked
    if (!arraysEqual(nextSelected, lastSelected) && !MainStore.clearAllClicked) {
      const startQuery = { ...route.query };
      if (nextSelected.length) {
        router.push({ query: { ...startQuery, ...{ services: nextSelected.join(',') } } });
      }
      else {
        delete startQuery['services'];
        router.push({ query: { ...startQuery } });
      }
    }
    await nextTick();
    refineTopHeight.value = document.querySelector('#refine-top').offsetHeight;

    // sets MainStore.clearAllClicked back to false so that this watch can set the route
    MainStore.clearAllClicked = false;
  }
);

// ON MOUNTED
onMounted(async () => {
  // if (import.meta.env.VITE_DEBUG) console.log('refinePanel.vue mounted, library:', library);
  const divButton = document.querySelector('#refine-top');
  divButton.addEventListener('keypress', activate.bind(this));
  function activate(e) {
    if (e.type === 'keypress' && [13, 32].includes(e.keyCode) && e.srcElement.id == 'refine-top') expandRefine();
  };
  await getRefineSearchList();

  if (route.query.services) selected.value = (refineType.value !== 'categoryField_value') ? route.query.services.split(',') : route.query.services;

  if (refineType.value === 'multipleFieldGroups') {
    selected.value.forEach((service) => {
      const serviceType = service.split('_')[0];
      const checkboxOrRadio = Object.keys($config.refine.multipleFieldGroups[serviceType])[0];
      const category = checkboxOrRadio + '_' + serviceType;
      if (checkboxOrRadio == 'checkbox') {
        if (!selectedList.value[category] || selectedList.value[category].includes(service)) {
          selectedList.value[category] = [];
        }
        selectedList.value[category].push(service);
      }
      else { // radio
        selectedList.value[category] = service;
      }
    })
  }
});

// UTILITY FUNCTIONS
const arraysEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  const aSorted = a.slice(0).sort();
  const bSorted = b.slice(0).sort();
  for (var i = 0; i < a.length; ++i) {
    if (aSorted[i] !== bSorted[i]) return false;
  }
  return true;
}

const calculateColumns = (ind, indName) => {
  // if (import.meta.env.VITE_DEBUG) console.log('calculateColumns is running, indName:', indName, 'ind:', ind, '$config.refine.columns', $config.refine.columns, '$config.refine.multipleFieldGroups', $config.refine.multipleFieldGroups);
  if (isMobile.value) {
    return 1;
  }
  if ($config.refine.columns) {
    return ($config.refine.multipleFieldGroups[indName].columns) ? $config.refine.multipleFieldGroups[indName].columns : 1;
  }
  return Object.keys(ind).length;
};

const clearAll = async (e) => {
  e.stopPropagation();
  // sets clearAllClicked flag to true, so that RefinePanel watch selectedArray doesn't re-route
  MainStore.clearAllClicked = true;
  const startQuery = { ...route.query };

  // delete query fields
  delete startQuery['address'];
  delete startQuery['zipcode'];
  delete startQuery['keyword'];
  delete startQuery['services'];
  router.push({ query: { ...startQuery } });

  // set stores to empty values
  MainStore.selectedKeywords = [];
  MainStore.selectedZipcode = null;
  MapStore.zipcodeCenter = [];
  selected.value = (refineType.value === 'categoryField_value') ? null : [];
};

const closeAddressBox = (e, box) => {
  e.stopPropagation();
  // if (import.meta.env.VITE_DEBUG) console.log('closeAddressBox is running, e:', e, 'box:', box, 'startQuery:', startQuery);
  const startQuery = { ...route.query };
  delete startQuery['address'];
  router.push({ query: { ...startQuery } });
};

const closeBox = (e, box) => {
  e.stopPropagation();
  if (refineType.value === 'categoryField_value') {
    selected.value = null;
    selectedList.value = [];
    return;
  }

  const section = box.split('_')[0];
  if (selectedList.value['checkbox_' + section]) {
    const boxIndex = selectedList.value['checkbox_' + section].indexOf(box);
    selectedList.value['checkbox_' + section].splice(boxIndex, 1);
    return;
  }

  if (selectedList.value['radio_' + section]) {
    const test = 'radio_' + section;
    const { [test]: removedProperty, ...exceptBoth } = selectedList.value; selectedList.value = exceptBoth;
    const boxIndex = selected.value.indexOf(box);
    selected.value.splice(boxIndex, 1);
    return;
  }

  if (selected.value.includes(section)) {
    const boxIndex = selected.value.indexOf(section);
    selected.value.splice(boxIndex, 1);
    return;
  }
};

const closeKeywordsBox = (e, box) => {
  e.stopPropagation();
  // if (import.meta.env.VITE_DEBUG) console.log('closeKeywordsBox is running, e:', e);
  const startQuery = { ...route.query };
  let keywordsArray = [];

  if (startQuery.keyword.length) {
    if (typeof startQuery.keyword === 'string') {
      keywordsArray = startQuery.keyword.split(',');
    }
    else if (Array.isArray(startQuery.keyword) && startQuery.keyword.length) {
      keywordsArray = startQuery.keyword;
    }
  }
  router.push({ query: { ...route.query, ...{ keyword: keywordsArray } } });
  MainStore.selectedKeywords = keywordsArray;
};

const closeZipcodeBox = (e, box) => {
  e.stopPropagation();
  // if (import.meta.env.VITE_DEBUG) console.log('closeZipcodeBox is running');
  const startQuery = { ...route.query };
  delete startQuery['zipcode'];
  router.push({ query: { ...startQuery } });
  MainStore.selectedZipcode = null;
  MapStore.zipcodeCenter = [];
};

const expandCheckbox = (ind) => { refineList.value[ind].expanded = !refineList.value[ind].expanded };
const expandRefine = () => { MainStore.refineOpen = !MainStore.refineOpen };
const getBoxValue = (box) => { return (box && typeof box != 'object') ? box.replace("_", ".") : null };

const getCategoryFieldValue = (selected) => {
  if (!selected.length) return null;
  const selectedLower = selected.toLowerCase().replaceAll(' ', '');
  const i18nCategories = Object.keys(ConfigStore.config.i18n.data.messages[i18nLocale.value].sections);
  for (let category of i18nCategories) {
    const categoryLower = category.toLowerCase().replaceAll(' ', '');
    if (categoryLower === selectedLower || categoryLower === selectedLower + 's') return category;
  }
};

const getRefineSearchList = async () => {
  const refineType = $config.refine ? $config.refine.type : null;
  if (refineType === 'multipleFields') return MainStore.refineList = Object.keys($config.refine.multipleFields).sort();
  if (refineType === 'multipleFieldGroups') {
    const uniq = getUniqueFieldsObject();
    return MainStore.refineList = uniq;
  }
  const refineData = (database.value && database.value.records) ? database.value.records : database.value;
  return MainStore.refineList = Array.from(getUniqueServices(refineData).sort(), (value) => new Object({
    data: value,
    textLabel: value,
    tooltip: $config.infoCircles && Object.keys($config.infoCircles).includes(value) ? $config.infoCircles[value] : null,
  }))
};

const getSelectedNowObject = (uniqueObject) => {
  const selectedNow = {};
  Object.keys(uniqueObject).forEach((group) => {
    Object.keys(uniqueObject[group]).forEach((dep) => {
      Object.keys(uniqueObject[group][dep]).forEach((field) => {
        if (selected.value.includes(uniqueObject[group][dep][field].unique_key)) {
          if (dep == 'checkbox') {
            if (!selectedNow['checkbox_' + group]) {
              selectedNow['checkbox_' + group] = [];
            }
            selectedNow['checkbox_' + group].push(uniqueObject[group][dep][field].unique_key);
          }
          else if (dep == 'radio') {
            selectedNow['radio_' + group] = uniqueObject[group][dep][field].unique_key;
          }
        }
      })
    })
  })
  return selectedNow;
}

const getUniqueFieldsObject = () => {
  const uniq = {};
  Object.keys($config.refine.multipleFieldGroups).forEach((group) => {
    uniq[group] = { expanded: false };
    Object.keys($config.refine.multipleFieldGroups[group]).forEach((dep) => {
      uniq[group][dep] = (dep === 'tooltip') ? $config.refine.multipleFieldGroups[group][dep] :
        Object.fromEntries(Object.keys($config.refine.multipleFieldGroups[group][dep]).map((field) =>
          [field, new Object({
            unique_key: $config.refine.multipleFieldGroups[group][dep][field].unique_key,
            utooltip: $config.refine.multipleFieldGroups[group][dep][field].tooltip,
            box_label: $config.refine.multipleFieldGroups[group][dep][field].i18n_key ? $config.refine.multipleFieldGroups[group][dep][field].i18n_key : field
          })]
        ))
    })
  })
  return uniq;
}

const scrollToTop = () => {
  document.querySelector('.refine-panel').scrollTo(0, 0);
};

// REFINE TRANSLATED FUNCTIONS
const refineListTranslated_categoryField = () => {
  return Array.from(refineList.value, (category) => new Object({
    value: category.data,
    text: t(category.data),
  }))
}

const refineListTranslated_multipleFieldGroups = () => {
  return !refineList.value ? {} :
    Object.fromEntries(Object.keys(refineList.value).map((category) =>
      [category, Object.fromEntries(Object.keys(refineList.value[category]).map((dep) =>
        [dep, (dep === 'tooltip') ? t(refineList.value[category][dep].tip) :
          Array.from(Object.keys(refineList.value[category][dep]), (box) => new Object({
            data: refineList.value[category][dep][box].unique_key,
            textLabel: t(refineList.value[category][dep][box].box_label),
            tooltip: refineList.value[category][dep][box].tooltip ? {
              tip: t(refineList.value[category][dep][box].tooltip.tip),
              multiline: refineList.value[category][dep][box].tooltip.multiline,
            } : null,
          }))]
      ))]
    ))
}

const refineListTranslated_multipleDependentFieldGroups = () => {
  return Object.fromEntries(Object.keys(refineList.value).map((category) =>
    [category, Object.fromEntries(Object.keys(refineList.value[category]).map((dep) =>
      [dep, Array.from(Object.keys(refineList.value[category][dep]), (box) => new Object({
        data: refineList.value[category][dep][box].unique_key,
        textLabel: t(refineList.value[category][dep][box].box_label),
        tooltip: refineList.value[category][dep][box].tooltip ? t(refineList.value[category][dep][box].tooltip) : null
      }))]
    ))]
  ))
}

const refineListTranslated_default = () => {
  return (typeof refineList.value[0] === 'string') ?
    new Object.fromEntries((refineObject) =>
      [refineObject, new Object({
        textLabel: t(refineObject),
        value: refineObject
      })]
    ) :
    Array.from(refineList.value, (refineObject) =>
      new Object.fromEntries(Object.keys(refineObject).map((category) =>
        [category, (category == 'textLabel') ? translatedObject[category] = t(refineObject[category]) : translatedObject[category] = refineObject[category]]
      ))
    )
}

</script>

<template>
  <div id="refine-panel-component" :class="refinePanelClass">

    <div id="refine-top" :class="refineTitleClass + ' refine-title is-flex is-flex-direction-row'" tabindex="0"
      role="button" @click="expandRefine">
      <div class="refine-top-left is-flex is-flex-direction-row">

        <div class="slider-icon">
          <font-awesome-icon icon="sliders-h" />
        </div>

        <h2 v-if="!i18nEnabled" class="refine-label-text">
          {{ refineTitle }}
        </h2>

        <h2 v-if="i18nEnabled" class="refine-label-text">
          {{ $t('refinePanel.refine') }}
        </h2>

        <button v-if="!i18nEnabled && (selectedArray.length || anyValueEntered)" class="clear-all"
          @click.prevent="clearAll">
          Clear all
        </button>

        <button v-if="i18nEnabled && (selectedArray.length || anyValueEntered)" class="clear-all"
          @click.prevent="clearAll" v-html="$t('refinePanel.clearAll')" />

        <!-- v-if="!isMobile" -->
        <div id="selected-boxes" class="selected-boxes columns is-mobile">
          <button v-for="box in keywordsEntered" class="box-value column is-narrow"
            @click="(e) => closeKeywordsBox(e, box)">
            {{ getBoxValue(box) }}
            <font-awesome-icon class="fa-x" :icon="[timesIconWeight, 'times']" />
          </button>

          <button v-if="zipcodeEntered" class="box-value column is-narrow"
            @click="(e) => closeZipcodeBox(e, zipcodeEntered)">
            {{ $t(getBoxValue(zipcodeEntered)) + ' - ' + searchDistance }}
            <font-awesome-icon class="fa-x" :icon="[timesIconWeight, 'times']" />
          </button>

          <button v-if="addressEntered" class="box-value column is-narrow"
            @click="(e) => closeAddressBox(e, addressEntered)">
            {{ $t(getBoxValue(addressEntered)) }}
            <font-awesome-icon class="fa-x" :icon="[timesIconWeight, 'times']" />
          </button>

          <button v-if="refineType !== 'categoryField_value'" v-for="box in selectedArray"
            class="box-value column is-narrow" @click="(e) => closeBox(e, box)">
            {{ $t(getBoxValue(box)) }}
            <font-awesome-icon class="fa-x" :icon="[timesIconWeight, 'times']" />
          </button>

          <button v-if="refineType == 'categoryField_value' && selected != null && i18nEnabled"
            class="box-value column is-narrow" @click="(e) => closeBox(e, selected)">
            {{ $t('sections.' + getCategoryFieldValue(selected) + '.header') }}
            <font-awesome-icon class="fa-x" :icon="[timesIconWeight, 'times']" />
          </button>

          <button v-if="refineType == 'categoryField_value' && selected != null && !i18nEnabled"
            class="box-value column is-narrow" @click="(e) => closeBox(e, selected)">
            {{ selected }}
            <font-awesome-icon class="fa-x" :icon="[timesIconWeight, 'times']" />
          </button>
        </div>
      </div>
      <div class="open-close-icon is-flex is-pulled-right">
        <font-awesome-icon v-if="refineOpen && retractable || refineOpen && isMobile"
          :icon="[angleIconWeight, 'angle-up']" />

        <font-awesome-icon v-if="!refineOpen && retractable || !refineOpen && isMobile"
          :icon="[angleIconWeight, 'angle-down']" />
      </div>

    </div>

    <div id="refine-bottom" class="refine-bottom invisible-scrollbar" v-show="!retractable && !isMobile || refineOpen"
      :style="isMobile ? { 'height': bottomHeight + 'px' } : null">

      <div v-if="['categoryField_array', 'multipleFields'].includes(refineType)"
        v-show="!retractable && !isMobile || refineOpen" id="field-div" class="refine-holder">
        <tooltip-checkbox :options="refineListTranslated" :numOfColumns="NumRefineColumns" :small="!isMobile"
          v-model="selected" :value="selected" value-key="data" text-key="textLabel">
        </tooltip-checkbox>
      </div>

      <div v-if="refineType == 'categoryField_value'" v-show="!retractable && !isMobile || refineOpen" id="field-div"
        class="refine-holder">
        <radio v-model="selected" :options="refineListTranslated" text-key="text" value-key="value"
          :numOfColumns="NumRefineColumns" :small="!isMobile">
        </radio>
      </div>

      <!-- if using multipleFieldGroups option and NOT dropdownRefine -->
      <div v-if="refineType === 'multipleFieldGroups' && !dropdownRefine"
        v-show="!retractable && !isMobile || refineOpen" id="multiple-field-groups-div"
        class="columns is-multiline multiple-field-groups">
        <div v-for="(ind) in Object.keys(refineListTranslated)" :id="'refine-list-' + ind" :key="ind"
          class="column is-narrow service-group-holder-x">
          <div id="columns-div-for-checkboxes" class="columns">
            <radio :id="'radio_' + ind" v-model="selectedList['radio_' + ind]" v-if="refineListTranslated[ind]['radio']"
              :options="refineListTranslated[ind]['radio']" text-key="textLabel" value-key="data" :small="!isMobile"
              :num-of-columns="calculateColumns(refineList[ind]['radio'], ind)">
              <template v-slot:label>
                <div :class="isMobile ? 'large-label' : 'small-label'">
                  {{ $t(ind + '.category') }}
                </div>
              </template>
            </radio>

            <tooltip-checkbox v-if="refineListTranslated[ind]['checkbox']"
              :options="refineListTranslated[ind]['checkbox']" :small="!isMobile"
              v-model="selectedList['checkbox_' + ind]" :value="selectedList['checkbox_' + ind]" text-key="textLabel"
              value-key="data" shrinkToFit="true" :num-of-columns="calculateColumns(refineList[ind]['checkbox'], ind)">
              <template v-slot:label>
                <div :class="isMobile ? 'large-label' : 'small-label'">
                  {{ $t(ind + '.category') }}
                  <icon-tool-tip v-if="!isMobile && refineListTranslated[ind]['tooltip']"
                    :tip="refineListTranslated[ind]['tooltip']" :circle-type="'hover'"
                    :position="refineList[ind]['tooltip']['position']"
                    :multiline="refineList[ind]['tooltip']['multiline']" />
                  <div v-if="isMobile && refineListTranslated[ind]['tooltip']" class="mobile-tooltip">
                    <font-awesome-icon icon="info-circle" class="fa-infoCircle" />
                    {{ $t(refineListTranslated[ind]['tooltip']) }}
                  </div>
                </div>
              </template>
            </tooltip-checkbox>
          </div>
        </div>
      </div>

      <!-- if using multipleFieldGroups option and dropdownRefine -->
      <div v-if="refineType === 'multipleFieldGroups' && dropdownRefine" id="multiple-field-groups-dropdown-div"
        class="columns is-multiline multiple-field-groups">
        <div v-for="(ind) in Object.keys(refineListTranslated)" :id="'refine-list-' + ind" :key="ind" class="column">

          <div id="columns-div-for-checkboxes" class="columns">
            <div class="column dropdown-checkbox-div"
              :style="{ 'width': 100 / Object.keys(refineListTranslated).length + '%' }">
              <div class="dropdown-checkbox-header" @click="expandCheckbox(ind)">
                {{ $t(ind + '.category') }}
              </div>
              <div v-if="refineList[ind].expanded" class="refine-dropdown">
                <radio :id="'radio_' + ind" v-model="selectedList['radio_' + ind]"
                  v-if="refineListTranslated[ind]['radio']" :options="refineListTranslated[ind]['radio']"
                  text-key="textLabel" value-key="data" :small="!isMobile"
                  :num-of-columns="calculateColumns(refineList[ind]['radio'], ind)">
                </radio>

                <tooltip-checkbox v-if="refineListTranslated[ind]['checkbox']"
                  :options="refineListTranslated[ind]['checkbox']" :small="!isMobile"
                  v-model="selectedList['checkbox_' + ind]" text-key="textLabel" value-key="data" shrinkToFit="true"
                  :num-of-columns="calculateColumns(refineList[ind]['checkbox'], ind)">
                </tooltip-checkbox>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isMobile && refineOpen" class="columns is-mobile mobile-clear-all">
        <div class="column is-narrow add-margin-left small-side-padding" v-if="!i18nEnabled">
          <button class="button apply-filters-button medium-side-padding" @click="expandRefine(); scrollToTop();">
            <div class="apply-filters-text">
              Apply filters
            </div>
          </button>
        </div>

        <div class="column is-narrow add-margin-left small-side-padding" v-if="i18nEnabled">
          <div class="button apply-filters-button medium-side-padding" @click="expandRefine(); scrollToTop();">
            <div v-html="$t('refinePanel.applyFilters')" class="apply-filters-text" />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "../assets/main_pin.scss";

#refine-panel-component {
  background: #f0f0f0;
  overflow-x: hidden;
}

#columns-div-for-checkboxes {

  .input-checkbox,
  .input-radio {
    padding-bottom: 8px;
  }

  .checkbox-div {
    margin-left: 0px;
    margin-right: 0px;
    margin-top: 0px;

    .control {
      margin-right: 12px;
    }
  }
}

.refine-dropdown-closed {
  height: 6rem;
}

.box-value {
  margin-left: 4px;
  margin-right: 4px;
  margin-bottom: 8px;
  padding: 4px 4px 2px 4px !important;
  height: 30px;
  border-width: 2px !important;
  border-style: solid;
  border-color: #cfcfcf;
  border-radius: 4px;
  background-color: #cfcfcf;
  box-sizing: border-box;
  font-family: "ArialMT", "Arial", sans-serif;
  font-size: 1em;
  color: #333333;
  text-align: left;
  line-height: normal;
}

.box-value:hover {
  border-color: #2176d2 !important;
}

.invisible-x-button {
  border-style: none;
  background-color: #cfcfcf;
  cursor: pointer;
}

.fa-x {
  margin-left: 4px;
  margin-right: 4px;
}

.refine-panel {
  overflow-y: hidden;

  .legend-title {
    margin-bottom: 0;
    font-weight: bold;
    font-size: 1.2rem;
    text-transform: uppercase;
  }

  @media screen and (min-width: 768px) {
    .service-group-holder-x {
      margin-bottom: 24px !important;
      padding-top: 0px;
      padding-bottom: 0px;
      margin-bottom: 10px;
      padding-left: 24px;
      padding-right: 24px;
      border-right: 1px solid #cfcfcf;

      &:last-of-type {
        border-right: none;
      }
    }

    .refine-title {
      border-style: solid;
      border-width: 2px;
      border-color: #f0f0f0;
    }

    .retractable-refine-title {
      cursor: pointer;
    }

    .retractable-refine-title:hover {
      border-color: #2176d2;
    }

    .close-button {
      height: 20px;
      border-style: none;
      background-color: rgb(240, 240, 240);
      color: #0f4d90;
      cursor: pointer;
      padding-left: 0px;
      padding-top: 8px;
      padding-right: 0px;
    }

    .refine-holder {
      padding-left: 12px;
      padding-right: 12px;
      margin: 0px;
    }
  }

  .refine-title {
    flex: 1 0 100%;
    color: #0f4d90;
    margin: 0px !important;

    .refine-top-left {
      flex-grow: 11;
    }

    .open-close-icon {
      flex-grow: 1;
      flex-direction: row-reverse;
    }

    .clear-all {
      margin-top: 12px;
      border-style: none;
      background-color: rgb(240, 240, 240);
      height: 20px;
      font-weight: bold;
      font-size: .8rem;
      color: #0f4d90 !important;
      text-decoration: underline;
      padding-left: 8px;
      padding-right: 12px;
      cursor: pointer;
    }

    .clear-button {
      background-color: rgb(0, 204, 255);
      height: 30px;
      width: 80px;
      margin-left: 10px;
      margin-right: 10px;
    }
  }

  label {
    font-weight: normal;
    cursor: pointer;
  }

  @media screen and (max-width: 767px) {
    position: relative;

    #refine-panel-component {
      max-width: 100dvw;
      margin: 0px;
    }

    .refine-bottom {
      padding: 1rem;
      margin: 0px;
      overflow-y: auto;
    }

    .refine-holder {
      padding-left: 12px;
      padding-right: 12px;
    }

    .clear-all {
      border-style: none;
      background-color: rgb(240, 240, 240);
      height: 30px;
      font-weight: bold;
      font-size: 1.063rem;
      color: #0f4d90 !important;
      text-decoration: underline;
      padding-left: 16px;
      padding-right: 12px;
      cursor: pointer;
    }

    .slider-icon {
      padding-top: 11px;
      padding-left: 14px;
      padding-bottom: 11px;
    }

    .refine-label-text {
      padding-top: 13px;
      padding-bottom: 13px;
    }

    .open-close-icon {
      padding-top: 9px;
      font-size: 26px;
    }

    #columns-div-for-checkboxes {

      .input-checkbox,
      .input-radio {
        padding-bottom: 24px;
        padding-top: 24px;
      }
    }

    .close-button {
      height: 30px;
      border-style: none;
      background-color: rgb(240, 240, 240);
      color: #0f4d90;
      padding-left: 0px;
      padding-top: 9px;
      padding-right: 0px;
    }

    .refine-title {
      cursor: pointer;
    }

    .service-group-holder-x {
      max-width: 100dvw;
      padding-top: 0px;
      padding-bottom: 12px;
      margin-left: 0px;
      margin-right: 0px;
      margin-bottom: 12px;
      border-bottom: 1px solid black;

      &:last-of-type {
        border-bottom: none;
      }
    }

    .add-margin-left {
      margin-left: 24px;
    }

    .small-side-padding {
      padding-left: 6px !important;
      padding-right: 6px !important;
    }

    .medium-side-padding {
      padding-left: 12px !important;
      padding-right: 12px !important;
    }

    #multiple-field-groups-div {
      width: 100dvw;
      padding-left: 1rem;
      padding-right: 1rem;
      margin: 0px;
    }
  }

  &.refine-panel-open {
    overflow-y: hidden;
    height: 100%;
  }
}

.mobile-clear-all {
  padding-bottom: 1.5rem;
}

.small-label {
  font-size: 16px;
}

.large-label {
  font-size: 20px;
  margin-bottom: 4px;
}

.multiple-field-groups {
  margin-left: 0px !important;
  margin-right: 0px !important;
  margin-bottom: 0px !important;
  margin-top: 12px !important;
}

.selected-boxes {
  flex-wrap: wrap;
  max-width: 80%;
  padding-top: 6px;
  margin-left: 0px !important;
  margin-right: 0px !important;
  margin-bottom: 0px !important;
  margin-top: 0px !important;
}

.dropdown-checkbox-div {
  padding: 0px !important;
  position: absolute;
  border-style: solid;
  border-width: 1px;
}

.dropdown-checkbox-header {
  padding: 0.75rem;
}

.refine-dropdown {
  background-color: rgb(240, 240, 240);
}

.input-label {
  display: inline-block;
  color: #0f4d90;
  font-size: 14px;
  margin-bottom: .5rem;
  padding-left: 10px;
}

.fa-infoCircle {
  color: #0f4d90;
  cursor: pointer;
}

.apply-filters-button {
  background-color: #0f4d90 !important;
}

.apply-filters-text {
  display: inline-block;
  color: #ffffff;
}

.slider-icon {
  padding-top: 10px;
  padding-left: 14px;
  padding-bottom: 10px;
}

.refine-label-text {
  box-sizing: border-box;
  font-family: "Montserrat-Bold", "Montserrat Bold", "Montserrat", sans-serif;
  font-weight: 700;
  color: #0f4d90;
  text-align: left;
  line-height: normal;
  padding-left: 4px;
  padding-top: 12px;
  padding-bottom: 12px;
  padding-right: 8px;
  text-transform: uppercase;
}

.input-wrap {
  padding-top: 0px !important;
}

.input-wrap.input-checkbox .is-checkradio+label:hover::before,
.input-wrap.input-radio .is-checkradio+label:hover::before {
  border-width: 2px !important;
}

.is-checkradio[type=checkbox]:focus:not([disabled])+label::before,
.is-checkradio[type=checkbox]:focus:not([disabled])+label:before,
.is-checkradio[type=radio]:focus:not([disabled])+label::before,
.is-checkradio[type=radio]:focus:not([disabled])+label:before {
  border-width: 2px !important;
  border-color: #2176d2 !important;
}

.open-close-icon {
  padding-top: 10px;
  padding-right: 6px;
  font-size: 24px;
}
</style>
