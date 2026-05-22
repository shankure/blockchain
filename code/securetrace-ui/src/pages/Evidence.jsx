import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import CreateEvidenceModal from '../components/CreateEvidenceModal';
import { useAuth } from '../context/AuthContext';
import './Evidence.css';

export default function Evidence() {
  const { caseId }                    = useParams();
  const [evidences,   setEvidences]   = useState([]);
  const [caseInfo,    setCaseInfo]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [showUpload,  setShowUpload]  = useState(false);

  const { user }  = useAuth();
  const navigate  = useNavigate();
  const canUpload = user?.role === 'Admin' || user?.role === 'User';

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

  const typeIcon = (type) => {
    const icons = { Photo: '📷', Video: '🎥', Document: '📄', Other: '📦' };
    return icons[type] || '📦';
  };

  const typeColor = (type) => {
    const colors = { Photo: '#e74c3c', Video: '#9b59b6', Document: '#3498db', Other: '#f39c12' };
    return colors[type] || '#6c757d';
  };

  return (
    <>
      <Navbar />
      <div className="page-container">

        {/* Header */}
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

        {/* Closed case notice */}
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

        {/* Evidence list */}
        <div className="evidence-list">
          {evidences.map(e => (
            <div key={e.id} className="evidence-card card"
              style={{ borderLeftColor: typeColor(e.evidenceType) }}>

              <div className="evidence-header">
                <div className="evidence-type">
                  <span className="type-icon">{typeIcon(e.evidenceType)}</span>
                  <span className="type-label" style={{ color: typeColor(e.evidenceType) }}>
                    {e.evidenceType}
                  </span>
                </div>
                <span className="evidence-id">#{e.id}</span>
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

      {/* Upload Evidence Modal */}
      {showUpload && caseInfo && (
        <CreateEvidenceModal
          caseId={parseInt(caseId)}
          caseNumber={caseInfo.caseNumber}
          onClose={() => setShowUpload(false)}
          onCreated={handleEvidenceCreated}
        />
      )}
    </>
  );
}
