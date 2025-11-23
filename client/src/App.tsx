import { useState } from 'react';
import './App.css'
import CavanList from './components/CavanList';
import ChatIcon from './components/ChatIcon';
import ChatWindow from './components/ChatWindow';
import { useAuth } from './contexts/AuthContext';

interface AppProps {
  isGoogleMapsLoaded: boolean;
}

function App({ isGoogleMapsLoaded }: AppProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
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
      <CavanList isGoogleMapsLoaded={isGoogleMapsLoaded} />
      <ChatIcon onClick={toggleChat} />
      {isChatOpen && <ChatWindow onClose={toggleChat} />}
    </div>
  )
}

export default App
