import { loadScript } from "./loadScript";

export const useExternalModule = async (scripts) => {
  return new Promise((resolve, reject) => {
    let allLoaded = true;
    scripts.forEach(async (script) => {
      try {
        await loadScript(script.src, script?.type ?? 'text/javascript', script?.integrity ?? '', script?.crossorigin ?? '', script?.async ?? false, script?.defer ?? false);
      } catch (error) {
        allLoaded = false;
        console.error(error);
      }
    });
    allLoaded ? resolve() : reject(new Error('Failed to load all external scripts'))
    return allLoaded;
  })
};
