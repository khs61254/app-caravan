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
  const [sortBy, setSortBy] = useState<'distance' | 'likes'>('distance');
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
      setCavans(prevCavans =>
        prevCavans.map(cavan => {
          if (cavan.id === cavanId) {
            const likedBy = cavan.likedBy || [];
            const isLiked = likedBy.includes(user.id);
            if (isLiked) {
              return { ...cavan, likedBy: likedBy.filter(id => id !== user.id) };
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch (err) {
      console.error('Failed to update like status', err);
      // Optionally revert state on error
    }
  };

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
          setUserLocation({ lat: 34.0522, lng: -118.2437 }); // Default to LA
        },
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
      setUserLocation({ lat: 34.0522, lng: -118.2437 }); // Default to LA
    }
  }, []);

  useEffect(() => {
    if (!userLocation) return;

    const fetchCavans = async () => {
      setLoading(true);
      setError(null);
      try {
        const lat = userLocation?.lat;
        const lng = userLocation?.lng;
        const apiUrl = `/api/cavans?sortBy=${sortBy}&lat=${lat}&lng=${lng}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Cavan[] = await response.json();
        setCavans(data);
      } catch (e: any) {
        setError('Failed to fetch cavans: ' + e.message);
        console.error('Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchCavans();
  }, [userLocation, sortBy, refreshKey]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  return (
    <div className="cavan-list-container">
      <div className="sort-options">
        <span>Sort by:</span>
        <button onClick={() => setSortBy('distance')} className={sortBy === 'distance' ? 'active' : ''}>Distance</button>
        <button onClick={() => setSortBy('likes')} className={sortBy === 'likes' ? 'active' : ''}>Likes</button>
      </div>
      {cavans.length === 0 && !loading && !error && (
        <p className="info-message">No cavans available.</p>
      )}
      <div className="cavan-grid">
        {cavans.map((cavan) => (
            <CavanCard
              key={cavan.id}
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
        ))}
      </div>
      {loading && <p className="loading-message">Loading more cavans...</p>}
      {selectedCavanId && (
        <CavanDetailModal cavanId={selectedCavanId} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default CavanList;