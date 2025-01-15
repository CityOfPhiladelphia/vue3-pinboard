import { defineStore, acceptHMRUpdate } from 'pinia';

export const useConfigStore = defineStore('ConfigStore', {
  state: () => {
    return {
      config: {},
    };
  },
  actions: {
    setConfig(config) {
      this.config = config;
    }
  }
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot))
};