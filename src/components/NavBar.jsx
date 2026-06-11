import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFittingRoom } from '../context/FittingRoomContext';

export default function NavBar() {
  const { logout } = useAuth();
  const { products } = useFittingRoom();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">SelfieStyler</NavLink>

      <div className="navbar-actions">
        <NavLink to="/" className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}>
          Collection
        </NavLink>

        <NavLink to="/fitting-room" className={({ isActive }) => 'navbar-link' + (isActive ? ' active' : '')}>
          Fitting Room
          {products.length > 0 && (
            <span className="fr-badge">{products.length}</span>
          )}
        </NavLink>

        <button className="btn-logout" onClick={logout}>Log out</button>
      </div>
    </nav>
  );
}
