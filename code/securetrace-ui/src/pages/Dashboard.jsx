import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatsBanner from '../components/StatsBanner';
import CreateCaseModal from '../components/CreateCaseModal';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const [cases,       setCases]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [showCreate,  setShowCreate]  = useState(false);

  const { user }  = useAuth();
  const navigate  = useNavigate();
  const isAdmin   = user?.role === 'Admin';

  useEffect(() => {
    api.get('/api/cases')
      .then(res => setCases(res.data))
      .catch(() => setError('Failed to load cases.'))
      .finally(() => setLoading(false));
  }, []);

  const handleCaseCreated = (newCase) => {
    setCases(prev => [newCase, ...prev]);
  };

  const statusBorder = (status) => {
    const map = { Open: '#2ecc71', Closed: '#e74c3c', Archived: '#adb5bd' };
    return map[status] || '#adb5bd';
  };

  return (
    <>
      <Navbar />
      <div className="page-container">

        {/* Header */}
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

        {/* Stats Banner */}
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

        {/* Cases Grid */}
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

              <button
                className="btn-primary"
                onClick={() => navigate(`/evidence/${c.id}`)}
              >
                View Evidence
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Case Modal */}
      {showCreate && (
        <CreateCaseModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCaseCreated}
        />
      )}
    </>
  );
}
