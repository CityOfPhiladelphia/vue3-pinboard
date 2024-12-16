<script setup>

import { useMainStore } from '../stores/MainStore.js';
import { useMapStore } from '../stores/MapStore.js';
import { useDataStore } from '../stores/DataStore.js';
import { useConfigStore } from '../stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted, watch } from 'vue';

const MainStore = useMainStore();
const MapStore = useMapStore();
const DataStore = useDataStore();

const route = useRoute();
const router = useRouter();

const ConfigStore = useConfigStore();
const $config = ConfigStore.config;

const $emit = defineEmits(['print-box-checked']);

const props = defineProps({
  isMapVisible: {
    type: Boolean,
    default: true,
  },
  item: {
    type: Object,
  },
  checked: {
    type: Boolean,
    default: false,
  }
});
  
const printCheckboxes = computed(() => {
  return MainStore.printCheckboxes;
})

const allowPrint = computed(() => {
  let value = false;
  if ($config.allowPrint) {
    value = true;
  }
  return value;
});

const locationClass = computed(() => {
  let value;
  if (locationOpen.value && MainStore.isMobileDevice) {
    value = 'location-content-mobile location-open';
  } else if (locationOpen.value) {
    value = 'location-content location-open';
  } else if (MainStore.isMobileDevice) {
    value = 'location-content-mobile';
  } else {
    value = 'location-content';
  }
  return value;
});

// const plusIconWeight = computed(() => {
//   let value = 'fas';
//   let regularExists = findIconDefinition({ prefix: 'far', iconName: 'plus' });
//   // console.log('expandCollapse.vue computed, library:', library, 'regularExists:', regularExists);
//   if (regularExists) {
//     value = 'far';
//   }
//   return value;
// });

