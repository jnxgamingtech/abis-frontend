import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import './TrackRequest.css';
import api from '../services/api';
import qrImage from '../assets/qr.jpg';

function TrackRequest() {
  const { trackingNumber: urlTrackingNumber } = useParams();
  const [trackingNumber, setTrackingNumber] = useState(urlTrackingNumber || '');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlTrackingNumber) {
      handleSearch(null, urlTrackingNumber);
    }
  }, [urlTrackingNumber]);

  const handleSearch = async (e, directNumber = null) => {
    if (e) e.preventDefault();
    
    const searchNumber = directNumber || trackingNumber;
    if (!searchNumber.trim()) return;

    setLoading(true);
    setSearched(true);

    // Try API first
    try {
      const res = await api.get(`/documents/track/by-number/${encodeURIComponent(searchNumber.trim())}`);
      if (res && res.data) {
        setResult({ found: true, doc: res.data });
        setLoading(false);
        return;
      }
    } catch (err) {
      // Fallback to localStorage
    }

    // Fallback to localStorage
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents.find(d => 
      d.trackingNumber?.toUpperCase() === searchNumber.trim().toUpperCase()
    );

    if (doc) {
      setResult({ found: true, doc });
    } else {
      setResult({ found: false });
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ffc107',
      'processing': '#3b82f6',
      'approved': '#17a2b8',
      'ready_for_pickup': '#10b981',
      'issued': '#059669',
      'collected': '#6c757d',
      'rejected': '#ef4444'
    };
    return colors[status] || '#999';
  };

  const getStatusSteps = (currentStatus) => {
    const steps = [
      { id: 'pending', label: 'Pending' },
      { id: 'processing', label: 'Processing' },
      { id: 'ready_for_pickup', label: 'Ready' },
      { id: 'issued', label: 'Issued' }
    ];

    const statusOrder = ['pending', 'processing', 'approved', 'ready_for_pickup', 'issued', 'collected'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex
    }));
  };

  return (
    <div className="track-modern">
      {/* Hero Section */}
      <div className="track-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-icon">🔍</div>
          <h1>Track Your Request</h1>
          <p>Enter your tracking number to check document status</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="track-container">
        {/* Search Section */}
        <div className="search-card">
          <h2>📋 Search by Tracking Number</h2>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number (e.g., ABIS-123456)"
                className="search-input"
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Searching...
                  </>
                ) : (
                  '🔍 Track Request'
                )}
              </button>
            </div>
          </form>

          <div className="quick-actions">
            <Link to="/my-requests" className="quick-link">
              📂 View All My Requests
            </Link>
            <Link to="/services" className="quick-link">
              ➕ Request New Document
            </Link>
          </div>
        </div>

        {/* No Result */}
        {searched && result && !result.found && (
          <div className="no-result-card">
            <div className="no-result-icon">😕</div>
            <h3>Request Not Found</h3>
            <p>We couldn't find any document request with tracking number:</p>
            <div className="search-term">"{trackingNumber}"</div>
            <p className="help-text">
              Please check if you entered the correct tracking number or try viewing all your requests.
            </p>
            <div className="no-result-actions">
              <Link to="/my-requests" className="action-btn primary">
                View All Requests
              </Link>
              <Link to="/services" className="action-btn secondary">
                Submit New Request
              </Link>
            </div>
          </div>
        )}

        {/* Result Found */}
        {result && result.found && (
          <div className="result-card">
            {/* Header */}
            <div className="result-header">
              <div className="header-icon">✅</div>
              <div className="header-info">
                <h2>Request Found!</h2>
                <div className="tracking-display">
                  <span className="tracking-label">Tracking Number:</span>
                  <code className="tracking-code">{result.doc.trackingNumber || result.doc.id}</code>
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="status-section">
              <div className="status-header">
                <span className="status-label">Current Status:</span>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(result.doc.status) }}
                >
                  {result.doc.status?.replace(/_/g, ' ') || 'Pending'}
                </span>
              </div>

              {/* Status Timeline */}
              <div className="status-timeline">
                <h3>Progress Timeline</h3>
                <div className="timeline">
                  {getStatusSteps(result.doc.status).map((step, index) => (
                    <div key={step.id} className={`timeline-step ${step.completed ? 'completed' : ''}`}>
                      <div className="timeline-dot">
                        {step.completed && <span className="check-icon">✓</span>}
                      </div>
                      <span className="timeline-label">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="details-section">
              <h3>📄 Request Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Resident Name:</span>
                  <span className="detail-value">{result.doc.residentName}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Document Type:</span>
                  <span className="detail-value">{result.doc.documentType}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Request Date:</span>
                  <span className="detail-value">
                    {result.doc.requestDate ? new Date(result.doc.requestDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                {result.doc.appointmentDatetime && (
                  <div className="detail-item">
                    <span className="detail-label">Appointment:</span>
                    <span className="detail-value">
                      {new Date(result.doc.appointmentDatetime).toLocaleString()}
                    </span>
                  </div>
                )}

                {result.doc.pickupCode && (
                  <div className="detail-item full-width">
                    <span className="detail-label">Pickup Code:</span>
                    <div className="pickup-code">
                      <span className="pickup-icon">🔐</span>
                      <code className="pickup-value">{result.doc.pickupCode}</code>
                    </div>
                  </div>
                )}

                {result.doc.purpose && (
                  <div className="detail-item full-width">
                    <span className="detail-label">Purpose:</span>
                    <span className="detail-value">{result.doc.purpose}</span>
                  </div>
                )}

                {result.doc.remarks && (
                  <div className="detail-item full-width remarks">
                    <span className="detail-label">⚠️ Official Remarks:</span>
                    <p className="detail-value">{result.doc.remarks}</p>
                  </div>
                )}
              </div>

              {/* Document Download Section */}
              <div className="detail-item full-width" style={{ marginTop: '15px' }}>
                <span className="detail-label">📥 Download Document:</span>
                <a 
                  href={`http://localhost:8000/api/documents/download/${result.doc.trackingNumber}`}
                  className="download-btn"
                  style={{ marginTop: '10px', display: 'inline-block' }}
                  download
                >
                  📄 Download Document
                </a>
              </div>
            </div>

            {/* Certificate Download Section */}
            {result.doc.status === 'ready_for_pickup' && (
              <div className="certificate-section">
                <h3>📄 Certificate Download</h3>
                {result.doc.certificateUrl ? (
                  <div className="certificate-ready">
                    <div className="success-message">
                      <span className="success-icon">✅</span>
                      <p>Your certificate is ready! You can download it below or pick it up at the barangay office.</p>
                    </div>
                    <a 
                      href={result.doc.certificateUrl.includes('cloudinary') ? `${result.doc.certificateUrl}?dl=1` : result.doc.certificateUrl}
                      download={result.doc.certificateFileName || 'certificate.pdf'}
                      className="download-btn"
                    >
                      📥 Download Certificate
                    </a>
                    {result.doc.certificateFileName && (
                      <p style={{fontSize: '0.85em', color: '#666', marginTop: '10px'}}>
                        File: {result.doc.certificateFileName}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="certificate-pending">
                    <p>Your certificate is being prepared. Please check back soon or visit the barangay office.</p>
                  </div>
                )}
              </div>
            )}

            {/* Certification Record Download Section */}
            <div className="certification-record-section">
              <h3>📋 Certification Record</h3>
              <div className="certification-info">
                <p><strong>Times Certified:</strong> {result.doc.certificationCount || 0}</p>
                {result.doc.crimeRecordStatus && (
                  <p><strong>Crime Record Status:</strong> {result.doc.crimeRecordStatus.toUpperCase()}</p>
                )}
                <p style={{ marginTop: '10px' }}>
                  <strong>Download your complete certification record as PDF:</strong>
                </p>
                <a 
                  href={`http://localhost:8000/api/documents/download-certification/${result.doc.trackingNumber}`}
                  className="download-btn"
                  style={{ marginTop: '10px' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📄 Download Certification Record (PDF)
                </a>
              </div>
            </div>

            {/* Payment & Pickup Information */}
            <div className="payment-pickup-section">
              <div className="pickup-instructions">
                <h3>📍 Pickup Instructions</h3>
                <div className="instruction-box">
                  <p><strong>What to bring:</strong></p>
                  <ul>
                    <li>✓ Your Tracking Number: <code>{result.doc.trackingNumber}</code></li>
                    <li>✓ Your Pickup Code: <code>{result.doc.pickupCode}</code></li>
                    {result.doc.paymentMethod === 'gcash' && (
                      <li>✓ Screenshot of GCash Payment Receipt</li>
                    )}
                    <li>✓ Valid ID</li>
                  </ul>
                </div>
              </div>

              {result.doc.paymentMethod === 'gcash' && (
                <div className="payment-status-section">
                  <h3>💳 Payment Status</h3>
                  <div className="payment-info">
                    <p><strong>Payment Method:</strong> GCash</p>
                    <p><strong>Amount:</strong> ₱20.00</p>
                    <p style={{
                      padding: '8px',
                      borderRadius: '4px',
                      backgroundColor: 
                        result.doc.paymentStatus === 'paid' ? '#dcfce7' :
                        result.doc.paymentStatus === 'pending_verification' ? '#fef3c7' :
                        '#fee2e2',
                      color:
                        result.doc.paymentStatus === 'paid' ? '#15803d' :
                        result.doc.paymentStatus === 'pending_verification' ? '#92400e' :
                        '#991b1b'
                    }}>
                      <strong>Status:</strong> {result.doc.paymentStatus === 'paid' ? '✅ PAID' : result.doc.paymentStatus === 'pending_verification' ? '⏳ PENDING VERIFICATION' : '❌ UNPAID'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {/*   <Link to="/my-requests" className="action-btn primary">
                View All Requests
              </Link>*/}
              <button 
                onClick={() => {
                  setResult(null);
                  setSearched(false);
                  setTrackingNumber('');
                }} 
                className="action-btn secondary"
              >
                Search Again
              </button>
            </div>
          
        )}

        {/* Info Section */}
        {!searched && (
          <div className="info-section">
            <h3>ℹ️ How to Track Your Request</h3>
            <div className="info-steps">
              <div className="info-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Get Your Tracking Number</h4>
                  <p>You received a tracking number when you submitted your document request.</p>
                </div>
              </div>

              <div className="info-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Enter Tracking Number</h4>
                  <p>Type or paste your tracking number in the search box above.</p>
                </div>
              </div>

              <div className="info-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Check Status</h4>
                  <p>View your request status, timeline, and pickup information.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackRequest;
