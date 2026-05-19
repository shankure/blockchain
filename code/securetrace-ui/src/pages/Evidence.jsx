import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import './Evidence.css';

export default function Evidence() {
  const { caseId }          = useParams();
  const [evidences, setEvidences] = useState([]);
  const [caseInfo,  setCaseInfo]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const navigate                  = useNavigate();

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

  const typeIcon = (type) => {
    const icons = { Photo: '📷', Video: '🎥', Document: '📄', Other: '📦' };
    return icons[type] || '📦';
  };

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
          <span className="case-count">
            {evidences.length} item{evidences.length !== 1 ? 's' : ''}
          </span>
        </div>

        {error   && <div className="error-msg">{error}</div>}
        {loading && <div className="loading">Loading evidence...</div>}

        {!loading && evidences.length === 0 && (
          <div className="card empty-state">
            <p>No evidence uploaded for this case yet.</p>
          </div>
        )}

        <div className="evidence-list">
          {evidences.map(e => (
            <div key={e.id} className="evidence-card card">
              <div className="evidence-header">
                <div className="evidence-type">
                  <span className="type-icon">{typeIcon(e.evidenceType)}</span>
                  <span className="type-label">{e.evidenceType}</span>
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
    </>
  );
}
