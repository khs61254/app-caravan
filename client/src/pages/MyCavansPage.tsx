import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CavanCard from '../components/CavanCard';
import { CavanDetailModal } from '../components/CavanDetailModal';
import './MyCavansPage.css';

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

const MyCavansPage: React.FC = () => {
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

    const fetchMyCavans = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/cavans/my-cavans', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch your cavans.' }));
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

    fetchMyCavans();
  }, [user, token]);

  const handleDelete = async (cavanId: string) => {
    if (!window.confirm('Are you sure you want to unregister this cavan?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cavans/${cavanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete the cavan.' }));
        throw new Error(errorData.message);
      }

      setCavans(cavans.filter(cavan => cavan.id !== cavanId));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };
  
  const handleCardClick = (cavanId: string) => {
    setSelectedCavanId(cavanId);
  };

  const handleCloseModal = () => {
    setSelectedCavanId(null);
  };

  if (loading) {
    return <div className="loading-message">Loading your cavans...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="my-cavans-page">
      <h2>My Registered Cavans</h2>
      {cavans.length === 0 ? (
        <p className="info-message">You have not registered any cavans yet.</p>
      ) : (
        <div className="my-cavans-grid">
          {cavans.map(cavan => (
            <CavanCard
              key={cavan.id}
              id={cavan.id}
              name={cavan.name}
              photo={cavan.photos[0] || 'https://via.placeholder.com/300x180?text=No+Image'}
              distance="N/A" // Distance is not relevant for owned cavans
              likes={cavan.likedBy.length}
              location={cavan.location}
              isGoogleMapsLoaded={false} // Google Maps might not be loaded here
              onClick={() => handleCardClick(cavan.id)}
              onDelete={() => handleDelete(cavan.id)}
              showDelete={true}
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

export default MyCavansPage;
