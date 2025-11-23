import React, { useState, useEffect, useRef, useCallback } from 'react';
import CavanCard from './CavanCard';
import './CavanList.css';
import { CavanDetailModal } from './CavanDetailModal';

// Define the Cavan type based on backend API response
interface Cavan {
  id: string;
  name: string;
  hostId: string;
  capacity: number;
  amenities: string[];
  photos: string[]; // Array of photo URLs
  location: { lat: number; lng: number };
  status: string;
  dailyRate: number;
  likes: number;
  distance?: number; // Distance is an optional field calculated by the backend
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface CavanListProps {
  isGoogleMapsLoaded: boolean;
}

const CavanList: React.FC<CavanListProps> = ({ isGoogleMapsLoaded }) => {
  const [cavans, setCavans] = useState<Cavan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0); // For pagination if implemented
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedCavanId, setSelectedCavanId] = useState<string | null>(null);

  const handleCardClick = (cavanId: string) => {
    setSelectedCavanId(cavanId);
  };

  const handleCloseModal = () => {
    setSelectedCavanId(null);
  };

  const handleLike = (cavanId: string) => {
    setCavans((prevCavans) =>
      prevCavans.map((cavan) =>
        cavan.id === cavanId ? { ...cavan, likes: cavan.likes + 1 } : cavan,
      ),
    );
  };

  const observer = useRef<IntersectionObserver>();
  const lastCavanElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  useEffect(() => {
    // Get user's current location for distance sorting
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Error getting user location:', err);
          // Proceed without location if access denied
          setUserLocation({ lat: 34.0522, lng: -118.2437 }); // Default to LA
        },
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
      setUserLocation({ lat: 34.0522, lng: -118.2437 }); // Default to LA
    }
  }, []);

  useEffect(() => {
    if (!userLocation) return; // Wait until location is determined

    const fetchCavans = async () => {
      setLoading(true);
      setError(null);
      try {
        // Construct API URL with sorting and pagination parameters
        const lat = userLocation?.lat;
        const lng = userLocation?.lng;
        // For simplicity, let's assume one page loads all for now, or implement actual pagination in backend
        const apiUrl = `/api/cavans?sortBy=distance&lat=${lat}&lng=${lng}`; // Sort by distance from user location

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        try {
          const data: Cavan[] = JSON.parse(text);
          setCavans(data);
        } catch (e) {
          throw new Error(`Failed to parse JSON: ${text}`);
        }

        // For infinite scroll, append new data
        // For now, let's just set the initial data
        setHasMore(false); // Assuming all data is fetched in one go for now
      } catch (e: any) {
        setError('Failed to fetch cavans: ' + e.message);
        console.error('Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchCavans();
  }, [userLocation, page]); // Re-fetch when userLocation changes or page changes (for infinite scroll)

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="cavan-list-container">
      {cavans.length === 0 && !loading && !error && (
        <p className="info-message">No cavans available.</p>
      )}
      <div className="cavan-grid">
        {cavans.map((cavan, index) => {
          // Use the ref for the last element to trigger infinite scroll
          if (cavans.length === index + 1) {
            return (
              <div ref={lastCavanElementRef} key={cavan.id} onClick={() => handleCardClick(cavan.id)}>
                <CavanCard
                  id={cavan.id}
                  name={cavan.name}
                  photo={cavan.photos[0] || 'https://via.placeholder.com/300x180?text=No+Image'} // Default image if none
                  distance={cavan.distance ? `${Math.round(cavan.distance)} km` : 'N/A'} // Assuming distance in km from API
                  likes={cavan.likes}
                  location={cavan.location} // Pass location
                  isGoogleMapsLoaded={isGoogleMapsLoaded} // Pass Google Maps loaded status
                  onLike={handleLike}
                />
              </div>
            );
          } else {
            return (
              <CavanCard
                key={cavan.id}
                id={cavan.id}
                name={cavan.name}
                photo={cavan.photos[0] || 'https://via.placeholder.com/300x180?text=No+Image'}
                distance={cavan.distance ? `${Math.round(cavan.distance)} km` : 'N/A'}
                likes={cavan.likes}
                location={cavan.location} // Pass location
                isGoogleMapsLoaded={isGoogleMapsLoaded} // Pass Google Maps loaded status
                onClick={() => handleCardClick(cavan.id)}
                onLike={handleLike}
              />
            );
          }
        })}
      </div>
      {loading && <p className="loading-message">Loading more cavans...</p>}
      {selectedCavanId && (
        <CavanDetailModal cavanId={selectedCavanId} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default CavanList;
