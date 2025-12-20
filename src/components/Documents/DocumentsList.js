import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import './DocumentsList.css';

// Cloudinary configuration from environment variables
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'diwz13e98';
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_DOCUMENTS_PRESET || 'abis_documents';

function DocumentsList() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Modal states
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [crimeRecordStatus, setCrimeRecordStatus] = useState(null);
  const [uploadingCert, setUploadingCert] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents');
      setRequests(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = async (id) => {
    try {
      const response = await api.get(`/documents/${id}`);
      setViewModal(response.data);
    } catch (err) {
      alert('Failed to load document details: ' + err.message);
    }
  };

  const openEditModal = (request) => {
    setEditModal({
      ...request,
      _id: request._id || request.id
    });
  };

  const closeViewModal = () => setViewModal(null);
  const closeEditModal = () => setEditModal(null);

  const saveEdit = async () => {
    if (!editModal) return;
    const docId = editModal._id || editModal.id;
    try {
      await api.patch(`/documents/${docId}`, {
        status: editModal.status,
        residentName: editModal.residentName,
        documentType: editModal.documentType,
      });
      await fetchRequests();
      closeEditModal();
    } catch (err) {
      alert('Failed to save changes: ' + err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/documents/${id}`, { status: newStatus });
      fetchRequests();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchRequests();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleUploadCertificate = async (id) => {
    if (!certificateFile) {
      alert('Please select a certificate file');
      return;
    }

    try {
      setUploadingCert(true);
      const formData = new FormData();
      formData.append('file', certificateFile);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      // Upload to Cloudinary
      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      const cloudinaryData = await cloudinaryRes.json();
      
      if (!cloudinaryRes.ok) {
        console.error('Cloudinary error response:', cloudinaryData);
        const errorMsg = cloudinaryData.error?.message || JSON.stringify(cloudinaryData.error) || 'Failed to upload to Cloudinary';
        console.error('Full error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      const certificateUrl = cloudinaryData.secure_url;
      const docId = id || viewModal._id || viewModal.id;
      
      console.log('Uploading certificate for document ID:', docId);
      
      // Save to database
      const response = await api.patch(`/documents/${docId}`, {
        certificateUrl,
        certificateFileName: certificateFile.name,
        status: 'ready_for_pickup'
      });
      
      setViewModal(response.data);
      setCertificateFile(null);
      setUploadingCert(false);
      fetchRequests();
      alert('Certificate uploaded successfully to Cloudinary!');
    } catch (err) {
      setUploadingCert(false);
      console.error('Certificate upload error:', err);
      alert('Failed to upload certificate: ' + err.message);
    }
  };

  const handleSetCrimeRecord = async (id, status) => {
    try {
      const response = await api.post(`/documents/${id}/set-crime-record`, {
        crimeRecordStatus: status
      });
      
      setViewModal(response.data);
      setCrimeRecordStatus(null);
      fetchRequests();
      alert(`Crime record status set to: ${status}`);
    } catch (err) {
      alert('Failed to set crime record status: ' + err.message);
    }
  };

  const handleUpdatePaymentInfo = async (id, field, value) => {
    try {
      const updateData = {};
      updateData[field] = value;
      
      const response = await api.patch(`/documents/${id}`, updateData);
      setViewModal(response.data);
      fetchRequests();
      alert(`${field === 'paymentMethod' ? 'Payment method' : 'Payment status'} updated successfully!`);
    } catch (err) {
      alert(`Failed to update ${field}: ` + err.message);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.residentName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || req.documentType === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      approved: '#0066cc',
      issued: '#10b981',
      collected: '#6b7280',
      rejected: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner-admin"></div>
        <p>Loading document requests...</p>
      </div>
    );
  }

  return (
    <div className="documents-modern">
      {/* Hero Section */}
      <div className="documents-hero">
        <div className="documents-hero-overlay"></div>
        <div className="documents-hero-content">
          <div className="documents-hero-info">
            <h1>📄 Document Requests Management</h1>
            <p>Track and manage all barangay document requests</p>
          </div>
          <div className="documents-hero-stats">
            <div className="stat-card">
              <span className="stat-number">{requests.filter(r => r.status === 'pending').length}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{requests.filter(r => r.status === 'approved').length}</span>
              <span className="stat-label">Approved</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{requests.length}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Container */}
      <div className="documents-container">
        {error && <div className="documents-error">❌ {error}</div>}

        {/* Filters Section */}
        <div className="documents-section">
          <div className="section-header">
            <div className="section-title">
              <div className="section-icon">🔍</div>
              <h2>
                Filter Requests
                <span className="section-badge">{filteredRequests.length}</span>
              </h2>
            </div>
          </div>

          <div className="filters-grid">
            <div className="filter-item">
              <input
                type="text"
                placeholder="Search by tracking number or resident name..."
                className="filter-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-item">
              <label>Status:</label>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="issued">Issued</option>
                <option value="collected">Collected</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Category:</label>
              <select
                className="filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Certificate of Residency">Certificate of Residency</option>
                <option value="Barangay Clearance">Barangay Clearance</option>
                <option value="Certificate of Indigency">Certificate of Indigency</option>
                <option value="Business Permit">Business Permit</option>
              </select>
            </div>

            <div className="filter-item">
              <button className="btn-clear" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="documents-section">
          <div className="section-header">
            <div className="section-title">
              <div className="section-icon">📋</div>
              <h2>
                All Requests
                <span className="section-badge">{filteredRequests.length}</span>
              </h2>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="documents-empty-state">
              <div className="documents-empty-icon">📭</div>
              <h3>No Requests Found</h3>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="documents-grid">
              {filteredRequests.map((req) => {
                const docId = req._id || req.id;
                return (
                  <div key={docId} className="document-card">
                    <div className="card-header-doc">
                      <div className="card-title-section">
                        <div className="tracking-code">{req.trackingNumber}</div>
                        <span
                          className="status-badge-doc"
                          style={{ backgroundColor: getStatusColor(req.status) }}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>

                    <div className="card-body-doc">
                      <div className="doc-info-row">
                        <span className="doc-label">📅 Request Date:</span>
                        <span className="doc-value">{formatDate(req.requestDate)}</span>
                      </div>

                      <div className="doc-info-row">
                        <span className="doc-label">👤 Resident:</span>
                        <span className="doc-value">{req.residentName}</span>
                      </div>

                      <div className="doc-info-row">
                        <span className="doc-label">📄 Document Type:</span>
                        <span className="doc-value">{req.documentType}</span>
                      </div>

                      <div className="doc-info-row">
                        <span className="doc-label">📊 Status:</span>
                        <select
                          className={`status-select-doc status-${req.status}`}
                          value={req.status}
                          onChange={(e) => handleStatusChange(docId, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="issued">Issued</option>
                          <option value="collected">Collected</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="card-actions-doc">
                      <button 
                        className="action-btn btn-view"
                        onClick={() => openViewModal(docId)}
                      >
                        👁️ View Details
                      </button>
                      <button 
                        className="action-btn btn-edit"
                        onClick={() => openEditModal(req)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="action-btn btn-delete"
                        onClick={() => handleDelete(docId)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeViewModal}>✕</button>
            
            <div className="modal-header">
              <h2>📄 Complete Document Request Details</h2>
              <span
                className="status-badge-doc"
                style={{ backgroundColor: getStatusColor(viewModal.status) }}
              >
                {viewModal.status}
              </span>
            </div>

            <div className="modal-body">
              {/* Database ID Section */}
              <div className="modal-section">
                <h3>🔑 System Information</h3>
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <strong>Database ID:</strong>
                    <span className="monospace-text">{viewModal._id || viewModal.id}</span>
                  </div>
                </div>
              </div>

              {/* Request Information */}
              <div className="modal-section">
                <h3>📋 Request Information</h3>
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <strong>Tracking Number:</strong>
                    <span className="tracking-code">{viewModal.trackingNumber || 'N/A'}</span>
                  </div>
                  <div className="modal-info-item">
                    <strong>Document Type (docType):</strong>
                    <span>{viewModal.docType || viewModal.documentType || 'N/A'}</span>
                  </div>
                  <div className="modal-info-item">
                    <strong>Status:</strong>
                    <span>{viewModal.status || 'N/A'}</span>
                  </div>
                  <div className="modal-info-item">
                    <strong>Pickup Code:</strong>
                    <span className="monospace-text">{viewModal.pickupCode || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Resident Information */}
              <div className="modal-section">
                <h3>👤 Resident Information</h3>
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <strong>Resident Name:</strong>
                    <span>{viewModal.residentName || 'N/A'}</span>
                  </div>
                  <div className="modal-info-item">
                    <strong>Contact:</strong>
                    <span>{viewModal.residentContact || viewModal.contact || 'N/A'}</span>
                  </div>
                  <div className="modal-info-item">
                    <strong>Address:</strong>
                    <span>{viewModal.residentAddress || viewModal.address || 'N/A'}</span>
                  </div>
                  <div className="modal-info-item">
                    <strong>Email:</strong>
                    <span>{viewModal.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Purpose Section */}
              {viewModal.purpose && (
                <div className="modal-section">
                  <h3>📝 Purpose</h3>
                  <div className="purpose-box">
                    <p>{viewModal.purpose}</p>
                  </div>
                </div>
              )}

              {/* Form Data Section */}
              {viewModal.formData && Object.keys(viewModal.formData).length > 0 && (
                <div className="modal-section">
                  <h3>📝 Form Data (Additional Fields)</h3>
                  <div className="modal-info-grid">
                    {Object.entries(viewModal.formData).map(([key, value]) => (
                      <div className="modal-info-item" key={key}>
                        <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong>
                        <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="modal-section">
                <h3>⏰ Timestamps</h3>
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <strong>Request Date:</strong>
                    <span>{formatDate(viewModal.requestDate || viewModal.createdAt)}</span>
                  </div>
                  <div className="modal-info-item">
                    <strong>Created At:</strong>
                    <span>{formatDate(viewModal.createdAt)}</span>
                  </div>
                  <div className="modal-info-item">
                    <strong>Updated At:</strong>
                    <span>{formatDate(viewModal.updatedAt)}</span>
                  </div>
                  <div className="modal-info-item">
                    <strong>Appointment DateTime:</strong>
                    <span>{viewModal.appointmentDatetime ? formatDate(viewModal.appointmentDatetime) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Remarks Section */}
              {viewModal.remarks && (
                <div className="modal-section">
                  <h3>💬 Remarks</h3>
                  <div className="remarks-box">
                    <p>{viewModal.remarks}</p>
                  </div>
                </div>
              )}

              {/* Certificate Upload Section */}
              <div className="modal-section">
                <h3>📄 Certificate Upload</h3>
                {viewModal.certificateUrl ? (
                  <div className="modal-info-item">
                    <strong>Certificate:</strong>
                    <div>
                      <p style={{color: 'green', marginBottom: '10px'}}>✅ Certificate Uploaded</p>
                      <a href={viewModal.certificateUrl} target="_blank" rel="noopener noreferrer" className="modal-link">
                        📥 Download Certificate
                      </a>
                      <p style={{fontSize: '0.9em', color: '#666', marginTop: '5px'}}>File: {viewModal.certificateFileName}</p>
                      
                      {/* Replace Certificate Section */}
                      <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd'}}>
                        <p style={{fontSize: '0.9em', color: '#666', marginBottom: '10px'}}>
                          <strong>Replace Certificate:</strong> Upload a different file
                        </p>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setCertificateFile(e.target.files[0])}
                          style={{marginBottom: '10px'}}
                          disabled={uploadingCert}
                        />
                        <button 
                          className="action-btn btn-view"
                          onClick={() => handleUploadCertificate(viewModal._id || viewModal.id)}
                          style={{marginTop: '10px'}}
                          disabled={uploadingCert || !certificateFile}
                        >
                          {uploadingCert ? '⏳ Replacing...' : '🔄 Replace Certificate'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setCertificateFile(e.target.files[0])}
                      style={{marginBottom: '10px'}}
                      disabled={uploadingCert}
                    />
                    <button 
                      className="action-btn btn-view"
                      onClick={() => handleUploadCertificate(viewModal._id || viewModal.id)}
                      style={{marginTop: '10px'}}
                      disabled={uploadingCert || !certificateFile}
                    >
                      {uploadingCert ? '⏳ Uploading to Cloudinary...' : '📤 Upload Certificate to Cloudinary'}
                    </button>
                    <p style={{fontSize: '0.85em', color: '#666', marginTop: '5px'}}>
                      Upload PDF or image file to Cloudinary. User can download via tracking number.
                    </p>
                  </div>
                )}
              </div>

              {/* Crime Record Section */}
              <div className="modal-section">
                <h3>⚠️ Crime Record Status</h3>
                <div className="modal-info-item">
                  <strong>Current Status:</strong>
                  <span style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    backgroundColor: 
                      viewModal.crimeRecordStatus === 'yes' ? '#fee2e2' :
                      viewModal.crimeRecordStatus === 'no' ? '#dcfce7' :
                      '#f3f4f6',
                    color:
                      viewModal.crimeRecordStatus === 'yes' ? '#b91c1c' :
                      viewModal.crimeRecordStatus === 'no' ? '#15803d' :
                      '#374151'
                  }}>
                    {viewModal.crimeRecordStatus === 'yes' ? '🚫 YES - Has Crime Record' :
                     viewModal.crimeRecordStatus === 'no' ? '✅ NO - No Crime Record' :
                     '❓ NOT SET'}
                  </span>
                </div>
                <div style={{marginTop: '15px', display: 'flex', gap: '10px'}}>
                  <button 
                    className="action-btn btn-delete"
                    onClick={() => handleSetCrimeRecord(viewModal.id, 'yes')}
                  >
                    🚫 Set: Has Crime Record
                  </button>
                  <button 
                    className="action-btn btn-view"
                    onClick={() => handleSetCrimeRecord(viewModal.id, 'no')}
                  >
                    ✅ Set: No Crime Record
                  </button>
                </div>
              </div>

              {/* Certification Count Section */}
              <div className="modal-section">
                <h3>📋 Certification Record</h3>
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <strong>Times Certified:</strong>
                    <input
                      type="number"
                      min="0"
                      value={viewModal.certificationCount || 0}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        setViewModal({...viewModal, certificationCount: newValue});
                        handleUpdatePaymentInfo(viewModal.id || viewModal._id, 'certificationCount', newValue);
                      }}
                      style={{
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        cursor: 'pointer',
                        width: '100px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              {viewModal.paymentMethod && (
                <div className="modal-section">
                  <h3>💳 Payment Information</h3>
                  <div className="modal-info-grid">
                    <div className="modal-info-item">
                      <strong>Payment Method:</strong>
                      <select 
                        value={viewModal.paymentMethod || 'gcash'}
                        onChange={(e) => {
                          setViewModal({...viewModal, paymentMethod: e.target.value});
                          handleUpdatePaymentInfo(viewModal.id || viewModal._id, 'paymentMethod', e.target.value);
                        }}
                        style={{padding: '6px', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer'}}
                      >
                        <option value="gcash">GCash</option>
                        <option value="at_site">At Site</option>
                      </select>
                    </div>
                    <div className="modal-info-item">
                      <strong>Payment Status:</strong>
                      <select
                        value={viewModal.paymentStatus || 'pending'}
                        onChange={(e) => {
                          setViewModal({...viewModal, paymentStatus: e.target.value});
                          handleUpdatePaymentInfo(viewModal.id || viewModal._id, 'paymentStatus', e.target.value);
                        }}
                        style={{
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          cursor: 'pointer',
                          backgroundColor:
                            viewModal.paymentStatus === 'paid' ? '#d1fae5' :
                            viewModal.paymentStatus === 'pending_verification' ? '#fef3c7' :
                            '#fee2e2'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="pending_verification">Pending Verification</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw JSON Data (Expandable) */}
              <div className="modal-section">
                <h3>🔍 Complete Raw Data (JSON)</h3>
                <details className="json-details">
                  <summary className="json-summary">Click to view complete database object</summary>
                  <pre className="json-viewer">
                    {JSON.stringify(viewModal, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeEditModal}>✕</button>
            
            <div className="modal-header">
              <h2>Edit Document Request</h2>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <div className="edit-form-group">
                  <label>Tracking Number:</label>
                  <input
                    type="text"
                    className="edit-input"
                    value={editModal.trackingNumber}
                    disabled
                  />
                </div>

                <div className="edit-form-group">
                  <label>Resident Name:</label>
                  <input
                    type="text"
                    className="edit-input"
                    value={editModal.residentName}
                    onChange={(e) => setEditModal({ ...editModal, residentName: e.target.value })}
                  />
                </div>

                <div className="edit-form-group">
                  <label>Document Type:</label>
                  <select
                    className="edit-input"
                    value={editModal.documentType}
                    onChange={(e) => setEditModal({ ...editModal, documentType: e.target.value })}
                  >
                    <option value="Certificate of Residency">Certificate of Residency</option>
                    <option value="Barangay Clearance">Barangay Clearance</option>
                    <option value="Certificate of Indigency">Certificate of Indigency</option>
                    <option value="Business Permit">Business Permit</option>
                  </select>
                </div>

                <div className="edit-form-group">
                  <label>Status:</label>
                  <select
                    className="edit-input"
                    value={editModal.status}
                    onChange={(e) => setEditModal({ ...editModal, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="issued">Issued</option>
                    <option value="collected">Collected</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={saveEdit} className="modal-btn btn-save">
                  💾 Save Changes
                </button>
                <button onClick={closeEditModal} className="modal-btn btn-cancel">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentsList;
