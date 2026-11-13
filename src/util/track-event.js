// Adds an event to window.dataLayer, which phila.gov's Google Tag Manager container reads and forwards to Google Analytics
export default function (eventName, fields) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...fields });
}
