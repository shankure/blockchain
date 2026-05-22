import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import CreateEvidenceModal from '../components/CreateEvidenceModal';
import EditEvidenceModal from '../components/EditEvidenceModal';
import { useAuth } from '../context/AuthContext';
import './Evidence.css';

export default function Evidence() {
  const { caseId }                      = useParams();
  const [evidences,    setEvidences]    = useState([]);
  const [caseInfo,     setCaseInfo]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [showUpload,   setShowUpload]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);  // evidence item being edited
  const [deletingId,   setDeletingId]   = useState(null);

  const { user }  = useAuth();
  const navigate  = useNavigate();
  const isAdmin   = user?.role === 'Admin';
  const canUpload = user?.role === 'Admin' || user?.role === 'User';
  const canEdit   = user?.role === 'Admin' || user?.role === 'User';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [caseRes, evidenceRes] = await Promise.all([
          api.get(`/api/cases/${caseId}`),
          api.get(`/api/evidence/case/${caseId}`)
        ]);
        setCaseInfo(caseRes.data);
        setEvidences(evidenceRes.data);
      } catch {
        setError('Failed to load evidence.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [caseId]);

  const handleEvidenceCreated = (newEvidence) => {
    setEvidences(prev => [newEvidence, ...prev]);
  };

  const handleEvidenceUpdated = (updatedEvidence) => {
    setEvidences(prev =>
      prev.map(e => e.id === updatedEvidence.id ? updatedEvidence : e)
    );
  };

  const handleDeleteEvidence = async (id, title) => {
    if (!window.confirm(`Delete evidence "${title}"?\n\nThis cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/evidence/${id}`);
      setEvidences(prev => prev.filter(e => e.id !== id));
    } catch {
      alert('Failed to delete evidence.');
    } finally {
      setDeletingId(null);
    }
  };

  const typeIcon  = (type) => ({ Photo: '📷', Video: '🎥', Document: '📄', Other: '📦' }[type] || '📦');
  const typeColor = (type) => ({ Photo: '#e74c3c', Video: '#9b59b6', Document: '#3498db', Other: '#f39c12' }[type] || '#6c757d');

  return (
    <>
      <Navbar />
      <div className="page-container">

        <div className="page-header">
          <div>
            <button className="btn-secondary back-btn" onClick={() => navigate('/dashboard')}>
              ← Back to Cases
            </button>
            <h1>
              🔍 Evidence
              {caseInfo && <span className="case-ref"> — {caseInfo.caseNumber}</span>}
            </h1>
            {caseInfo && <p className="case-subtitle">{caseInfo.title}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="case-count">
              {evidences.length} item{evidences.length !== 1 ? 's' : ''}
            </span>
            {canUpload && caseInfo?.status === 'Open' && (
              <button className="btn-primary" onClick={() => setShowUpload(true)}>
                + Upload Evidence
              </button>
            )}
          </div>
        </div>

        {caseInfo?.status === 'Closed' && (
          <div className="closed-notice">
            🔒 This case is closed. No new evidence can be uploaded.
          </div>
        )}
        {caseInfo?.status === 'Archived' && (
          <div className="archived-notice">
            📦 This case is archived and read-only.
          </div>
        )}

        {error   && <div className="error-msg">{error}</div>}
        {loading && <div className="loading">Loading evidence...</div>}

        {!loading && evidences.length === 0 && (
          <div className="card empty-state">
            <p>No evidence uploaded for this case yet.</p>
            {canUpload && caseInfo?.status === 'Open' && (
              <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setShowUpload(true)}>
                Upload first evidence
              </button>
            )}
          </div>
        )}

        <div className="evidence-list">
          {evidences.map(e => (
            <div
              key={e.id}
              className="evidence-card card"
              style={{ borderLeftColor: typeColor(e.evidenceType) }}
            >
              <div className="evidence-header">
                <div className="evidence-type">
                  <span className="type-icon">{typeIcon(e.evidenceType)}</span>
                  <span className="type-label" style={{ color: typeColor(e.evidenceType) }}>
                    {e.evidenceType}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="evidence-id">#{e.id}</span>

                  {/* Edit button — Admin and User */}
                  {canEdit && (
                    <button
                      className="btn-icon"
                      title="Edit evidence"
                      onClick={() => setEditTarget(e)}
                    >
                      ✏️
                    </button>
                  )}

                  {/* Delete button — Admin only */}
                  {isAdmin && (
                    <button
                      className="btn-icon btn-icon-danger"
                      title="Delete evidence"
                      onClick={() => handleDeleteEvidence(e.id, e.title)}
                      disabled={deletingId === e.id}
                    >
                      {deletingId === e.id ? '⏳' : '🗑️'}
                    </button>
                  )}
                </div>
              </div>

              <h3 className="evidence-title">{e.title}</h3>
              <p className="evidence-description">{e.description}</p>

              <div className="evidence-meta">
                <span>📎 {e.fileReference}</span>
                <span>👤 {e.uploadedByFullName}</span>
                <span>🗓 Collected: {new Date(e.collectedAt).toLocaleDateString()}</span>
                <span>⏱ Added: {new Date(e.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showUpload && caseInfo && (
        <CreateEvidenceModal
          caseId={parseInt(caseId)}
          caseNumber={caseInfo.caseNumber}
          onClose={() => setShowUpload(false)}
          onCreated={handleEvidenceCreated}
        />
      )}

      {editTarget && (
        <EditEvidenceModal
          evidence={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={handleEvidenceUpdated}
        />
      )}
    </>
  );
}
