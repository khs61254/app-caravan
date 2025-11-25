import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="app-header">
        <h1 className="app-title"><Link to="/">Cavan</Link></h1>
        <nav className="app-nav">
          {/* Main navigation links can go here if any */}
        </nav>
        {user ? (
          <div className="user-menu">
            <span className="user-name">Welcome, {user.name}</span>
            <div className="dropdown-content">
              {user.role === 'host' && (
                <Link to="/my-cavans">My Registered Cavans</Link>
              )}
              <Link to="/liked-cavans">My Liked Cavans</Link>
              <button onClick={logout} className="logout-button">Logout</button>
            </div>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        )}
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
