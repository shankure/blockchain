import { useEffect, useState } from 'react';
import api from '../api/axios';
import './StatsBanner.css';

export default function StatsBanner() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [casesRes, evidenceRes, verifyRes] = await Promise.all([
          api.get('/api/cases'),
          api.get('/api/evidence'),
          api.get('/api/audit/verify'),
        ]);

        const cases    = casesRes.data;
        const evidence = evidenceRes.data;
        const verify   = verifyRes.data;

        setStats({
          totalCases:     cases.length,
          openCases:      cases.filter(c => c.status === 'Open').length,
          closedCases:    cases.filter(c => c.status === 'Closed').length,
          totalEvidence:  evidence.length,
          totalBlocks:    verify.totalBlocks,
          chainIntact:    verify.isValid,
        });
      } catch {
        // silently fail — stats are non-critical
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) return null;

  return (
    <div className="stats-banner">
      <div className="stat-card">
        <span className="stat-icon">📁</span>
        <div className="stat-info">
          <span className="stat-value">{stats.totalCases}</span>
          <span className="stat-label">Total Cases</span>
        </div>
        <div className="stat-sub">
          <span className="sub-open">{stats.openCases} open</span>
          <span className="sub-divider">·</span>
          <span className="sub-closed">{stats.closedCases} closed</span>
        </div>
      </div>

      <div className="stat-divider" />

      <div className="stat-card">
        <span className="stat-icon">🔍</span>
        <div className="stat-info">
          <span className="stat-value">{stats.totalEvidence}</span>
          <span className="stat-label">Evidence Items</span>
        </div>
        <div className="stat-sub">
          <span className="sub-neutral">across all cases</span>
        </div>
      </div>

      <div className="stat-divider" />

      <div className="stat-card">
        <span className="stat-icon">🔗</span>
        <div className="stat-info">
          <span className="stat-value">{stats.totalBlocks}</span>
          <span className="stat-label">Audit Blocks</span>
        </div>
        <div className="stat-sub">
          <span className="sub-neutral">in cryptographic chain</span>
        </div>
      </div>

      <div className="stat-divider" />

      <div className="stat-card">
        <span className="stat-icon">{stats.chainIntact ? '✅' : '🚨'}</span>
        <div className="stat-info">
          <span className={`stat-value chain-status ${stats.chainIntact ? 'valid' : 'invalid'}`}>
            {stats.chainIntact ? 'Intact' : 'Breach'}
          </span>
          <span className="stat-label">Chain Status</span>
        </div>
        <div className="stat-sub">
          <span className={stats.chainIntact ? 'sub-open' : 'sub-closed'}>
            {stats.chainIntact ? 'All blocks verified' : 'Tamper detected'}
          </span>
        </div>
      </div>
    </div>
  );
}
