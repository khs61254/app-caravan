import React, { useEffect, useRef, useState } from 'react';
import './CavanCard.css';

interface CavanCardProps {
  id: string;
  name: string;
  photo: string; // Assuming a photo URL
  distance: string; // e.g., "100 km" or "500 m"
  likes: number;
  location: { lat: number; lng: number }; // Add location property
  isGoogleMapsLoaded: boolean; // Prop to indicate if Google Maps API is loaded
  onClick: () => void;
  onLike: (id: string) => void;
}

const CavanCard: React.FC<CavanCardProps> = ({
  id,
  name,
  photo,
  distance,
  likes,
  location,
  isGoogleMapsLoaded,
  onClick,
  onLike,
}) => {
  const mapRef = useRef<HTMLDivElement>(null); // Create a ref for the map container
  const [isMapVisible, setIsMapVisible] = useState(false); // State to toggle map

  useEffect(() => {
    if (isMapVisible && isGoogleMapsLoaded && mapRef.current && window.google && window.google.maps) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: location.lat, lng: location.lng },
        zoom: 12, // Adjust zoom level as needed
        disableDefaultUI: true, // Optional: disable default UI controls
      });

      new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: name,
      });

      // Trigger a resize event to ensure the map renders correctly
      setTimeout(() => {
        window.google.maps.event.trigger(map, 'resize');
        map.setCenter({ lat: location.lat, lng: location.lng });
      }, 100); // A small delay to ensure the container is visible
    }
  }, [isMapVisible, isGoogleMapsLoaded, location, name]); // Re-run effect if these dependencies change

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card's onClick from firing
    onLike(id);
  };

  const toggleMap = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card's onClick from firing
    setIsMapVisible(!isMapVisible);
  };

  return (
    <div className="cavan-card" onClick={onClick}>
      {!isMapVisible && <img src={photo} alt={name} className="cavan-photo" />}
      {isMapVisible && <div className="cavan-map" ref={mapRef}></div>}
      <div className="cavan-info">
        <h3>{name}</h3>
        <p className="cavan-distance">{distance}</p>
        <div className="cavan-controls">
          <div className="cavan-likes" onClick={handleLikeClick}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="heart-icon"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span>{likes}</span>
          </div>
          <button className="map-button" onClick={toggleMap}>
            {isMapVisible ? 'Photo' : 'Map'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CavanCard;
