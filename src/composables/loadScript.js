export const loadScript = (src, type, integrity, crossorigin) => {
    // Check if script already added and if script is correct type
    if (document.querySelector(`head script[src="${src}"`) || type !== "text/javascript") {
      console.log("ALREADY LOADED")
      return;
    }
    console.log("LOADING..................")
    // Add tag to head
    const element = document.createElement("script");
    element.src = src;
    if (integrity) element.integrity = integrity;
    if (crossorigin) element.crossorigin = crossorigin;
    element.type = "text/javascript";
    document.head.append(element);
    return element;
};
