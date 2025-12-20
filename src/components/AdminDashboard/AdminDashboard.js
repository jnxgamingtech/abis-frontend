import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import api from '../../services/api';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalPopulation: 10000,
  });
  const [population, setPopulation] = useState(10000);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch documents for stats
      const docsResponse = await api.get('/documents');
      const docs = Array.isArray(docsResponse.data) ? docsResponse.data : [];
      
      const pending = docs.filter(d => d.status === 'pending').length;
      const completed = docs.filter(d => d.status === 'ready_for_pickup' || d.status === 'issued').length;
      
      // Fetch population setting
      try {
        const settingsResponse = await api.get('/settings');
        const popSetting = settingsResponse.data?.total_population || 10000;
        setPopulation(popSetting);
        setStats({
          totalRequests: docs.length,
          pendingRequests: pending,
          completedRequests: completed,
          totalPopulation: popSetting,
        });
      } catch (err) {
        setStats({
          totalRequests: docs.length,
          pendingRequests: pending,
          completedRequests: completed,
          totalPopulation: 10000,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePopulation = async () => {
    try {
      setSaving(true);
      const adminKey = localStorage.getItem('adminKey') || '';
      
      const response = await api.post('/settings/total_population', 
        { value: parseInt(population) },
        { headers: { 'x-admin-key': adminKey } }
      );
      
      console.log('Population update response:', response.data);
      
      setStats({
        ...stats,
        totalPopulation: parseInt(population),
      });
      alert('Population updated successfully!');
    } catch (err) {
      console.error('Population update error:', err);
      alert('Failed to update population: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>📊 Admin Dashboard</h1>
        <p>Overview of barangay document requests and settings</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Total Requests</h3>
            <p className="stat-value">{stats.totalRequests}</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending</h3>
            <p className="stat-value">{stats.pendingRequests}</p>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Completed</h3>
            <p className="stat-value">{stats.completedRequests}</p>
          </div>
        </div>

        <div className="stat-card population">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Population</h3>
            <p className="stat-value">{stats.totalPopulation.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="settings-section">
        <div className="settings-card">
          <h2>⚙️ Barangay Settings</h2>
          
          <div className="setting-item">
            <label>Total Barangay Population</label>
            <p className="setting-description">
              This is used for population-related statistics and reports.
            </p>
            <div className="setting-input-group">
              <input
                type="number"
                value={population}
                onChange={(e) => setPopulation(e.target.value)}
                min="0"
                className="setting-input"
              />
              <button
                onClick={handleSavePopulation}
                disabled={saving}
                className="btn-save"
              >
                {saving ? 'Saving...' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="quick-links-section">
        <h2>🔗 Quick Access</h2>
        <div className="links-grid">
          <a href="/admin/documents" className="link-card">
            <div className="link-icon">📄</div>
            <h3>Manage Documents</h3>
            <p>View and manage all document requests</p>
          </a>
          
          <a href="/admin/blotter" className="link-card">
            <div className="link-icon">📝</div>
            <h3>Review Blotter</h3>
            <p>Manage blotter entries</p>
          </a>
          
          <a href="/admin/settings" className="link-card">
            <div className="link-icon">⚙️</div>
            <h3>System Settings</h3>
            <p>Configure system and payment settings</p>
          </a>
        </div>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <h3>📌 Admin Tips</h3>
        <ul>
          <li>Use "Manage Documents" to upload certificates and set crime records</li>
          <li>Track certification counts and update payment statuses</li>
          <li>Set barangay population for accurate statistics</li>
          <li>Configure GCash QR code in System Settings</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminDashboard;
