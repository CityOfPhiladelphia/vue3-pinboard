import { loadScript } from "./loadScript";

export const useExternalModule = async (scripts) => {
  scripts.forEach(async (script) => {
    try {
      await loadScript(script.src, script?.type ?? 'text/javascript', script?.integrity ?? '', script?.crossorigin ?? '', script?.async ?? false, script?.defer ?? false)
    } catch (error) {
      console.error(error);
    }
  });
};
