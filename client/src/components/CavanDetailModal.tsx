import { useEffect, useState } from 'react';
import './CavanDetailModal.css';

interface User {
  id: string;
  name: string;
  photoUrl: string;
  contact: string;
  isVerified: boolean;
}

interface Cavan {
  id: string;
  name: string;
  hostId: string;
  capacity: number;
  amenities: string[];
  photos: string[];
  location: {
    lat: number;
    lng: number;
  };
  status: string;
  dailyRate: number;
  likes: number;
}

interface CavanDetail {
  cavan: Cavan;
  host: User;
  transactions: number;
}

interface CavanDetailModalProps {
  cavanId: string;
  onClose: () => void;
}

export const CavanDetailModal = ({ cavanId, onClose }: CavanDetailModalProps) => {
  const [details, setDetails] = useState<CavanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchCavanDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cavans/${cavanId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch cavan details');
        }
        const data = await response.json();
        setDetails(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCavanDetails();
  }, [cavanId]);

  const handleNextPhoto = () => {
    if (details) {
      setCurrentPhotoIndex((prevIndex) =>
        prevIndex === details.cavan.photos.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePrevPhoto = () => {
    if (details) {
      setCurrentPhotoIndex((prevIndex) =>
        prevIndex === 0 ? details.cavan.photos.length - 1 : prevIndex - 1
      );
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>X</button>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
        {details && (
          <div>
            <div className="gallery-container">
              <button className="gallery-button prev" onClick={handlePrevPhoto}>&#10094;</button>
              <img
                src={details.cavan.photos[currentPhotoIndex]}
                alt={`${details.cavan.name} photo ${currentPhotoIndex + 1}`}
                className="gallery-image"
              />
              <button className="gallery-button next" onClick={handleNextPhoto}>&#10095;</button>
            </div>
            <div className="modal-details">
              <div className="actions-container">
                <button className="action-button">Like</button>
                <button className="action-button">Map</button>
                <button className="action-button">Chat</button>
                <button className="action-button">Reserve</button>
              </div>
              <div className="host-info">
                <img src={details.host.photoUrl} alt={details.host.name} className="host-photo" />
                <h3>{details.host.name}</h3>
              </div>
              <h2>{details.cavan.name}</h2>
              <div className="cavan-details">
                <p><strong>Price:</strong> ${details.cavan.dailyRate} / night</p>
                <p><strong>Transactions:</strong> {details.transactions} completed</p>
                <p><strong>Capacity:</strong> {details.cavan.capacity} people</p>
                <p><strong>Amenities:</strong> {details.cavan.amenities.join(', ')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
