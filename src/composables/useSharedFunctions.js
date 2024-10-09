
import transforms from '../util/transforms.js';
import $config from '@/app/main.js'

import { useRoute } from 'vue-router';
// const route = useRoute();
// console.log('route:', route);

export default function useSharedFunctions() {
  
  const i18nLocale = 'en-us';
  
  const getSiteName = (item) => {
    const route = useRoute();
    // console.log('in getSiteName, item:', item, 'transforms:', transforms, 'this.$i18n.messages:', this.$i18n.messages, 'this.i18nLocale:', this.i18nLocale);
    if (!item) {
      return;
    }
    let valOrGetter = $config.locationInfo.siteName;
    const valOrGetterType = typeof valOrGetter;
    let val;

    let currentQuery = route.query;
    let currentQueryKeys = Object.keys(currentQuery);

    if (valOrGetterType === 'function') {
      // const state = this.$store.state;
      const getter = valOrGetter;
      if (currentQueryKeys.includes('address') || currentQueryKeys.includes('zipcode')) {// || this.$store.state.map.watchPositionOn) {
        // console.log('item:', item);
        if (item && item.distance) {
          val = '(' + item.distance.toFixed(2) + ' ' + this.$i18n.messages[this.i18nLocale]['miles'] + ') ' + getter(item, transforms);
        } else {
          // console.log('getSiteName else is running');
          // val = '(' + item.distance.toFixed(2) + ' miles) ' + getter(state);
          // val = getter(state);
          val = getter(item, transforms);
        }
      } else {
        if (item) {
          val = getter(item, transforms);
        } //else {
        //   val = getter(state);
        // }
      }

    } else {
      if (currentQueryKeys.includes('address')) {
        // console.log('item:', item);
        if (item.distance) {
          val = item.distance.toFixed(2) + ' miles - ' + item[valOrGetter];
        } else {
          val = item[valOrGetter];
        }
      } else {
        val = item[valOrGetter];
      }
    }
    // console.log('getSiteName val:', val);
    return val;
  };

  const getProjection = (item) => {
    let val;
    if ($config && $config.projection) {
      let valOrGetter = $config.projection;
      const valOrGetterType = typeof valOrGetter;
      

      if (valOrGetterType === 'function') {
        // const state = this.$store.state;
        const getter = valOrGetter;
        if (item) {
          val = getter(item);
        } //else {
          // val = getter(state);
        // }
      } else {
        val = valOrGetter;
      }
    }
    return val;
  };

  return {
    getSiteName,
    getProjection,
  };

};

