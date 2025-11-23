import { useState } from 'react';
import './App.css'
import CavanList from './components/CavanList';
import ChatIcon from './components/ChatIcon';
import ChatWindow from './components/ChatWindow';

interface AppProps {
  isGoogleMapsLoaded: boolean;
}

function App({ isGoogleMapsLoaded }: AppProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="App">
      <h1>Cavan</h1>
      <CavanList isGoogleMapsLoaded={isGoogleMapsLoaded} />
      <ChatIcon onClick={toggleChat} />
      {isChatOpen && <ChatWindow onClose={toggleChat} />}
    </div>
  )
}

export default App
