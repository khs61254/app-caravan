import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CavanCard from '../components/CavanCard';
import { CavanDetailModal } from '../components/CavanDetailModal';
import './MyCavansPage.css'; // Re-using styles for now

// TODO: Move this to a shared types file
interface Cavan {
  id: string;
  name: string;
  hostId: string;
  capacity: number;
  amenities: string[];
  photos: string[];
  location: { lat: number; lng: number };
  status: string;
  dailyRate: number;
  likedBy: string[];
}

const LikedCavansPage: React.FC = () => {
  const [cavans, setCavans] = useState<Cavan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCavanId, setSelectedCavanId] = useState<string | null>(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchLikedCavans = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/cavans/liked', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch your liked cavans.' }));
          throw new Error(errorData.message);
        }

        const data: Cavan[] = await response.json();
        setCavans(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedCavans();
  }, [user, token]);

  const handleCardClick = (cavanId: string) => {
    setSelectedCavanId(cavanId);
  };

  const handleCloseModal = () => {
    setSelectedCavanId(null);
  };

  const handleLike = async (cavanId: string) => {
    try {
      // Optimistically update the UI
      setCavans(cavans.filter(cavan => cavan.id !== cavanId));

      const response = await fetch(`/api/cavans/${cavanId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If the API call fails, revert the change
        // For simplicity, we're just logging the error here.
        // A more robust solution would involve refetching the liked cavans
        // or adding the cavan back to the list.
        console.error('Failed to unlike cavan');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading-message">Loading your liked cavans...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="my-cavans-page">
      <h2>My Liked Cavans</h2>
      {cavans.length === 0 ? (
        <p className="info-message">You have not liked any cavans yet.</p>
      ) : (
        <div className="my-cavans-grid">
          {cavans.map(cavan => (
            <CavanCard
              key={cavan.id}
              id={cavan.id}
              name={cavan.name}
              photo={cavan.photos[0] || 'https://via.placeholder.com/300x180?text=No+Image'}
              distance="N/A" // Distance might not be relevant here either
              likes={cavan.likedBy.length}
              location={cavan.location}
              isGoogleMapsLoaded={false}
              onClick={() => handleCardClick(cavan.id)}
              onLike={handleLike}
            />
          ))}
        </div>
      )}
       {selectedCavanId && (
        <CavanDetailModal cavanId={selectedCavanId} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default LikedCavansPage;
