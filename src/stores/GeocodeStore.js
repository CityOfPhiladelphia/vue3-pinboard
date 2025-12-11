import { defineStore, acceptHMRUpdate } from 'pinia';

export const useGeocodeStore = defineStore("GeocodeStore", {
  state: () => {
    return {
      aisDataChecked: {},
      aisData: {},
    };
  },

  actions: {
    async fillAisData(address) {
      try {
        if (import.meta.env.VITE_DEBUG) console.log('Address - fillAisData is running, address:', address)
        const response = await fetch(`https://api.phila.gov/ais/v1/search/${encodeURIComponent(address)}?include_units=false`)
        if (response.ok) {
          if (import.meta.env.VITE_DEBUG) console.log('Address - await resolved and HTTP status is successful')
          this.aisData = await response.json()
        } else {
          if (import.meta.env.VITE_DEBUG) console.log('Address - await resolved but HTTP status was not successful')
          this.aisData = await response.json()
        }
      } catch {
        if (import.meta.env.VITE_DEBUG) console.error('Address - await never resolved, failed to fetch address data')
      }
    },
  },
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGeocodeStore, import.meta.hot))
};
