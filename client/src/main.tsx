import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import './index.css';

const Main = () => {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    // 1. Define the callback function that Google Maps will call on load.
    window.initMap = () => {
      setIsGoogleMapsLoaded(true);
      console.log('Google Maps API loaded!');
    };

    // 2. Get the API key from Vite environment variables.
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("Google Maps API key is missing. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.");
      return;
    }

    // 3. Create the script tag.
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;

    // 4. Append the script to the document body.
    document.body.appendChild(script);

    // 5. Cleanup function to remove the script and the global callback.
    return () => {
      document.body.removeChild(script);
      delete window.initMap;
    };
  }, []);

  return (
    <React.StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<App isGoogleMapsLoaded={isGoogleMapsLoaded} />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<Main />);
