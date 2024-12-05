import { defineStore, acceptHMRUpdate } from 'pinia';
import axios from 'axios';
import { feature, featureCollection, point } from '@turf/helpers';

import qs from 'qs';

import { useConfigStore } from './ConfigStore.js';

export const useDataStore = defineStore('DataStore', {
  state: () => {
    return {
      // printCheckboxes: [],
      agoToken: null,
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
    async fillAgoToken() {
      let data = qs.stringify({
        'f': 'json',
        'username': import.meta.env.VITE_AGO_USERNAME,
        'password': import.meta.env.VITE_AGO_PASSWORD,
        'referer': 'https://www.mydomain.com' 
      });
    
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://www.arcgis.com/sharing/rest/generateToken',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded', 
          // 'Authorization': 'Basic Og=='
        },
        data : data
      };
    
      await axios.request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        this.agoToken = response.data;
        // this.$store.commit('setAgoToken', response.data.token);
      })
      .catch((error) => {
        console.log(error);
      });
    },
    // async fillExtraData() {
    //   const ConfigStore = useConfigStore();
    //   const appType = ConfigStore.config.app.type;
    // },
    async fillResources() {
      const $config = useConfigStore().config;

      for (let source in $config.dataSources) {
        
        const dataConfig = $config.dataSources[source];
        const params = dataConfig.options.params;
        if ($config.agoTokenNeeded) {
          params.token = this.agoToken.token;
        };
        
        let dependent;
        if (dataConfig.dependent) {
          dependent = this.sources[dataConfig.dependent];
        }
        console.log('source:', source, 'dataConfig:', dataConfig, 'params:', params, 'dependent:', dependent);

        if (params.where && typeof params.where === 'function') {
          params.where = params.where(dependent.data);
        }

        const response = await axios.get(dataConfig.url, { params });
        if (import.meta.env.VITE_DEBUG) console.log('fillResources is running, params:', params, 'response:', response);
        
        if (response.status === 200) {
          let data = await response.data;

          console.log('dataConfig.options.success:', dataConfig.options.success, 'dependent:', dependent);
          if (dataConfig.options.success) {
            dataConfig.options.success(data, dependent);
          }
          // if (import.meta.env.VITE_DEBUG) console.log('data:', data, 'params:', params);

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

          if (data.features) {
            console.log('data.features.length:', data.features.length);
            data.features = data.features.filter(item => item.geometry);
            console.log('data.features.length:', data.features.length);
            // data.features = data.features.filter(item => item.hide_on_finder !== true);
            // let j = 0;
            // let badData = [];
            for (let i=0; i<data.features.length; i++) {
              if (data.features[i].geometry) {
                data.features[i]._featureId = source + '_' + i;
                data.features[i].properties._featureId = source + '_' + i;
                // badData.push(i);
                // j = j+1;
              }
            }
            // for (let i=badData.length-1; i>=0; i--) {
            //   data.features.splice(badData[i], 1);
            // }
          } else if (data.rows) {
            data.features = [];
            let j = 0;
            for (let i=0; i<data.rows.length; i++) {
              // data.rows[i]._featureId = source + '_' + i;
              if (data.rows[i].lon && data.rows[i].lat) {
                // const geo = point([data.rows[i].lon, data.rows[i].lat]);
                // console.log('geo:', geo);
                data.features[j] = point([data.rows[i].lon, data.rows[i].lat], data.rows[i]);
                data.features[j]._featureId = source + '_' + j;
                data.features[j].properties._featureId = source + '_' + j;
                j = j+1;
              }
            }
            delete data.rows;
          } else if (data.length > 0) {
            response.features = [];
            // let features = [];
            console.log('3rd option, data.features:', response.features);
            let j = 0;
            for (let i=0; i<data.length; i++) {
              // data.rows[i]._featureId = source + '_' + i;
              if (data[i].longitude && data[i].latitude) {
                // const geo = point([data.rows[i].lon, data.rows[i].lat]);
                // console.log('geo:', geo);
                response.features[j] = point([data[i].longitude, data[i].latitude], data[i]);
                response.features[j]._featureId = source + '_' + j;
                response.features[j].properties._featureId = source + '_' + j;
                j = j+1;
              }
            }
            console.log('3rd option 2, data.features:', response.features);
          }
          this.sources[source] = response;
        }
      }
      this.loadingSources = false;
      return;
    },
    async fillZipcodes() {
      try{
        let url = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Zipcodes_Poly/FeatureServer/0/query';
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