import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const [cases,   setCases]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const { user }  = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    api.get('/api/cases')
      .then(res => setCases(res.data))
      .catch(() => setError('Failed to load cases.'))
      .finally(() => setLoading(false));
  }, []);

  const handleViewEvidence = (caseId) => {
    navigate(`/evidence/${caseId}`);
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>📁 Cases</h1>
          <span className="case-count">{cases.length} case{cases.length !== 1 ? 's' : ''}</span>
        </div>

        {error   && <div className="error-msg">{error}</div>}
        {loading && <div className="loading">Loading cases...</div>}

        {!loading && cases.length === 0 && (
          <div className="card empty-state">
            <p>No cases found.</p>
            {user?.role === 'Admin' && <p>Create your first case via the API.</p>}
          </div>
        )}

        <div className="cases-grid">
          {cases.map(c => (
            <div key={c.id} className="case-card card">
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
                onClick={() => handleViewEvidence(c.id)}
              >
                View Evidence
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
