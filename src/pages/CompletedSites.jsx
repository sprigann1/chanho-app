import React from 'react';
import { useData } from '../context/DataContext';

function formatDate(str) {
  if (!str) return '-';
  const d = new Date(str);
  return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function formatAmount(n) {
  const num = Number(n) || 0;
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
  if (num >= 10000) return `${Math.floor(num / 10000).toLocaleString()}만`;
  return num.toLocaleString();
}

export default function CompletedSites() {
  const { sites, companies, updateSite } = useData();

  const completedSites = sites.filter(s => s.status === '완료');

  const grouped = companies
    .map(c => ({
      ...c,
      sites: completedSites.filter(s => s.companyName === c.name),
    }))
    .filter(c => c.sites.length > 0);

  const handleUncheck = (site) => {
    updateSite({ ...site, status: '진행중' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">완료 현장</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
          총 {completedSites.length}건
        </div>
      </div>

      {completedSites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-text">완료된 현장이 없습니다</div>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {grouped.map((group, gi) => (
            <div key={group.id} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 17, fontWeight: 800, color: '#000',
                paddingBottom: 8,
                borderBottom: '2px solid var(--border)',
                marginBottom: 8,
              }}>
                {group.name}
              </div>
              {group.sites.map(site => (
                <div
                  key={site.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                    opacity: 0.7,
                  }}
                >
                  <button
                    onClick={() => handleUncheck(site)}
                    style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      border: '2px solid var(--green)',
                      background: 'var(--green)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    ✓
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--text-3)',
                      textDecoration: 'line-through',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {site.siteName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>
                      {site.measureDate && `실측 ${formatDate(site.measureDate)}`}
                      {site.measureDate && site.constructDate && ' · '}
                      {site.constructDate && `시공 ${formatDate(site.constructDate)}`}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', flexShrink: 0 }}>
                    {formatAmount(site.contractAmount)}원
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
