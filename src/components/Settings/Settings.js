import React, { useState, useEffect } from 'react';
import './Settings.css';
import api from '../../services/api';
import qrImage from '../../assets/qr.jpg';

function Settings() {
  const [settings, setSettings] = useState({
    barangayName: 'Barangay Pulao',
    municipality: 'Dumangas',
    province: 'Iloilo',
    total_population: 10000,
    gcash_qr_code_url: ''
  });

  const [gcashQRFile, setGcashQRFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      if (response.data) {
        setSettings(prev => ({
          ...prev,
          ...response.data
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: name === 'total_population' ? parseInt(value) || 0 : value
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Save barangay info to localStorage for backward compatibility
      localStorage.setItem('barangaySettings', JSON.stringify({
        barangayName: settings.barangayName,
        municipality: settings.municipality,
        province: settings.province
      }));

      // Save total population to backend
      if (settings.total_population) {
        const response = await api.post('/settings/total_population', {
          value: settings.total_population
        }, {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') || '' }
        });
        console.log('Settings save response:', response.data);
      }

      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Settings save error:', err);
      alert('Failed to save settings: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleUploadGcashQR = async () => {
    if (!gcashQRFile) {
      alert('Please select a GCash QR code image');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('qrImage', gcashQRFile);

      const response = await api.post('/api/settings/gcash/upload-qr', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-admin-key': localStorage.getItem('adminKey') || ''
        }
      });

      setSettings({
        ...settings,
        gcash_qr_code_url: response.data.gcash_qr_code_url
      });
      setGcashQRFile(null);
      alert('GCash QR code uploaded successfully!');
    } catch (err) {
      alert('Failed to upload GCash QR code: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{padding: '20px', textAlign: 'center'}}>Loading settings...</div>;
  }

  return (
    <div className="settings-container">
      <h1>System Settings</h1>
      
      <div className="settings-section">
        <h2>Barangay Information</h2>
        <div className="form-group">
          <label>Barangay Name</label>
          <input type="text" name="barangayName" value={settings.barangayName} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Municipality</label>
          <input type="text" name="municipality" value={settings.municipality} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Province</label>
          <input type="text" name="province" value={settings.province} onChange={handleChange} />
        </div>
      </div>

      <div className="settings-section">
        <h2>📊 Population Settings</h2>
        <div className="form-group">
          <label>Total Barangay Population</label>
          <input 
            type="number" 
            name="total_population" 
            value={settings.total_population} 
            onChange={handleChange}
            placeholder="Enter total population"
            min="0"
          />
          <small>This is used for population-related statistics and reports</small>
        </div>
      </div>

      <div className="settings-section">
        <h2>💳 GCash Payment Settings</h2>
        <div className="form-group">
          <label>GCash QR Code Image</label>
          <p style={{fontSize: '0.9em', color: '#666', marginBottom: '10px'}}>
            Current QR code being used: <code>src/assets/qr.png</code>
          </p>
          
          <div style={{marginBottom: '15px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px'}}>
            <p style={{marginBottom: '10px', color: '#0369a1'}}>✅ Current GCash QR Code:</p>
            <img 
              src={qrImage} 
              alt="GCash QR Code" 
              style={{maxWidth: '200px', height: 'auto', borderRadius: '4px', border: '2px solid #0369a1'}}
            />
          </div>
          
          <p style={{fontSize: '0.85em', color: '#666'}}>
            To change the QR code, replace the image file at <code>frontend/src/assets/qr.png</code> with your own GCash QR code image.
          </p>
        </div>
      </div>

      <button 
        onClick={handleSave} 
        className="btn btn-primary"
        disabled={saving}
        style={{opacity: saving ? 0.5 : 1, cursor: saving ? 'not-allowed' : 'pointer'}}
      >
        {saving ? 'Saving...' : '💾 Save All Settings'}
      </button>
    </div>
  );
}

export default Settings;
