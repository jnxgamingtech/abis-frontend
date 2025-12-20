// src/components/Layout/Navbar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../../assets/brgyLogo.png';

function Navbar({ user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Admin Navigation Bar */}
      {user?.type === 'admin' && (
        <div className="admin-nav-bar">
          <div className="admin-nav-content">
            <button 
              className="admin-nav-item"
              onClick={() => navigate('/admin')}
            >
              📊 Dashboard
            </button>
            <button 
              className="admin-nav-item"
              onClick={() => navigate('/admin/documents')}
            >
              📄 Manage Documents
            </button>
            <button 
              className="admin-nav-item"
              onClick={() => navigate('/admin/blotter')}
            >
              📝 Blotter
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={logo} alt="Barangay Seal" style={{ width: 44, height: 44, borderRadius: 6 }} />
            <h1 className="system-title">BARANGAY MANAGEMENT SYSTEM</h1>
          </div>
        </div>

        <div className="navbar-right">
          <div className="user-profile">
            <div className="user-icon">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.username}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <button 
              className="dropdown-toggle"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              ⋮
            </button>
            
            {dropdownOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item logout" onClick={onLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;