const showLabels = computed(() => {
  let value = false;
  if ($config.refine.showLabels) {
    value = true;
  }
  return value;
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

// const subsections = computed(() => {
//   return $config.subsections || {};
// });

const section = computed(() => {
  let section;
  if (props.item.properties && $config.fieldsUsed) {
    section = props.item.properties[$config.fieldsUsed.section];
  }
  if ($config.subsections) {
    section = $config.subsections[props.item.properties[$config.fieldsUsed.subsection]];
  }
  return section;
});

// const sectionItem = computed(() => {
//   let sectionItem = {};
//   if (Object.keys(subsections.value).length) {
//     sectionItem = $config.sections;
//   }
//   return sectionItem;
// });

const sectionTitle = computed(() => {
  let sectionTitle;
  sectionTitle = $config.sections[section.value].titleSingular;
  return sectionTitle;
});

const sectionColor = computed(() => {
  let sectionColor;
  if (section.value) {
    sectionColor = $config.sections[section.value].color;
  }
  return sectionColor;
});

const selectedResource = computed(() => {
  return DataStore.selectedResource;
});

const latestSelectedResourceFromMap = computed(() => {
  return MapStore.latestSelectedResourceFromMap;
});

const locationOpen = ref(selectedResource.value == props.item._featureId ? true : false)

watch(
  () => selectedResource.value,
  nextSelectedResource => {
    // if (import.meta.env.VITE_DEBUG) console.log('watch selectedResource is running, nextSelectedResource:', nextSelectedResource);
    if (locationOpen.value || nextSelectedResource == props.item._featureId) {
      if (locationOpen.value === false) {
        openLocation();
      } else if (locationOpen.value && !nextSelectedResource != props.item._featureId) {
        locationOpen.value = false;
      }
    } else {
      locationOpen.value = false;
    }
  }
);

watch(
  () => props.isMapVisible,
  nextIsMapVisible => {
    // console.log('ExpandCollapse watch isMapVisible');
    if (!nextIsMapVisible) {
      if (latestSelectedResourceFromMap) {
        // console.log('ExpandCollapse is reporting map is invisible and there is a latestSelectedResourceFromMap:', latestSelectedResourceFromMap);
        if (latestSelectedResourceFromMap === props.item._featureId) {
          const el = $el;
          const visible = isElementInViewport(el);
          if (!visible) {
            console.log('ExpandCollapse in if in if');
            el.scrollIntoView({ block: 'center' });
          }
        }
      }
    }
  }
)

onMounted(() => {
    if (import.meta.env.VITE_DEBUG) console.log('ExpandCollapse mounted');//, siteName);
    if (selectedResource.value == props.item._featureId) {
      openLocation();
    }

    let values = []
    if (printCheckboxes.value.length) {
      for (let checkbox of printCheckboxes.value) {
        if (checkbox == props.item._featureId) {
          values.push(true);
        }
      }
    }
    if (values.includes(true)) {
      // console.log('ExpandCollapse mounted, values includes true, printCheckboxes:', printCheckboxes, 'props.item._featureId:', props.item._featureId, 'printCheckboxes.includes(props.item_featureId):', printCheckboxes.includes(props.item_featureId));
      document.getElementById('checkbox'+props.item._featureId).checked = true;
    }

    // window.addEventListener('keydown', (e) => {
    //   console.log('keydown is running, e', e);
    //   if (e.keyCode === 32 && e.target === document.body) {
    //     e.preventDefault();
    //   }
    // });

    // let divButton = document.querySelector('#refine-top');
    // divButton.addEventListener('keypress', activate.bind(this));
    // function activate(e) {
    //   console.log('activate, e:', e, 'e.path[0]:', e.path[0]);
    //   if (e.type === 'keypress' && [ 13, 32 ].includes(e.keyCode) && e.srcElement.id == 'refine-top') {
    //     expandRefine();
    //   }
    // };
});

const siteName = computed(() => {
  // if (import.meta.env.VITE_DEBUG) console.log('siteName computed');
  if (!props.item) {
    return;
  }
  let valOrGetter = $config.locationInfo.siteName;
  const valOrGetterType = typeof valOrGetter;
  let val;

  let currentQuery = route.query;
  let currentQueryKeys = Object.keys(currentQuery);

  if (valOrGetterType === 'function') {
    const getter = valOrGetter;
    if (currentQueryKeys.includes('address') || currentQueryKeys.includes('zipcode')) {// || this.$store.state.map.watchPositionOn) {
      // console.log('props.item:', props.item);
      if (props.item && props.item.distance) {
        val = '(' + props.item.distance.toFixed(2) + ' miles) ' + getter(props.item);
      } else {
        val = getter(props.item);
      }
    } else {
      if (props.item) {
        val = getter(props.item);
      }
    }
  } else {
    if (currentQueryKeys.includes('address')) {
      // console.log('props.item:', props.item);
      if (props.item.distance) {
        val = props.item.distance.toFixed(2) + ' miles - ' + props.item[valOrGetter];
      } else {
        val = props.item[valOrGetter];
      }
    } else {
      val = props.item[valOrGetter];
    }
  }
  // console.log('getSiteName val:', val);
  return val;
});

const clickCheckBox = (e) => {
  console.log('clickCheckBox is running, e:', e, 'props.item._featureId:', props.item._featureId);
  $emit('print-box-checked', props.item._featureId);
};

const openPrintView = (e) => {
  e.stopPropagation();
  console.log('openPrintView is running, e:', e, 'props.item._featureId:', props.item._featureId);
  window.open('./resource-view/' + props.item._featureId, '_blank');
};

const isElementInViewport = (el) => {
  console.log('el:', el);
  const rect = el.getBoundingClientRect();
  // console.log('bounding box', rect);
  const visibility = {
    // TODO the 108 below is account for the combined height of the
    // app header and address header. this is not a good long-term
    // solution - instead, use the `bottom` value of the address header's
    // bounding rect. however, this should only fire on small devices,
    // which would require again hard-coding screen breakpoints from
    // standards or some other magic, which might not a huge
    // improvement in terms of decoupling logic and presentation. hmm.
    top: rect.top >= 108,
    left: rect.left >= 0,
    bottom: rect.bottom <= (window.innerHeight || document.documentElement.clientHeight),
    right: rect.right <= (window.innerWidth || document.documentElement.clientWidth),
  };
  // console.log('visibility', visibility);

  // return if all sides are visible
  return Object.values(visibility).every(val => val);
};

const expandLocation = () => {
  // locationOpen.value = !locationOpen.value;
  MainStore.lastSelectMethod = 'row';
  const selectedResourceId = props.item._featureId;
  let query = {...route.query};
  if (import.meta.env.VITE_DEBUG) console.log('ExpandCollapse expandLocation query:', query);
  if (!locationOpen.value) {
    query['resource'] = selectedResourceId;
    router.push({ name: 'home', query });
  } else {
    delete query.resource;
    router.push({ name: 'home', query });
  }
  if (import.meta.env.VITE_DEBUG == 'true') console.log('ExpandCollapse expandLocation after selectedResource is defined');
};

const openLocation = () => {
  locationOpen.value = true;
  const el = document.getElementsByClassName(props.item._featureId)[0];
  if (import.meta.env.VITE_DEBUG) console.log('ExpandCollapse openLocation is running, el:', el);
  let visible = isElementInViewport(el);
  if (import.meta.env.VITE_DEBUG) console.log('ExpandCollapse visible 1:', visible)
  if (!visible) {
    el.scrollIntoView({ block: 'center' });
  }
};

const makeID = (itemTitle) =>{
  // console.log('itemTitle:', itemTitle);
  let value;
  if (itemTitle) {
    value = itemTitle.replace(/\s+/g, '-').toLowerCase();
  } else {
    value = '';
  }
  return value;
};

</script>

<template>
  <div class="whole-item">
    <div
      class="location-item columns is-mobile pr-2"
      :class="{ 'open': locationOpen }"
    >
      <div
        v-if="allowPrint && !MainStore.isMobileDevice"
        class="field column expand-collapse-checkbox is-1 pt-4 pb-0"
      >
        <div class="checkbox-height-fixer">
          <input
            class="is-checkradio location-checkbox"
            :id="'checkbox'+item._featureId"
            type="checkbox"
            :name="'checkbox'+item._featureId"
            @click="clickCheckBox"
          >
          <label
            :for="'checkbox'+item._featureId"
            class="checkbox-label"
          >
          </label>
        </div>
      </div>
      <div
        class="column is-12-mobile p-0"
        :class="allowPrint ? 'is-11-tablet': 'is-12-tablet pl-3'"
      >
        <div
          class="columns location-row is-mobile"
          :class="allowPrint ? 'pl-0': 'pl-2'"
          tabindex="0"
          @click="expandLocation"
          @keypress.space.prevent
          @keyup.space="expandLocation"
          @keyup.enter="expandLocation"
        >
          <div
            class="location-title column"
            :class="{ 'is-8': locationOpen && $config.printView, 'is-11': !locationOpen }"
          >
            <span
              class="h5 location-name"
              :class="item._featureId"
              :aria-expanded="locationOpen"
            >
              {{ siteName }}
              <div
                v-if="section && !i18nEnabled"
                class="section-name"
                :style="{ 'background-color': sectionColor }"
                >
                {{ sectionTitle }}
              </div>
              <div
                v-if="section && i18nEnabled"
                class="section-name"
                :style="{ 'background-color': sectionColor }"
                v-html="'<b>'+$t('categoryType.' + sectionTitle)+'</b>'"
              >
              </div>
            </span>
          </div>

          <div class="location-icon column is-1">
            <font-awesome-icon
              v-if="!locationOpen"
              class="plus-icon"
              :icon="['fas', 'plus']"
              />
              <!-- :icon="[plusIconWeight, 'plus']" -->
              <font-awesome-icon
              v-if="locationOpen"
              :icon="['fas', 'minus']"
              />
              <!-- :icon="[plusIconWeight, 'minus']" -->
          </div>
        </div>
      </div>
    </div>

    <div :class="locationClass">
      <slot />
    </div>

  </div>
</template>

<style lang="scss">

.expand-collapse-checkbox {
  margin-bottom: 0px !important;
}

.checkbox-height-fixer {
  height: 40px !important
}

// .is-checkradio[type=checkbox]+label {
//   border-width: 2px !important;
//   border-color: #2176d2 !important;
// }

// .is-checkradio[type=checkbox].location-checkbox:not([disabled])+label::before, .is-checkradio[type=checkbox].location-checkbox:not([disabled])+label:before, .is-checkradio[type=radio]:not([disabled])+label::before, .is-checkradio[type=radio]:not([disabled])+label:before {
.is-checkradio[type=checkbox].location-checkbox:not([disabled])+label::before, .is-checkradio[type=checkbox].location-checkbox:not([disabled])+label:before {
  background-color: white;
}

.is-checkradio[type=checkbox].location-checkbox:not([disabled]):checked+label::before, .is-checkradio[type=checkbox].location-checkbox:not([disabled]):checked+label:before, .is-checkradio[type=radio]:not([disabled]):checked+label::before, .is-checkradio[type=radio]:not([disabled]):checked+label:before {
  background-color: #2176d2 !important;
}

// .is-checkradio[type=checkbox].location-checkbox:hover:not([disabled])+label::before, .is-checkradio[type=checkbox].location-checkbox:hover:not([disabled])+label:before, .is-checkradio[type=radio]:hover:not([disabled])+label::before, .is-checkradio[type=radio]:hover:not([disabled])+label:before {
.is-checkradio[type=checkbox].location-checkbox:hover:not([disabled])+label::before, .is-checkradio[type=checkbox].location-checkbox:hover:not([disabled])+label:before {
  border-width: 2px !important;
  border-color: #2176d2 !important;
  background-color: white;
}

.is-checkradio[type=checkbox].location-checkbox+label:after {
  border-width: 2px !important;
  border-color: #2176d2 !important;
  background-color: white;
}

// .is-checkradio[type=checkbox]:checked+label::after, .is-checkradio[type=checkbox]:checked+label:after, .is-checkradio[type=radio]:checked+label::after, .is-checkradio[type=radio]:checked+label:after {
.is-checkradio[type=checkbox]:checked+label::after, .is-checkradio[type=checkbox]:checked+label:after {
  border-width: 2px !important;
  border-color: white !important;
  background-color: #2176d2 !important;
}

.location-name {
  line-height: .5rem;
}

.checkbox-label {
  width: 10px !important;
  margin-right: 0px !important;
  height: 56px;
}

.whole-item {
  border-bottom: 1px solid black;
}

.location-item {
  // border-bottom: 1px solid black;
  position: relative;
  height: 100%;
  padding-top: 12px;
  margin-bottom: 0px !important;

  &:hover .location-row{
    background: #2176d2;
    color: white;

    .plus-icon {
      color: white;
    }
  }

  &:hover .expand-collapse-checkbox{
    background: #2176d2;
    color: white;

    .plus-icon {
      color: white;
    }
  }

  .location-row {
    cursor: pointer;
    padding: 0px;
    margin-top: 0px !important;
    margin-bottom: 0px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;

    &:hover{
      background: #2176d2;
      color: white;

      .plus-icon {
        color: white;
      }
    }
  }

  .location-icon {
    padding-top: 1rem;
    padding-bottom: 1rem;
    text-align: right;
  }

  .section-name {
    text-transform: uppercase;
    position: relative;
    top: -3px;
    padding-left: 14px;
    padding-right: 14px;
    padding-top: 7px;
    font-size: 12px;
    border-style: solid;
    border-width: 1px;
    display: inline-block;
    color: white;
    height: 24px;
  }

  &.open{
    .location-row {
      color:white;
      background-color: #0f4d90;
    }

    .expand-collapse-checkbox {
      color:white;
      background-color: #0f4d90;
    }

    h2 {
      font-weight: 900 !important;
    }
  }

  .location-content{
    overflow: hidden;
    height:0;

    &.location-open{
      padding-top: 1rem;
      padding-bottom: 1rem;
      padding-right: 0px;
      padding-left: 0px;
      height: 100%;
      overflow: initial;
    }
  }

  .location-content-mobile{
    overflow: hidden;
    height:0;

    &.location-open{
      padding-top: 1rem;
      padding-bottom: 1rem;
      padding-right: 0px;
      padding-left: 0px;
      height: 100%;
      overflow: initial;
    }
  }
}

.plus-icon {
  color: #0f4d90;
}

.print-view-button {
  padding-left: 5px !important;
  padding-right: 5px !important;
}

.print-button {
  padding-left: 5px !important;
  padding-right: 5px !important;
}

.location-item {
  .location-title {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
}

@media (max-width: 499px) {
  .print-view-button {
    display: none !important;
  }

  .location-item {
    .location-title {
      padding-left: 1rem;
    }
  }
} 

@media (min-width: 500px) and (max-width: 767px) {
  .print-button {
    display: none !important;
  }

  .location-item {
    .location-title {
      padding-left: 1rem;
    }
  }
} 

@media (min-width: 768px) and (max-width: 1049px) {
  .print-view-button {
    display: none !important;
  }

  .location-item {
    .location-title {
      padding-left: 1rem;
    }
  }
}

@media (min-width: 1050px) {
  .print-button {
    display: none !important;
  }

  .location-item {
    .location-title {
      padding-left: 0rem;
    }
  }
} 

</style>
