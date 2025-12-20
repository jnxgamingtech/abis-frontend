import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './BlotterList.css';

function BlotterList() {
  const [blotters, setBlotters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBlotter, setSelectedBlotter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [crimeRecordStatus, setCrimeRecordStatus] = useState(null);

  useEffect(() => {
    fetchBlotters();
  }, []);

  const fetchBlotters = async () => {
    try {
      setLoading(true);
      const response = await api.get('blotter');
      setBlotters(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching blotters:', err);
      setError('Failed to load blotter records');
      setBlotters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await api.delete(`blotter/${id}`);
        setBlotters(blotters.filter(b => b._id !== id));
      } catch (err) {
        console.error('Error deleting blotter:', err);
        alert('Failed to delete record');
      }
    }
  };

  const openModal = (blotter) => {
    setSelectedBlotter(blotter);
    setCertificateFile(null);
    setCrimeRecordStatus(blotter.crimeRecordStatus || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBlotter(null);
    setCertificateFile(null);
    setCrimeRecordStatus(null);
  };

  const handleUploadCertificate = async () => {
    if (!certificateFile || !selectedBlotter) {
      alert('Please select a certificate file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('certificate', certificateFile);

      await api.post(`blotter/${selectedBlotter._id}/upload-certificate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Certificate uploaded successfully!');
      setCertificateFile(null);
      fetchBlotters();
      closeModal();
    } catch (err) {
      console.error('Error uploading certificate:', err);
      alert('Failed to upload certificate');
    }
  };

  const handleSetCrimeRecord = async (status) => {
    if (!selectedBlotter) return;

    try {
      await api.post(`blotter/${selectedBlotter._id}/set-crime-record`, {
        crimeRecordStatus: status
      });

      alert('Crime record status updated!');
      setCrimeRecordStatus(status);
      fetchBlotters();
    } catch (err) {
      console.error('Error setting crime record status:', err);
      alert('Failed to set crime record status: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="loading">Loading blotter records...</div>;

  return (
    <div className="blotter-list-container">
      <div className="header">
        <h1>Blotter Records</h1>
        <Link to="/blotter/new" className="btn btn-primary">Add New Record</Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Reporter</th>
            <th>Title</th>
            <th>Description</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Crime Record</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {blotters.length === 0 ? (
            <tr><td colSpan="8" className="text-center">No blotter records found</td></tr>
          ) : (
            blotters.map(blotter => (
              <tr key={blotter._id}>
                <td>{new Date(blotter.incidentDate).toLocaleDateString()}</td>
                <td>{blotter.reporterName}</td>
                <td>{blotter.title}</td>
                <td>{blotter.description.substring(0, 50)}...</td>
                <td><span className={`badge badge-${blotter.status}`}>{blotter.status}</span></td>
                <td>
                  <span className={`badge badge-${blotter.paymentStatus || 'pending'}`}>
                    {blotter.paymentStatus || 'pending'}
                  </span>
                </td>
                <td>
                  {blotter.crimeRecordStatus ? (
                    <span className={`badge badge-${blotter.crimeRecordStatus === 'yes' ? 'danger' : 'success'}`}>
                      {blotter.crimeRecordStatus.toUpperCase()}
                    </span>
                  ) : (
                    <span className="badge badge-gray">-</span>
                  )}
                </td>
                <td>
                  <Link to={`/blotter/view/${blotter._id}`} className="btn btn-sm btn-info">View</Link>
                  <button onClick={() => openModal(blotter)} className="btn btn-sm btn-edit">Manage</button>
                  <button onClick={() => handleDelete(blotter._id)} className="btn btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && selectedBlotter && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Blotter Record</h2>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3>Report ID</h3>
                <p>{selectedBlotter._id}</p>
              </div>

              {/* Certificate Section */}
              <div className="modal-section">
                <h3>Upload Certificate</h3>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setCertificateFile(e.target.files[0])}
                  className="file-input"
                />
                <button onClick={handleUploadCertificate} className="btn btn-primary btn-sm">
                  Upload Certificate
                </button>
                {selectedBlotter.certificateUrl && (
                  <p className="success-text">✓ Certificate uploaded</p>
                )}
              </div>

              {/* Crime Record Section */}
              <div className="modal-section">
                <h3>Crime Record Status</h3>
                <div className="button-group">
                  <button
                    onClick={() => handleSetCrimeRecord('yes')}
                    className={`btn btn-sm ${crimeRecordStatus === 'yes' ? 'btn-danger' : 'btn-outline'}`}
                  >
                    Set: Has Crime Record
                  </button>
                  <button
                    onClick={() => handleSetCrimeRecord('no')}
                    className={`btn btn-sm ${crimeRecordStatus === 'no' ? 'btn-success' : 'btn-outline'}`}
                  >
                    Set: No Crime Record
                  </button>
                </div>
              </div>

              {/* Certification Count Section */}
              <div className="modal-section">
                <h3>Certification Count</h3>
                <p>Times Verified: <strong>{selectedBlotter.certificationCount || 0}</strong></p>
              </div>

              {/* Payment Information */}
              <div className="modal-section">
                <h3>Payment Information</h3>
                <div style={{marginBottom: '10px'}}>
                  <label><strong>Payment Status:</strong></label>
                  <select 
                    value={selectedBlotter.paymentStatus || 'pending'}
                    onChange={(e) => handleUpdateBlotterPayment(selectedBlotter._id || selectedBlotter.id, 'paymentStatus', e.target.value)}
                    style={{padding: '6px', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer', marginTop: '5px', width: '100%'}}
                  >
                    <option value="pending">Pending</option>
                    <option value="pending_verification">Pending Verification</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                <div style={{marginBottom: '10px'}}>
                  <label><strong>Payment Method:</strong></label>
                  <select 
                    value={selectedBlotter.paymentMethod || 'gcash'}
                    onChange={(e) => handleUpdateBlotterPayment(selectedBlotter._id || selectedBlotter.id, 'paymentMethod', e.target.value)}
                    style={{padding: '6px', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer', marginTop: '5px', width: '100%'}}
                  >
                    <option value="gcash">GCash</option>
                    <option value="at_site">At Site</option>
                  </select>
                </div>
                {selectedBlotter.paymentProofUrl && (
                  <p className="success-text">✓ Payment proof received</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={closeModal} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
