import { useState } from 'react';
import api from '../api/axios';
import './Modal.css';

export default function CreateEvidenceModal({ caseId, caseNumber, onClose, onCreated }) {
  const [form, setForm] = useState({
    title:         '',
    description:   '',
    evidenceType:  'Document',
    fileReference: '',
    collectedAt:   new Date().toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        collectedAt: new Date(form.collectedAt).toISOString(),
        caseId,
      };
      const res = await api.post('/api/evidence', payload);
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload evidence.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Upload Evidence</h2>
            <span className="modal-subtitle">{caseNumber}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. CCTV Footage — Entry Point Camera"
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the evidence in detail..."
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Evidence Type *</label>
              <select name="evidenceType" value={form.evidenceType} onChange={handleChange}>
                <option value="Document">Document</option>
                <option value="Photo">Photo</option>
                <option value="Video">Video</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Collected At *</label>
              <input
                type="datetime-local"
                name="collectedAt"
                value={form.collectedAt}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>File Reference *</label>
            <input
              name="fileReference"
              value={form.fileReference}
              onChange={handleChange}
              placeholder="e.g. evidence/case1/cctv_footage.mp4"
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Uploading...' : '🔗 Upload & Create Audit Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
