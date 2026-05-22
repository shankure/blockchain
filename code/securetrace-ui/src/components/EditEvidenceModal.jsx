import { useState } from 'react';
import api from '../api/axios';
import './Modal.css';

export default function EditEvidenceModal({ evidence, onClose, onUpdated }) {
  const [form, setForm] = useState({
    title:         evidence.title,
    description:   evidence.description,
    evidenceType:  evidence.evidenceType,
    fileReference: evidence.fileReference,
    collectedAt:   new Date(evidence.collectedAt).toISOString().slice(0, 16),
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
      };
      const res = await api.put(`/api/evidence/${evidence.id}`, payload);
      onUpdated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update evidence.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Edit Evidence</h2>
            <span className="modal-subtitle">#{evidence.id} — changes create a new audit block</span>
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
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
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
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : '🔗 Save & Create Audit Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
