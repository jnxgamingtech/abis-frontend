import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import qrImage from '../../assets/qr.jpg';
import './BlotterForm.css';

// Cloudinary configuration from environment variables
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'diwz13e98';
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_BLOTTER_PRESET || 'abis_blotter';

function BlotterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reporterName: '',
    reporterContact: '',
    incidentDate: '',
    showReporter: false,
    paymentMethod: 'gcash'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [blotterId, setBlotterId] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Maximum 3 files allowed
    if (files.length > 3) {
      setError('Maximum 3 files allowed');
      return;
    }
    setAttachments(files);
    setError(null);
  };

  const handlePaymentProofChange = (e) => {
    if (e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Create FormData for multipart/form-data submission
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      submitFormData.append('reporterName', formData.reporterName);
      submitFormData.append('reporterContact', formData.reporterContact);
      submitFormData.append('incidentDate', formData.incidentDate);
      submitFormData.append('showReporter', formData.showReporter);
      submitFormData.append('paymentMethod', formData.paymentMethod);
      
      // Append file attachments
      attachments.forEach((file) => {
        submitFormData.append('attachments', file);
      });
      
      // DO NOT manually set Content-Type header - let axios handle it with FormData
      // axios will automatically add the boundary parameter
      const response = await api.post('blotter', submitFormData, { 
        timeout: 120000 // 120 seconds for file upload to Cloudinary
      });
      
      const newBlotterId = response.data._id || response.data.id;
      setBlotterId(newBlotterId);
      setSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        reporterName: '',
        reporterContact: '',
        incidentDate: '',
        showReporter: false,
        paymentMethod: 'gcash'
      });
      setAttachments([]);
    } catch (err) {
      console.error('Error submitting blotter:', err);
      
      // Provide specific error messages
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request took too long to complete. This usually happens when uploading large files. Please try again or use smaller files.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to submit blotter record. Please try again.');
      }
      setLoading(false);
    }
  };

  const handlePaymentProofUpload = async () => {
    if (!paymentProof || !blotterId) return;
    
    try {
      setUploadingProof(true);
      const formDataWithFile = new FormData();
      formDataWithFile.append('paymentProof', paymentProof);
      
      // Upload through backend (backend has proper Cloudinary credentials)
      await api.post(`blotter/${blotterId}/update-payment`, formDataWithFile, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Payment proof uploaded successfully!');
      setUploadingProof(false);
      navigate('/blotter-view/' + blotterId);
    } catch (err) {
      console.error('Error uploading payment proof:', err);
      setUploadingProof(false);
      alert('Failed to upload payment proof: ' + (err.response?.data?.error || err.message));
    }
  };

  if (success) {
    return (
      <div className="container blotter-success">
        <div className="success-card">
          <h2>Blotter Report Submitted Successfully!</h2>
          
          <div className="confirmation-section">
            <p><strong>Report ID:</strong> {blotterId}</p>
            <p className="instructions">Please review the payment information below:</p>
          </div>

          <div className="payment-section">
            <div className="payment-amount-box">
              <h3>Payment Required</h3>
              <p className="amount">₱20.00</p>
              <p className="note">Processing fee for blotter report</p>
            </div>

            <div className="gcash-payment-box">
              <h3>GCash Payment Instructions</h3>
              <p className="payment-note">Scan the QR code below to pay via GCash</p>
              <div className="qr-code-container">
                <img src={qrImage} alt="GCash QR Code" className="qr-code" />
              </div>
              <p className="payment-note">Payment Amount: <strong>₱20.00</strong></p>
            </div>

            <div className="payment-proof-upload">
              <h4>Upload Payment Proof</h4>
              <p className="upload-note">Take a screenshot of the successful GCash payment and upload it below</p>
              <input
                type="file"
                accept="image/*"
                onChange={handlePaymentProofChange}
                className="file-input"
                disabled={uploadingProof}
              />
              <button
                onClick={handlePaymentProofUpload}
                disabled={!paymentProof || uploadingProof}
                className="btn btn-primary"
              >
                {uploadingProof ? '⏳ Uploading...' : '📤 Upload Payment Proof'}
              </button>
            </div>
          </div>

          <div className="pickup-reminder">
            <h3>Next Steps</h3>
            <ul>
              <li>Complete the GCash payment of ₱20.00</li>
              <li>Upload your payment proof screenshot</li>
              <li>Your blotter report will be reviewed and processed</li>
              <li>Save your report ID for tracking: <strong>{blotterId}</strong></li>
            </ul>
          </div>

          <button onClick={() => navigate('/')} className="btn btn-secondary">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container blotter-form-container">
      <div className="form-card">
        <h1>Submit Blotter Report</h1>
        {error && <div className="error-message">{error}</div>}
        
        <div className="payment-reminder">
          <h4>⚠️ Payment Required</h4>
          <p>A processing fee of <strong>₱20.00</strong> is required for this blotter report.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Incident Date & Time</label>
            <input
              type="datetime-local"
              name="incidentDate"
              value={formData.incidentDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Report Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Lost Property, Dispute, etc."
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide detailed information about the incident"
              rows="6"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              name="reporterName"
              value={formData.reporterName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="text"
              name="reporterContact"
              value={formData.reporterContact}
              onChange={handleChange}
              placeholder="e.g., 09123456789"
              required
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="showReporter"
                checked={formData.showReporter}
                onChange={handleChange}
              />
              Allow my information to be shown publicly
            </label>
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
          </div>          <div className="form-group">
            <label>Attach Images or Files (Optional)</label>
            <p className="file-help-text">You can upload up to 3 images or files as evidence</p>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="file-input"
            />
            {attachments.length > 0 && (
              <div className="attached-files">
                <h4>Attached Files ({attachments.length}/3):</h4>
                <ul>
                  {attachments.map((file, index) => (
                    <li key={index}>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <span>
                ⏳ Uploading Files & Submitting... (This may take up to 2 minutes)
              </span>
            ) : (
              'Submit Blotter Report'
            )}
          </button>
        </form>
      </div>
      </div>
  );
}

export default BlotterForm;
