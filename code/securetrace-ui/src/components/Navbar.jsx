import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        🔐 SecureTrace
      </div>

      <div className="navbar-links">
        <Link to="/dashboard">Cases</Link>
        <Link to="/audit">Audit Ledger</Link>
      </div>

      <div className="navbar-user">
        <span className="user-info">
          {user?.fullName}
          <span className={`role-badge role-${user?.role?.toLowerCase()}`}>
            {user?.role}
          </span>
        </span>
        <button className="btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
