import { useState } from 'react';
import './App.css'
import CavanList from './components/CavanList';
import ChatIcon from './components/ChatIcon';
import ChatWindow from './components/ChatWindow';
import { useAuth } from './contexts/AuthContext';
import CavanRegisterModal from './components/CavanRegisterModal';
import './components/CavanRegisterModal.css';

interface AppProps {
  isGoogleMapsLoaded: boolean;
}

function App({ isGoogleMapsLoaded }: AppProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleRegister = async (cavanData: any) => {
    if (!user) {
      alert('You must be logged in to register a cavan.');
      return;
    }

    const [lat, lng] = cavanData.location.split(',').map(parseFloat);
    if (isNaN(lat) || isNaN(lng)) {
      alert('Invalid location format. Please use "lat,lng".');
      return;
    }

    const newCavan = {
      ...cavanData,
      location: { lat, lng },
      hostId: user.id,
    };

    try {
      const response = await fetch('/api/cavans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCavan),
      });

      if (!response.ok) {
        throw new Error('Failed to register cavan.');
      }

      setIsRegisterModalOpen(false);
      setRefreshKey(oldKey => oldKey + 1); // Trigger refresh
    } catch (error) {
      console.error(error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Cavan</h1>
        {user && (
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <button onClick={logout} className="logout-button">Logout</button>
          </div>
        )}
      </header>
      <CavanList isGoogleMapsLoaded={isGoogleMapsLoaded} refreshKey={refreshKey} />
      <ChatIcon onClick={toggleChat} />
      {isChatOpen && <ChatWindow onClose={toggleChat} />}
      {user && (
        <button className="register-cavan-button" onClick={() => setIsRegisterModalOpen(true)}>+</button>
      )}
      {isRegisterModalOpen && (
        <CavanRegisterModal 
          onClose={() => setIsRegisterModalOpen(false)}
          onRegister={handleRegister}
        />
      )}
    </div>
  )
}

export default App
