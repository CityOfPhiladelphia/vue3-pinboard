import { defineStore, acceptHMRUpdate } from 'pinia';
import axios from 'axios';

import { useConfigStore } from './ConfigStore.js';

export const useDataStore = defineStore('DataStore', {
  state: () => {
    return {
      // printCheckboxes: [],
      selectedResource: null,
      latestSelectedResourceFromExpand: null,
      appType: null,
      sources: {},
      databaseWithoutHiddenItems: [],
      currentData: [],
      subsections: {},
      zipcodes: {},
      holidays: {},
      loadingSources: true,
    };
  },

  actions: {
    async fillAppType() {
      const ConfigStore = useConfigStore();
      this.appType = ConfigStore.config.app.type;
    },
    async fillResources() {
      const ConfigStore = useConfigStore();
      const appType = ConfigStore.config.app.type;
      const data = ConfigStore.config.dataSources[appType];
      const params = data.options.params;
      const response = await axios.get(data.url, { params });
      if (response.status === 200) {
        let data = await response.data;
        if (import.meta.env.VITE_DEBUG) console.log('data:', data, 'params:', params);

        // if (this.$config.hiddenRefine) {
        //   for (let field in this.$config.hiddenRefine) {
        //     let getter = this.$config.hiddenRefine[field];
        //     let val = getter(value);
        //     if (val === false) {
        //       delete database[key];
        //     }
        //   }
        // }
  
        // for (let [rowKey, rowValue] of Object.entries(value)) {
        //   if ( rowKey == 'hide_on_finder' && rowValue == true ){
        //     //console.log('deleted entry', database[key])
        //     delete database[key];
        //   }
        // }

        for (let i=0; i<data.features.length; i++) {
          data.features[i]._featureId = appType + '_' + i;
          data.features[i].properties._featureId = appType + '_' + i;
        }
        this.sources[appType] = response;
        this.loadingSources = false;
        return;
      }
    },
    async fillZipcodes() {
      try{
        let url = '//services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Zipcodes_Poly/FeatureServer/0/query';
        let params = {
          where: '1=1',
          outFields: '*',
          f: 'geojson',
          outSR: 4326,
        };

        const response = await axios.get(url, { params });
        if (response.status === 200) {
          let data = await response.data;
          this.zipcodes = data;
          if (import.meta.env.VITE_DEBUG) console.log('fillZipcodes complete, data:', data);
          return;
          // this.loadingRcos = false;
        } else {
          // this.loadingRcos = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillZipcodes - await resolved but HTTP status was not successful');
        }
      } catch {
        // this.loadingRcos = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('fillZipcodes - await never resolved, failed to fetch data');
      }
    },
    async fillHolidays() {
      try {
        const response = await fetch(`https://api.phila.gov/phila/trashday/v1`);
        if (response.ok) {
          const data = await response.json()
          this.holidays = data.holidays;
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('stormwaterData - await resolved but HTTP status was not successful')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('stormwaterData - await never resolved, failed to fetch data')
      }
    },
  },
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDataStore, import.meta.hot))
};