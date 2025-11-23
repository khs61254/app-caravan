import React, { useState } from 'react';
import './CavanRegisterModal.css';

interface CavanRegisterModalProps {
  onClose: () => void;
  onRegister: (cavanData: any) => void;
}

const CavanRegisterModal: React.FC<CavanRegisterModalProps> = ({ onClose, onRegister }) => {
  const [name, setName] = useState('');
  const [photos, setPhotos] = useState('');
  const [price, setPrice] = useState('');
  const [amenities, setAmenities] = useState('');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!name || !price || !photos || !amenities || !capacity || !location) {
      alert('Please fill all fields');
      return;
    }
    onRegister({ 
      name, 
      dailyRate: parseFloat(price), 
      photos: [photos], 
      amenities: amenities.split(',').map(s => s.trim()),
      capacity: parseInt(capacity, 10),
      location,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Register Your Cavan</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Cavan Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="photos">Photo URL</label>
            <input
              id="photos"
              type="text"
              value={photos}
              onChange={(e) => setPhotos(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Price per day</label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="amenities">Amenities (comma-separated)</label>
            <input
              id="amenities"
              type="text"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="capacity">Capacity</label>
            <input
              id="capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location (lat,lng)</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-register">Register</button>
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CavanRegisterModal;