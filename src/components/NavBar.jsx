import { NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">SelfieStyler</NavLink>
    </nav>
  );
}
