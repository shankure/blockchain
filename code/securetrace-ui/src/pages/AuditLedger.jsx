import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import './AuditLedger.css';

export default function AuditLedger() {
  const [blocks,       setBlocks]       = useState([]);
  const [verification, setVerification] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [blocksRes, verifyRes] = await Promise.all([
          api.get('/api/audit/blocks'),
          api.get('/api/audit/verify')
        ]);
        setBlocks(blocksRes.data);
        setVerification(verifyRes.data);
      } catch {
        setError('Failed to load audit ledger.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReVerify = async () => {
    setLoading(true);
    try {
      const [blocksRes, verifyRes] = await Promise.all([
        api.get('/api/audit/blocks'),
        api.get('/api/audit/verify')
      ]);
      setBlocks(blocksRes.data);
      setVerification(verifyRes.data);
    } catch {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Find per-block validity from verification details
  const getBlockValidity = (blockIndex) => {
    if (!verification) return null;
    const detail = verification.details.find(d => d.blockIndex === blockIndex);
    return detail ? detail.isValid : null;
  };

  const getBlockFailureReason = (blockIndex) => {
    if (!verification) return null;
    const detail = verification.details.find(d => d.blockIndex === blockIndex);
    return detail?.failureReason || null;
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>🔗 Audit Ledger</h1>
          <button className="btn-primary" onClick={handleReVerify} disabled={loading}>
            🔄 Re-Verify Chain
          </button>
        </div>

        {error   && <div className="error-msg">{error}</div>}
        {loading && <div className="loading">Verifying chain integrity...</div>}

        {/* ── Verification Banner ─────────────────────────────────────────── */}
        {verification && !loading && (
          <div className={`verification-banner ${verification.isValid ? 'valid' : 'invalid'}`}>
            <span className="banner-icon">{verification.isValid ? '✅' : '🚨'}</span>
            <div>
              <strong>{verification.isValid ? 'Chain Intact' : 'Tamper Detected'}</strong>
              <p>{verification.message}</p>
            </div>
            <span className="block-count">{verification.totalBlocks} blocks</span>
          </div>
        )}

        {/* ── Block Chain Visualization ───────────────────────────────────── */}
        {!loading && blocks.length === 0 && (
          <div className="card empty-state">
            <p>No audit blocks yet. Create evidence to start the chain.</p>
          </div>
        )}

        <div className="chain-container">
          {blocks.map((block, index) => {
            const isValid = getBlockValidity(block.blockIndex);
            const reason  = getBlockFailureReason(block.blockIndex);

            return (
              <div key={block.blockIndex} className="chain-item">
                {/* Connector line between blocks */}
                {index > 0 && (
                  <div className={`chain-connector ${isValid === false ? 'broken' : ''}`}>
                    <span className="connector-line" />
                    <span className="connector-label">links to</span>
                    <span className="connector-line" />
                  </div>
                )}

                <div className={`block-card card ${isValid === false ? 'block-invalid' : 'block-valid'}`}>
                  {/* Block header */}
                  <div className="block-header">
                    <div className="block-index">Block #{block.blockIndex}</div>
                    <div className={`block-status ${isValid === false ? 'status-invalid' : 'status-valid'}`}>
                      {isValid === false ? '🔴 TAMPERED' : '🟢 VALID'}
                    </div>
                  </div>

                  {/* Tamper warning */}
                  {reason && (
                    <div className="tamper-warning">
                      ⚠️ {reason}
                    </div>
                  )}

                  {/* Block details */}
                  <div className="block-body">
                    <div className="block-row">
                      <span className="block-label">Action</span>
                      <span className={`action-badge action-${block.actionType.toLowerCase()}`}>
                        {block.actionType}
                      </span>
                    </div>

                    <div className="block-row">
                      <span className="block-label">Evidence ID</span>
                      <span className="block-value">#{block.evidenceId}</span>
                    </div>

                    <div className="block-row">
                      <span className="block-label">Actor</span>
                      <span className="block-value">{block.actorEmail}</span>
                    </div>

                    <div className="block-row">
                      <span className="block-label">Timestamp</span>
                      <span className="block-value">
                        {new Date(block.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="hash-section">
                      <div className="hash-row">
                        <span className="block-label">Prev Hash</span>
                        <code className="hash-value prev-hash">{block.previousHash}</code>
                      </div>
                      <div className="hash-row">
                        <span className="block-label">Curr Hash</span>
                        <code className="hash-value curr-hash">{block.currentHash}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
