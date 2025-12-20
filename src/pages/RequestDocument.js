import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './RequestDocument.css';
import api from '../services/api';
import qrImage from '../assets/qr.jpg';

const DOCUMENT_FIELDS = {
  'Barangay Clearance': [
    { name: 'purpose', label: 'Purpose', type: 'text', required: true },
  ],
  'Certificate of Residency': [
    { name: 'years_resided', label: 'Years of Residency', type: 'number', required: false },
  ],
  'Certificate of Indigency': [
    { name: 'household_income', label: 'Household Monthly Income', type: 'number', required: false },
  ],
  'Good Moral Certificate': [
    { name: 'school', label: 'School / Employer', type: 'text', required: false },
  ],
  'Business Permit': [
    { name: 'business_name', label: 'Business Name', type: 'text', required: true },
    { name: 'business_address', label: 'Business Address', type: 'text', required: true },
    { name: 'business_owner', label: "Owner's Full Name", type: 'text', required: true },
    { name: 'business_type', label: 'Type of Business', type: 'text', required: false },
    { name: 'business_registration', label: 'Business Registration / DTI Number', type: 'text', required: false },
  ],
  'Certificate of Death': [
    { name: 'deceased_name', label: 'Deceased Name', type: 'text', required: true },
  ],
  'Certificate for PWD': [
    { name: 'disability_type', label: 'Type of Disability', type: 'text', required: false },
  ],
  'Certificate of Vaccination': [
    { name: 'vaccine_type', label: 'Vaccine Type', type: 'text', required: false },
  ],
  'Certificate of Appearance': [
    { name: 'purpose', label: 'Purpose', type: 'text', required: false },
  ],
  'Certificate for Achiever': [
    { name: 'achievement', label: 'Achievement Details', type: 'text', required: false },
  ],
  'First Time Jobseeker Oath': [
    { name: 'school_graduated', label: 'School Graduated From', type: 'text', required: false },
  ],
  'Certificate of Live-In': [
    { name: 'partner_name', label: 'Partner Name', type: 'text', required: false },
  ],
};

const PAYMENT_AMOUNT = 20; // PHP
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'diwz13e98';
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_DOCUMENTS_PRESET || 'abis_documents';

