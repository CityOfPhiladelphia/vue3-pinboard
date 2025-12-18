import { streetSmartApi_scripts } from '@/composables/cyclomedia/cyclomediaScripts';
import { useExternalModule } from '@/composables/cyclomedia/useExternalModule';

/**
 * Object with methods to handle calls to Cyclomedia's StreetSmartApi
 */

export const useCyclomedia = {
  loadScripts: async () => {
    let allLoaded = false;
    try {
      allLoaded = await useExternalModule(streetSmartApi_scripts)
    } catch (error) {
      console.error(error);
    }
    return allLoaded;
  },
  init: async element => {
    const initConfig = {
      targetElement: element,
      username: import.meta.env.VITE_CYCLOMEDIA_USERNAME,
      password: import.meta.env.VITE_CYCLOMEDIA_PASSWORD,
      apiKey: import.meta.env.VITE_CYCLOMEDIA_API_KEY,
      srs: 'EPSG:4326',
      locale: 'en-us',
      addressSettings: {
        locale: 'en-us',
        database: 'CMDatabase',
      }
    }
    if (!window.StreetSmartApi) return null;
    try {
      await window.StreetSmartApi.init(initConfig);
      return
    } catch (error) {
      console.error('StreetSmartApi init failed:', error);
      return null;
    }
  },
  open: async (params) => {
    const openConfig = {
      viewerType: window.StreetSmartApi.ViewerType.PANORAMA,
      srs: 'EPSG:4326',
      panoramaViewer: {
        closable: false,
        maximizable: false,
        navbarVisible: false
      }
    }
    if (!window.StreetSmartApi) return null;
    let response = null;
    try {
      response = await window.StreetSmartApi.open(params, openConfig);
    } catch (error) {
      console.error('StreetSmartApi open failed:', error);
      return null;
    }
    const viewer = response[0];
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue setNewLocation, viewer:', viewer, 'response:', response);
    if (viewer.props.ui['panorama.reportBlurring'].visible) viewer.toggleReportBlurring();
    if (viewer.getCenterMapVisible()) viewer.toggleCenterMapVisibility();
    return viewer;
  },
  destroy: async (element) => {
    if (!window.StreetSmartApi) return null;
    try {
      return await window.StreetSmartApi.destroy({ targetElement: element });
    } catch (error) {
      console.error('StreetSmartApi open failed:', error);
      return null;
    }
  }
}
