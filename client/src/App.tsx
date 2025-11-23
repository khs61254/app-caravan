import './App.css'
import CavanList from './components/CavanList';

interface AppProps {
  isGoogleMapsLoaded: boolean;
}

function App({ isGoogleMapsLoaded }: AppProps) {
  return (
    <div className="App">
      <h1>Cavan</h1>
      <CavanList isGoogleMapsLoaded={isGoogleMapsLoaded} />
    </div>
  )
}

export default App
