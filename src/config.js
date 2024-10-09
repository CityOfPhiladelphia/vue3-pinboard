import mergeDeep from './util/merge-deep.js';

const cityCenterCoords = [-75.163471, 39.953338];

const addressDoubles = [
  '15 E HAMPTON RD',
];

const pwdDrawnMapStyle = {
  version: 8,
  name: 'pwdDrawnMap',
  glyphs: '//fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    pwd: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    pwdLabels: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    addressMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        }
      }
    },
    dorParcel: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
  },
  layers: [
    {
      id: 'pwd',
      source: 'pwd',
      type: 'raster',
    },
    {
      id: 'pwdLabels',
      source: 'pwdLabels',
      type: 'raster',
    },
    {
      id: 'addressMarker',
      source: 'addressMarker',
      type: 'symbol',
      layout: {
        'icon-image': 'marker-blue',
        'icon-rotate': 180,
        'icon-anchor': 'bottom',
        'icon-size': .05,
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
  ],
};

const nearbyDrawnMapStyle = {
  version: 8,
  name: 'nearbyDrawnMap',
  glyphs: '//fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    pwd: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    pwdLabels: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    addressMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        },
      }
    },
    dorParcel: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
    nearby: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
    },
  },
  layers: [
    {
      id: 'pwd',
      source: 'pwd',
      type: 'raster',
    },
    {
      id: 'pwdLabels',
      source: 'pwdLabels',
      type: 'raster',
    },
    {
      id: 'nearby',
      source: 'nearby',
      type: 'circle',
      paint: {
        'circle-radius': 7,
        'circle-color': [
          'match',
          ['get', 'type'],
          'nearby311',
          '#FF0000',
          'city311',
          '#FF0000',
          'nearbyCrimeIncidents',
          '#0096FF',
          'nearbyZoningAppeals',
          '#009900',
          'nearbyVacantIndicatorPoints',
          '#9400c6',
          'nearbyConstructionPermits',
          '#FF0000',
          'nearbyDemolitionPermits',
          '#0096FF',
          'nearbyUnsafeBuildings',
          '#009900',
          /* other */ '#000000'
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': 'white',
      },
    },
    {
      id: 'addressMarker',
      source: 'addressMarker',
      type: 'symbol',
      layout: {
        'icon-image': 'marker-blue',
        'icon-rotate': 180,
        'icon-anchor': 'bottom',
        'icon-size': .05,
      }
    },
  ],
};

const $config = {
  mapLayers: {
    pwdBasemap: {
      id: 'pwdBasemap',
      source: 'pwdBasemap',
      type: 'raster',
    },
    pwdLabels: {
      id: 'pwdLabels',
      source: 'pwdLabels',
      type: 'raster',
    },
    addressMarker: {
      id: 'addressMarker',
      source: 'addressMarker',
      type: 'circle',
    },
    // imageryParcelOutlines: {
    //   id: 'imageryParcelOutlines',
    //   source: 'imageryParcelOutlines',
    //   type: 'raster',
    //   minzoom: 0,
    //   maxzoom: 22,
    // },
    // imageryLabels: {
    //   id: 'imageryLabels',
    //   source: 'imageryLabels',
    //   type: 'raster',
    // },
    // 2023: {
    //   id: '2023',
    //   source: '2023',
    //   type: 'raster',
    // },
  },
}

// const dorLegendData = {
//   'Easements': {
//     'border-color': 'rgb(255, 0, 197)',
//     'border-style': 'solid',
//     'border-weight': '1px',
//     'width': '12px',
//     'height': '12px',
//     'font-size': '10px',
//   },
//   'Trans Parcels': {
//     'border-color': 'rgb(0, 168, 132)',
//     'border-style': 'solid',
//     'border-weight': '1px',
//     'width': '12px',
//     'height': '12px',
//     'font-size': '10px',
//   },
//   'Rights of Way': {
//     'border-color': 'rgb(249, 147, 0)',
//     'border-style': 'solid',
//     'border-weight': '1px',
//     'width': '12px',
//     'height': '12px',
//     'font-size': '10px',
//   },
// };

$config['cityCenterCoords'] = cityCenterCoords;
$config['addressDoubles'] = addressDoubles;
$config['pwdDrawnMapStyle'] = pwdDrawnMapStyle;
// $config['nearbyDrawnMapStyle'] = nearbyDrawnMapStyle;
// $config['dorLegendData'] = dorLegendData;

export default $config;