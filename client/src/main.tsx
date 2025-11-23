import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const Main = () => {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    // Define the global initMap function
    window.initMap = () => {
      setIsGoogleMapsLoaded(true);
      console.log('Google Maps API loaded!');
    };

    // Clean up the global function when the component unmounts
    // For initMap, which is called once, cleanup is less critical but good practice.
    return () => {
      // If we were creating event listeners or other resources, we'd clean them up here.
      // delete window.initMap; // Option to remove it, or set to a no-op.
    };
  }, []); // Run only once on mount

  return (
    <React.StrictMode>
      <App isGoogleMapsLoaded={isGoogleMapsLoaded} />
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<Main />);
