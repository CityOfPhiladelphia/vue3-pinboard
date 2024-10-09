import { defineStore } from 'pinia'
import axios from 'axios';

import data from '@/app/data-sources/covid-free-meal-sites.js';
const params = data.options.params;
console.log('params:', params, 'data:', data, 'data.options:', data.options, 'data.options.params:', data.options.params);

export const useDataStore = defineStore('DataStore', {
  state: () => {
    return {
      covidFreeMealSites: {},
      printCheckboxes: [],
      selectedResources: {},
    };
  },

  actions: {
    async fillCovidFreeMealSites() {
      console.log('data:', data, 'params:', params);
      const response = await axios.get(data.url, { params });
      if (response.status === 200) {
        let data = await response.data;
        // let features = data.features;
        for (let i=0; i<data.features.length; i++) {
          data.features[i]._featureId = 'covidFreeMealSites_' + i;
        }
        this.covidFreeMealSites = data;
      }
    }
  },
});