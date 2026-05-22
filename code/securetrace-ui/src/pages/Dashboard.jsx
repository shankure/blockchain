import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatsBanner from '../components/StatsBanner';
import CreateCaseModal from '../components/CreateCaseModal';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const [cases,      setCases]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin  = user?.role === 'Admin';

  useEffect(() => {
    api.get('/api/cases')
      .then(res => setCases(res.data))
      .catch(() => setError('Failed to load cases.'))
      .finally(() => setLoading(false));
  }, []);

  const handleCaseCreated = (newCase) => {
    setCases(prev => [newCase, ...prev]);
  };

  const handleDeleteCase = async (id, title) => {
    if (!window.confirm(`Delete case "${title}"?\n\nThis will also delete all evidence linked to this case. This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/cases/${id}`);
      setCases(prev => prev.filter(c => c.id !== id));
    } catch {
      alert('Failed to delete case. Make sure you are logged in as Admin.');
    } finally {
      setDeletingId(null);
    }
  };

  const statusBorder = (status) => {
    const map = { Open: '#2ecc71', Closed: '#e74c3c', Archived: '#adb5bd' };
    return map[status] || '#adb5bd';
  };

  return (
    <>
      <Navbar />
      <div className="page-container">

        <div className="page-header">
          <h1>📁 Cases</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="case-count">
              {cases.length} case{cases.length !== 1 ? 's' : ''}
            </span>
            {isAdmin && (
              <button className="btn-primary" onClick={() => setShowCreate(true)}>
                + New Case
              </button>
            )}
          </div>
        </div>

        <StatsBanner />

        {error   && <div className="error-msg">{error}</div>}
        {loading && <div className="loading">Loading cases...</div>}

        {!loading && cases.length === 0 && (
          <div className="card empty-state">
            <p>No cases found.</p>
            {isAdmin && (
              <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setShowCreate(true)}>
                Create your first case
              </button>
            )}
          </div>
        )}

        <div className="cases-grid">
          {cases.map(c => (
            <div
              key={c.id}
              className="case-card card"
              style={{ borderLeftColor: statusBorder(c.status) }}
            >
              <div className="case-card-header">
                <span className="case-number">{c.caseNumber}</span>
                <span className={`badge badge-${c.status.toLowerCase()}`}>
                  {c.status}
                </span>
              </div>

              <h3 className="case-title">{c.title}</h3>
              <p className="case-description">{c.description}</p>

              <div className="case-meta">
                <span>👤 {c.createdByFullName}</span>
                <span>📅 {new Date(c.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="case-actions">
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/evidence/${c.id}`)}
                >
                  View Evidence
                </button>
                {isAdmin && (
                  <button
                    className="btn-danger"
                    onClick={() => handleDeleteCase(c.id, c.title)}
                    disabled={deletingId === c.id}
                  >
                    {deletingId === c.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateCaseModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCaseCreated}
        />
      )}
    </>
  );
}
