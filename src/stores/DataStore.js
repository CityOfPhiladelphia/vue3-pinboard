import { defineStore, acceptHMRUpdate } from 'pinia';
import { point } from '@turf/helpers';
import { useConfigStore } from './ConfigStore.js';
import axios from 'axios';

export const useDataStore = defineStore('DataStore', {
  state: () => {
    return {
      agoToken: null,
      selectedResource: null,
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
      const response = await fetch('https://www.arcgis.com/sharing/rest/generateToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'f': 'json',
          'username': import.meta.env.VITE_AGO_USERNAME,
          'password': import.meta.env.VITE_AGO_PASSWORD,
          'referer': 'https://www.mydomain.com'
        })
      })
      const data = await response.json();
      this.agoToken = data;
    },
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
        if (import.meta.env.VITE_DEBUG) console.log('source:', source, 'dataConfig:', dataConfig, 'params:', params, 'dependent:', dependent);

        if (params && params.where && typeof params.where === 'function') {
          params.where = params.where(dependent.data);
        }
        console.log('params:', params);

        let response;
        if (dataConfig.bearer) {
          response = await axios.get(dataConfig.url, params );
        } else {
          response = await axios.get(dataConfig.url, { params } );
        }
        if (import.meta.env.VITE_DEBUG) console.log('fillResources is running, params:', params, 'response:', response);

        if (response.status === 200) {
          let data = await response.data;

          if (import.meta.env.VITE_DEBUG) console.log('dataConfig.options.success:', dataConfig.options.success, 'dependent:', dependent);
          if (dataConfig.options.success) {
            if (dataConfig.replaceOnSuccess) {
              data.rows = dataConfig.options.success(data);
            } else {
              dataConfig.options.success(data, dependent);
            }
          }

          if (data.features) {
            if (import.meta.env.VITE_DEBUG) console.log('first option, data.features.length:', data.features.length);
            // data.features = data.features.filter(item => item.geometry);
            data.features = data.features.filter(item => item.hide_on_finder !== true);
            if ($config.hiddenRefine) {
              for (let field in $config.hiddenRefine) {
                let getter = $config.hiddenRefine[field];
                data.features = data.features.filter(item => getter(item) == true);
              }
            }
            if (import.meta.env.VITE_DEBUG) console.log('data.features.length:', data.features.length);
            for (let i=0; i<data.features.length; i++) {
              data.features[i]._featureId = source + '_' + i;
              data.features[i].properties._featureId = source + '_' + i;
            }
          } else if (data.rows) {
            if (import.meta.env.VITE_DEBUG) console.log('2nd option, data.rows.length:', data.rows.length);
            data.features = [];
            let j = 0;
            for (let i=0; i<data.rows.length; i++) {
              if (data.rows[i].lon && data.rows[i].lat) {
                data.features[j] = point([data.rows[i].lon, data.rows[i].lat], data.rows[i]);
              } else {
                data.features[j] = point([0, 0], data.rows[i]);
                data.features[j].geometry = null;
              }
              data.features[j]._featureId = source + '_' + j;
              data.features[j].properties._featureId = source + '_' + j;
              j = j+1;
              if ($config.hiddenRefine) {
                for (let field in $config.hiddenRefine) {
                  let getter = $config.hiddenRefine[field];
                  data.features = data.features.filter(item => getter(item) == true);
                }
              }
            }
            delete data.rows;
          } else if (data.length > 0) {
            response.features = [];
            if (import.meta.env.VITE_DEBUG) console.log('3rd option, data:', data, 'response.features:', response.features);
            let j = 0;
            for (let i=0; i<data.length; i++) {
              if (data[i].longitude && data[i].latitude) {
                response.features[j] = point([data[i].longitude, data[i].latitude], data[i]);
              } else {
                response.features[j] = point([0, 0], data[i]);
                response.features[j].geometry = null;
              }
              response.features[j]._featureId = source + '_' + j;
              response.features[j].properties._featureId = source + '_' + j;
              j = j+1;
            }
            if ($config.hiddenRefine) {
              for (let field in $config.hiddenRefine) {
                let getter = $config.hiddenRefine[field];
                response.features = response.features.filter(item => getter(item) == true);
              }
            }
            if (import.meta.env.VITE_DEBUG) console.log('3rd option 2, response:', response, 'response.features:', response.features);
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
        } else {
           console.warn('fillZipcodes - await resolved but HTTP status was not successful');
        }
      } catch {
         console.error('fillZipcodes - await never resolved, failed to fetch data');
      }
    },
    async fillHolidays() {
      try {
        const response = await fetch(`https://api.phila.gov/phila/trashday/v1`);
        if (response.ok) {
          const data = await response.json()
          this.holidays = data.holidays;
        } else {
           console.warn('stormwaterData - await resolved but HTTP status was not successful')
        }
      } catch {
         console.error('stormwaterData - await never resolved, failed to fetch data')
      }
    },
  },
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDataStore, import.meta.hot))
};
