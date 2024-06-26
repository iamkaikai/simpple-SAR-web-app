import React, { useEffect, useState } from 'react';
import './TrailMap.css';
import TrailForm from './TrailForm';
import { firestore, GeoPoint } from './firebase'; // Import Firestore
import { collection, addDoc } from 'firebase/firestore';

const TrailMap = ({ map, trails, isDrawingMode, setIsDrawingMode}) => {
  const [drawTrail, setDrawTrail] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [history, setHistory] = useState([]); // History stack to keep track of previous states

  useEffect(() => {
    if (!map || trails.length === 0) return;

    // Remove existing layers and sources if they exist
    trails.forEach(trail => {
      if (map.getLayer(`route-${trail.id}`)) {
        map.removeLayer(`route-${trail.id}`);
      }
      if (map.getSource(`route-${trail.id}`)) {
        map.removeSource(`route-${trail.id}`);
      }
    });

    const handleClick = (e) => {
      if (!isDrawingMode) return;

      const coords = [e.lngLat.lng, e.lngLat.lat];
      console.log(coords)
      setDrawTrail(prevDrawTrail => {
        setHistory([...history, prevDrawTrail]); // Push the current state to the history stack
        const updatedTrail = [...prevDrawTrail, coords];
        drawLine(map, updatedTrail); // Draw the updated line
        return updatedTrail;
      });
    };

    // Append to DrawTrail when clicking on the map in drawing mode
    map.on('click', handleClick);

    // Clean up the event listener on unmount
    return () => {
      map.off('click', handleClick);
    };

  }, [map, trails, isDrawingMode, history]);

  useEffect(() => {
    if (!map) return;

    // Draw initial trails
    trails.forEach(trail => {
      const geoPoints = trail.path.map(geoPoint => [geoPoint.longitude, geoPoint.latitude]);
        // Add trail path as a line
        const line = {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': geoPoints
          }
        };
        map.addSource(`route-${trail.id}`, {
          'type': 'geojson',
          'data': line
        });

        map.addLayer({
          'id': `route-${trail.id}`,
          'type': 'line',
          'source': `route-${trail.id}`,
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#FF5F1F',
            'line-width': 5
          }
        });
      });
        
  }, [map, trails, isDrawingMode]); // Add map and trails as dependencies

  const drawLine = (map, coordinates) => {
    // Remove existing draw line if it exists
    if (map.getLayer('draw-line')) {
      map.removeLayer('draw-line');
    }
    if (map.getSource('draw-line')) {
      map.removeSource('draw-line');
    }

    // Add the new line
    const line = {
      'type': 'Feature',
      'properties': {},
      'geometry': {
        'type': 'LineString',
        'coordinates': coordinates
      }
    };

    map.addSource('draw-line', {
      'type': 'geojson',
      'data': line
    });

    map.addLayer({
      'id': 'draw-line',
      'type': 'line',
      'source': 'draw-line',
      'layout': {
        'line-join': 'round',
        'line-cap': 'round'
      },
      'paint': {
        'line-color': '#FF5F1F',
        'line-width': 5
      }
    });
  };

  const removeDrawLine = () => {
    if (map.getLayer('draw-line')) {
      map.removeLayer('draw-line');
    }
    if (map.getSource('draw-line')) {
      map.removeSource('draw-line');
    }
  };

  const handleSave = async(trailData) => {
    console.log('Saved trail data:', trailData);
    // Save trail data to JSON file or server here
    const geoPoints = drawTrail.map(coord => new GeoPoint(coord[1], coord[0]));

    try {
      await addDoc(collection(firestore, 'trails'), {
        ...trailData,
        path: geoPoints
      });
      console.log('Trail data successfully saved to Firestore!');
      setDrawTrail([]); // Clear the draw trail
      setHistory([]); // Clear the history
    } catch (error) {
      console.error('Error saving trail data to Firestore:', error);
    }
    setShowForm(false);
    setIsDrawingMode(false); // Reset drawing mode
  };

  const handleUndo = () => {
    setHistory(prevHistory => {
      const previousTrail = prevHistory.pop();
      setDrawTrail(previousTrail || []);
      drawLine(map, previousTrail || []);
      return prevHistory;
    });
  };

  return (
    <div>
      {isDrawingMode && (
       <div className='btn-form-popup-wrapper'>
        <button className='btn-form-option' onClick={() => { 
          setShowForm(false); 
          setIsDrawingMode(false); 
          setHistory([]); 
          setDrawTrail([]);
          removeDrawLine(); // Remove the drawn line when cancel is clicked
        }}>
          Cancel
        </button>
        <button className='btn-form-option' onClick={handleUndo}>
          Undo
        </button>
        <button className='btn-form-submit' onClick={() => setShowForm(true)}>
          Save This Path
        </button>
      </div>
      )}
      {showForm && <TrailForm drawTrail={drawTrail} onSave={handleSave} setIsDrawingMode={setIsDrawingMode} setDrawTrail={setDrawTrail} setShowForm={setShowForm}/>}
    </div>
  );
};

export default TrailMap;
