import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import './App.css';
import TrailMap from './TrailMap';
import { firestore } from './firebase'; // Import Firestore
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import * as MaplibreGrid from 'maplibre-grid';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN; //replace with your own Mapbox access token
const initialCoords = [-72.3191021777870, 43.6575744154622]; // replace with your own coordinates for the center of the search area

function App() {
  const [map, setMap] = useState(null);
  const [trails, setTrails] = useState([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedGrids, setSelectedGrids] = useState([]); // State to track selected grid cells
  const [gridVisible, setGridVisible] = useState(false);
  const gridControlRef = useRef(null); // Reference to the grid control
  const [isDrawingGrid, setIsDrawingGrid] = useState(false);

  // Fetch trails from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'trails'), (snapshot) => {
      const fetchedTrails = [];
      snapshot.forEach(doc => {
        fetchedTrails.push({ id: doc.id, ...doc.data() });
      });
      setTrails(fetchedTrails); // Update the state with the new trails array
    }, (error) => {
      console.error('Error fetching trails from Firestore:', error);
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);

  // Fetch selected grids from Firestore
  useEffect(() => {
    const fetchSelectedGrids = async () => {
      const docRef = doc(firestore, 'searchGrid', 'visitedGrid');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const loadedGrids = [];
        const data = docSnap.data();
        for (const grid_cord of Object.values(data)) {
          loadedGrids.push(grid_cord);
        }
        setSelectedGrids(loadedGrids);
      }
    };
    
    fetchSelectedGrids();
  }, []);

  useEffect(() => {
    const initializeMap = () => {
      
      const map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/mapbox/outdoors-v12', // style URL
        center: initialCoords, // Create a copy and reverse
        zoom: 12 // starting zoom
      });

      // Create a custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'marker';
      markerElement.style.backgroundColor = '#FF5F1F';
      markerElement.style.width = '20px';
      markerElement.style.height = '20px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({ offset: 10 }).setHTML('<h3>Kexin\'s last location via phone\'s geolocation (May 17)</h3>');
      new mapboxgl.Marker(markerElement)
        .setLngLat(initialCoords)
        .setPopup(popup)
        .addTo(map);

      const radius = 3; // radius in miles
      const options = { steps: 64, units: 'miles' };
      const circle = turf.circle(initialCoords, radius, options);

      map.on('load', () => {
        map.addSource('circle', {
          type: 'geojson',
          data: circle,
        });

        map.addLayer({
          id: 'circle-layer',
          type: 'fill',
          source: 'circle',
          layout: {},
          paint: {
            'fill-color': '#FF5F1F',
            'fill-opacity': 0.025,
          }
        });

        map.addLayer({
          id: 'circle-border',
          type: 'line',
          source: 'circle',
          layout: {},
          paint: {
            'line-color': '#FF5F1F',
            'line-width': 1
          }
        });

        // setup grid control
        const grid = new MaplibreGrid.Grid({
          gridWidth: .1,    
          gridHeight: .1,
          units: 'miles',
          minZoom: 11,
          paint: {
            'line-opacity': 0.05,
          }
        });
        gridControlRef.current = grid;
        map.addControl(grid);
      });

      map.on('styledata', () => {
        if (selectedGrids.length > 0 && gridVisible) {
          renderSelectedGrids(map, selectedGrids);
        }
      });

      setMap(map);
    };

    if (!map) initializeMap();

    return () => {
      if (map) map.remove();
    };
  }, []);

  const renderSelectedGrids = (map, selectedGrids) => {
    if (!map) return;

    const features = selectedGrids.map(bbox => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [bbox[0], bbox[1]],
          [bbox[2], bbox[1]],
          [bbox[2], bbox[3]],
          [bbox[0], bbox[3]],
          [bbox[0], bbox[1]]
        ]]
      }
    }));

    const sourceData = {
      type: 'FeatureCollection',
      features
    };

    if (map.getSource('selected-grids')) {
      map.getSource('selected-grids').setData(sourceData);
    } else {
      if (map.style.loaded()) {
        map.addSource('selected-grids', {
          type: 'geojson',
          data: sourceData
        });

        map.addLayer({
          id: 'selected-grids-layer',
          type: 'fill',
          source: 'selected-grids',
          paint: {
            'fill-color': '#FF5F1F',
            'fill-opacity': 0.4
          }
        });
      } else {
        map.on('styledata', () => {
          if (map.getSource('selected-grids')) {
            map.getSource('selected-grids').setData(sourceData);
          } else {
            map.addSource('selected-grids', {
              type: 'geojson',
              data: sourceData
            });

            map.addLayer({
              id: 'selected-grids-layer',
              type: 'fill',
              source: 'selected-grids',
              paint: {
                'fill-color': '#FF5F1F',
                'fill-opacity': 0.4
              }
            });
          }
        });
      }
    }
  };

  useEffect(() => {
    const handleGridClick = event => {
      if (!isDrawingGrid) return;
      const selectedBbox = event.bbox;
      setSelectedGrids(prevSelectedGrids => {
        const isAlreadySelected = prevSelectedGrids.some(
          grid => grid[0] === selectedBbox[0] && grid[1] === selectedBbox[1] && grid[2] === selectedBbox[2] && grid[3] === selectedBbox[3]
        );
        const updatedGrids = isAlreadySelected
          ? prevSelectedGrids.filter(
              grid => !(grid[0] === selectedBbox[0] && grid[1] === selectedBbox[1] && grid[2] === selectedBbox[2] && grid[3] === selectedBbox[3])
            )
          : [...prevSelectedGrids, selectedBbox];
        renderSelectedGrids(map, updatedGrids);
        saveSelectedGridsToFirestore(updatedGrids);
        return updatedGrids;
      });
    };

    if (map && isDrawingGrid) {
      map.on(MaplibreGrid.GRID_CLICK_EVENT, handleGridClick);
    }

    return () => {
      if (map) {
        map.off(MaplibreGrid.GRID_CLICK_EVENT, handleGridClick);
      }
    };
  }, [map, isDrawingGrid]);

  
  const saveSelectedGridsToFirestore = async (grids) => {
    try {
      const gridData = {};
      grids.forEach((grid, index) => {
        gridData[`grid${index}`] = grid;
      });
      await setDoc(doc(firestore, 'searchGrid', 'visitedGrid'), gridData);
    } catch (error) {
      console.error('Error saving selected grids to Firestore:', error);
    }
  };

  const handleToggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
  };

  const handleToggleDrawingGrid = () => {
    setIsDrawingGrid(!isDrawingGrid);
  };

  const toggleGridVisibility = () => {
    setGridVisible(!gridVisible);
  };

  useEffect(() => {
    if (map) {
      renderSelectedGrids(map, gridVisible ? selectedGrids : []);
    }
  }, [gridVisible]);

  return (
    <div className="App">
      <div id="map" style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }}></div>
      <button className={`btn-addPath ${isDrawingMode ? 'hidden' : ''}`} onClick={handleToggleDrawingMode}>
        {isDrawingMode ? 'Cancel' : 'Add A Searched Path 🚶‍♂️'}
      </button>
      <button className={`btn-addGrid  ${isDrawingMode ? 'hidden' : ''}`} onClick={handleToggleDrawingGrid}>
        {isDrawingGrid ? 'Done' : 'Add A Searched Grid 🟧'}
      </button>
      <button className={`btn-toggleGrid ${gridVisible ? 'active' : ''} ${isDrawingMode ? 'hidden' : ''}`} onClick={toggleGridVisibility}>
       {gridVisible ? 'Turn Off Grid' : 'Show Search Grid'}
      </button>
      {map && <TrailMap map={map} trails={trails} isDrawingMode={isDrawingMode} setIsDrawingMode={setIsDrawingMode}/>}
      {isDrawingMode && <text className='form-description'>Click on the map to draw a path</text>}
    </div>
  );
}

export default App;
