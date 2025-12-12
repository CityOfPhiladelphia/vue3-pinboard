export const loadScript = (src, type = 'text/javascript', integrity = '', crossorigin = '', async = false, defer = false) => {
  return new Promise((resolve, reject) => {
    // check if script already loaded or src is missing
    if (document.querySelector(`head script[src="${src}"`)) {
      resolve();
      return;
    }

    if (!src) {
      reject(new Error('No src for script'));
      return;
    }

    console.log("LOADING: ", src)

    // create new tag
    const tag = document.createElement("script");
    tag.setAttribute("type", type);
    tag.setAttribute("src", src);
    if (integrity) tag.setAttribute("integrity", integrity);
    if (crossorigin) tag.setAttribute("crossorigin", crossorigin);
    if (async) tag.setAttribute("async", "");
    if (defer) tag.setAttribute("defer", "");

    // check if script loaded
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error('Failed to load script:', src));

    // append tag to document
    document.head.append(tag);
  })
};
