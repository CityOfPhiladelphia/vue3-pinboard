import mergeDeep from './util/merge-deep.js';

const cityCenterCoords = [-75.163471, 39.953338];

const addressDoubles = [
  '15 E HAMPTON RD',
];

const imageryInfo = {
  sources: {
    // imageryParcelOutlines: {
    //   tiles: [
    //     'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/PWDParcel_ImageryOverlay/MapServer/tile/{z}/{y}/{x}',
    //   ],
    //   type: 'raster',
    //   tileSize: 256,
    // },
    imageryLabels: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_Labels/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    2023: {
      tiles: [
        'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2023/MapServer/tile/{z}/{y}/{x}',
      ],
      type: 'raster',
      tileSize: 256,
    },
    cyclomediaRecordings: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
    },
    cyclomediaCamera: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        }
      }
    },
    cyclomediaViewcone: {
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
}

const pwdDrawnMapStyle = mergeDeep(imageryInfo,{
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
    geolocationMarker: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        }
      }
    },
    resources: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
    },
    buildingFootprints: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
    },
    buffer: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[]]],
        }
      }
    },
    zipcode: {
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
      id: 'buffer',
      type: 'fill',
      source: 'buffer',
      layout: {},
      paint: {
        'fill-color': '#9e9ac8',
        'fill-opacity': 0.2,
        'fill-outline-color': '#9e9ac8',
      }
    },
    {
      id: 'bufferLine',
      type: 'line',
      source: 'buffer',
      layout: {},
      paint: {
        'line-color': '#9e9ac8',
        'line-width': 2,
      }
    },
    {
      id: 'zipcode',
      type: 'fill',
      source: 'zipcode',
      layout: {},
      paint: {
        'fill-color': '#cc3000',
        'fill-opacity': 0.2,
        'fill-outline-color': '#cc3000',
      }
    },
    {
      id: 'zipcodeLine',
      type: 'line',
      source: 'zipcode',
      layout: {},
      paint: {
        'line-color': '#cc3000',
        'line-width': 2,
      }
    },
    {
      id: 'cyclomediaRecordings',
      source: 'cyclomediaRecordings',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#5b94c6',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#a1a1a1',
        'circle-opacity': 0.5,
      }
    },
    {
      id: 'cyclomediaCamera',
      source: 'cyclomediaCamera',
      type: 'symbol',
      layout: {
        'icon-image': 'camera-icon',
        'icon-anchor' : 'center',
        'icon-size': 0.09,
        'icon-rotate': 0,
        'icon-rotation-alignment': 'map',
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
    {
      'id': 'cyclomediaViewcone',
      'type': 'fill',
      'source': 'cyclomediaViewcone',
      'layout': {},
      'paint': {
        'fill-color': 'rgb(0,102,255)',
        'fill-opacity': 0.2,
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
        "icon-allow-overlap" : true,
        "text-allow-overlap": true,
      },
    },
    {
      id: 'geolocationMarker',
      source: 'geolocationMarker',
      type: 'circle',
      paint: {
        'circle-radius': 7,
        'circle-color': 'red',
        'circle-stroke-width': 1,
        'circle-stroke-color': 'white',
      },
    },
    {
      id: 'buildingFootprintsFill',
      type: 'fill',
      source: 'buildingFootprints',
      layout: {},
      paint: {
        'fill-color': 'rgb(0,102,255)',
        'fill-opacity': 0.4,
        'fill-outline-color': 'rgb(0,102,255)',
      }
    },
    {
      id: 'buildingFootprintsLine',
      type: 'line',
      source: 'buildingFootprints',
      layout: {},
      paint: {
        'line-color': 'rgb(0,102,255)',
        'line-width': 2,
      }
    },
  ],
});

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
    imageryLabels: {
      id: 'imageryLabels',
      source: 'imageryLabels',
      type: 'raster',
    },
    2023: {
      id: '2023',
      source: '2023',
      type: 'raster',
    },
  },
}

$config['cityCenterCoords'] = cityCenterCoords;
$config['addressDoubles'] = addressDoubles;
$config['pwdDrawnMapStyle'] = pwdDrawnMapStyle;

export default $config;