function RequestDocument() {
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get('type') || 'Barangay Clearance';
  const [formData, setFormData] = useState({
    requestDate: new Date().toISOString().slice(0, 10),
    residentName: '',
    documentType: serviceType,
    phone: '',
    phone2: '',
    email: '',
    appointmentDatetime: '',
    pickup: true,
    pickupCode: '',
    formFields: {},
    paymentMethod: 'gcash',
    paymentProof: null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    });
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, formFields: { ...prev.formFields, [name]: value } }));
  };

  const handlePaymentProofChange = (e) => {
    setFormData({
      ...formData,
      paymentProof: e.target.files[0]
    });
  };

  const handlePaymentProofUpload = async () => {
    const documentId = submitted.documentId;
    if (!formData.paymentProof || !documentId) return;
    
    try {
      setUploadingProof(true);
      const formDataWithFile = new FormData();
      formDataWithFile.append('paymentProof', formData.paymentProof);
      
      // Upload through backend (backend has proper Cloudinary credentials)
      await api.post(`documents/${documentId}/update-payment`, formDataWithFile, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Payment proof uploaded successfully!');
      setUploadingProof(false);
    } catch (err) {
      console.error('Error uploading payment proof:', err);
      setUploadingProof(false);
      alert('Failed to upload payment proof: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        residentName: formData.residentName,
        documentType: formData.documentType,
        formFields: formData.formFields,
        phone: formData.phone,
        phone2: formData.phone2,
        email: formData.email,
        appointmentDatetime: formData.appointmentDatetime || null,
        pickup: formData.pickup,
        paymentMethod: formData.paymentMethod,
      };

      // Save to backend
      const response = await api.post('/documents', payload);
      const newDoc = response.data;

      // If payment proof is provided, upload it
      if (formData.paymentProof) {
        const formDataPayment = new FormData();
        formDataPayment.append('paymentProof', formData.paymentProof);
        
        try {
          await api.post(`/documents/${newDoc.id}/update-payment`, formDataPayment, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (uploadErr) {
          console.warn('Failed to upload payment proof:', uploadErr.message);
        }
      }

      setSubmitted({
        trackingNumber: newDoc.trackingNumber,
        pickupCode: newDoc.pickupCode,
        paymentMethod: newDoc.paymentMethod,
        documentId: newDoc.id || newDoc._id,
      });
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit request. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="request-success">
        <div className="success-box">
          <div className="success-icon">✓</div>
          <h2>Request Submitted Successfully!</h2>
          <p>Your document request has been received by the barangay.</p>
          
          {/* Tracking Info */}
          <div className="tracking-info">
            <p className="tracking-label">Your Tracking Number:</p>
            <p className="tracking-number">{submitted.trackingNumber}</p>
            <p className="tracking-hint">Save this number to track your request</p>
          </div>

          {/* Payment Instructions */}
          <div className="payment-instructions">
            <h3>💳 Payment Instructions</h3>
            <div className="payment-box">
              <p className="payment-amount">Amount Due: <strong>₱{PAYMENT_AMOUNT}.00</strong></p>
              
              <div className="gcash-section">
                <h4>📱 GCash Payment</h4>
                <p>Scan the QR code below using your GCash app to pay:</p>
                <div className="qr-display">
                  <img src={qrImage} alt="GCash QR Code" className="qr-image" />
                </div>
                <p className="qr-instruction">
                  <strong>⚠️ Important:</strong> Please take a screenshot of your GCash payment confirmation and bring it together with your pickup code when collecting your document.
                </p>
              </div>
              
              <div className="pickup-reminder">
                <h4>📋 What to Bring for Pickup:</h4>
                <ul>
                  <li>✓ Your Tracking Number: <strong>{submitted.trackingNumber}</strong></li>
                  <li>✓ Your Pickup Code: <strong>{submitted.pickupCode}</strong></li>
                  <li>✓ Screenshot of GCash Payment Receipt</li>
                  <li>✓ Valid ID</li>
                </ul>
              </div>

              <div className="payment-proof-upload">
                <h4>📸 Upload Payment Proof</h4>
                <p>Upload a screenshot of your successful GCash payment below:</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentProofChange}
                  className="file-input"
                  disabled={uploadingProof}
                />
                <button
                  onClick={handlePaymentProofUpload}
                  disabled={!formData.paymentProof || uploadingProof}
                  className="btn btn-primary"
                  style={{ marginTop: '10px' }}
                >
                  {uploadingProof ? '⏳ Uploading...' : '📤 Upload Payment Proof'}
                </button>
              </div>
            </div>
          </div>

          <div className="success-actions">
            <Link to={`/track/${submitted.trackingNumber}`} className="track-btn">
              Track Your Request
            </Link>
            <Link to="/services" className="back-btn">
              Back to Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="request-container">
        <h1>Request {formData.documentType}</h1>
        <form onSubmit={handleSubmit} className="request-form">
          <div className="form-row">
            <div className="form-group">
              <label>Your Full Name *</label>
              <input
                type="text"
                name="residentName"
                value={formData.residentName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Request Date</label>
              <input type="date" name="requestDate" value={formData.requestDate} readOnly />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Optional 2nd Phone</label>
              <input
                type="tel"
                name="phone2"
                value={formData.phone2}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {(DOCUMENT_FIELDS[formData.documentType] || []).map((f) => (
            <div className="form-group" key={f.name}>
              <label>{f.label}{f.required && ' *'}</label>
              <input
                type={f.type}
                name={f.name}
                value={formData.formFields?.[f.name] || ''}
                onChange={(e) => handleFieldChange(f.name, e.target.value)}
                required={f.required}
              />
            </div>
          ))}

          {/* Generic Purpose removed — purpose fields are present per-document in DOCUMENT_FIELDS */}

          <div className="form-divider">Pickup Details</div>

          <div className="form-group">
            <label>Preferred Pickup Date & Time</label>
            <input
              type="datetime-local"
              name="appointmentDatetime"
              value={formData.appointmentDatetime}
              onChange={handleChange}
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="pickup"
                checked={formData.pickup}
                onChange={handleChange}
              />
              I will pick up the document at the barangay hall
            </label>
          </div>

          {formData.pickup && (
            <div className="info-box">
              <p>You will receive a pickup code. Save it to collect your document at the barangay hall.</p>
            </div>
          )}

          {/* Payment Section */}
          <div className="form-divider">💳 Payment Information</div>
          
          <div className="payment-reminder">
            <h4>⚠️ Payment Required</h4>
            <p>A processing fee of <strong>₱{PAYMENT_AMOUNT}.00</strong> is required for this document request.</p>
          </div>
          
          <div className="payment-section">
            <div className="payment-amount-box">
              <h3>Document Request Fee: <span className="amount">₱{PAYMENT_AMOUNT}.00</span></h3>
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
              >
                <option value="gcash">GCash</option>
                <option value="bank">Bank Transfer</option>
                <option value="cash">Walk-in Payment (Cash)</option>
              </select>
            </div>

            <div className="gcash-payment-box">
              <h4>📱 GCash Payment Instructions</h4>
              <p className="payment-instruction">
                Payment of <strong>₱{PAYMENT_AMOUNT}.00</strong> is required. The QR code to scan will be shown after you submit your request.
              </p>

              <div className="payment-proof-upload">
                <h4>📸 Ready to Pay?</h4>
                <p>After submitting your request, you will receive a QR code to scan and make your GCash payment.</p>
              </div>
            </div>
          </div>

          <div className="form-actions">
            {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
            <button type="submit" className="submit-btn">Submit Request</button>
            <Link to="/services" className="cancel-btn">Back to Services</Link>
          </div>
        </form>
    </div>
  );
}

export default RequestDocument;
