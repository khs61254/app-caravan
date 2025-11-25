import React, { useState, useEffect, useRef, useCallback } from 'react';
import CavanCard from './CavanCard';
import './CavanList.css';
import { CavanDetailModal } from './CavanDetailModal';
import { useAuth } from '../contexts/AuthContext';

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
  likedBy: string[];
  distance?: number; // Distance is an optional field calculated by the backend
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface CavanListProps {
  isGoogleMapsLoaded: boolean;
  refreshKey?: number;
}

const CavanList: React.FC<CavanListProps> = ({ isGoogleMapsLoaded, refreshKey }) => {
  const [cavans, setCavans] = useState<Cavan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0); // For pagination if implemented
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedCavanId, setSelectedCavanId] = useState<string | null>(null);
  const { user, token } = useAuth();

  const handleCardClick = (cavanId: string) => {
    setSelectedCavanId(cavanId);
  };

  const handleCloseModal = () => {
    setSelectedCavanId(null);
  };

  const handleLike = async (cavanId: string) => {
    if (!user) {
      alert('You must be logged in to like a cavan.');
      return;
    }

    try {
      // Optimistically update the UI
      setCavans(prevCavans =>
        prevCavans.map(cavan => {
          if (cavan.id === cavanId) {
            const likedBy = cavan.likedBy || []; // Defensive guard
            const isLiked = likedBy.includes(user.id);
            if (isLiked) {
              return {
                ...cavan,
                likedBy: likedBy.filter(id => id !== user.id),
              };
            } else {
              return { ...cavan, likedBy: [...likedBy, user.id] };
            }
          }
          return cavan;
        }),
      );

      await fetch(`/api/cavans/${cavanId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (err) {
      // Revert the optimistic update on error if needed
      console.error('Failed to update like status', err);
    }
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
  }, [userLocation, page, refreshKey]); // Re-fetch when userLocation, page or refreshKey changes

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
          if (!cavan.likedBy) {
            console.error('Cavan object is missing likedBy property:', cavan);
          }
          const card = (
            <CavanCard
              id={cavan.id}
              name={cavan.name}
              photo={cavan.photos[0] || 'https://via.placeholder.com/300x180?text=No+Image'}
              distance={cavan.distance ? `${Math.round(cavan.distance)} km` : 'N/A'}
              likes={(cavan.likedBy || []).length}
              location={cavan.location}
              isGoogleMapsLoaded={isGoogleMapsLoaded}
              onClick={() => handleCardClick(cavan.id)}
              onLike={handleLike}
            />
          );

          if (cavans.length === index + 1) {
            return (
              <div ref={lastCavanElementRef} key={cavan.id}>
                {card}
              </div>
            );
          } else {
            return (
              <div key={cavan.id}>
                {card}
              </div>
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
