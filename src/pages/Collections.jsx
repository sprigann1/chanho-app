import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { fmtDate } from '../utils/date';
import { StatusBadge, isCompletedSite } from './Sites';

function formatAmount(n) {
  const num = Number(n) || 0;
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억원`;
  if (num >= 10000) return `${Math.floor(num / 10000).toLocaleString()}만원`;
  return `${num.toLocaleString()}원`;
}
function formatAmountShort(n) {
  const num = Number(n) || 0;
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
  if (num >= 10000) return `${Math.floor(num / 10000).toLocaleString()}만`;
  return num.toLocaleString();
}

// ─── Inline amount editor ─────────────────────────────────────────────────────
function InlineAmount({ value, color, label, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const startEdit = () => {
    setDraft(String(Number(value) || 0));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 30);
  };

  const save = () => {
    onSave(Number(draft) || 0);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          ref={inputRef}
          type="number"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
          style={{ width: 100, padding: '4px 8px', borderRadius: 6, border: '1.5px solid var(--primary)', fontSize: 13, fontWeight: 600 }}
        />
        <button onClick={save} style={{ fontSize: 12, color: '#fff', background: 'var(--primary)', padding: '4px 8px', borderRadius: 6, fontWeight: 600 }}>확인</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ color: 'var(--text-3)', fontSize: 11, marginBottom: 2 }}>{label}</div>
      <div
        onClick={startEdit}
        style={{ fontWeight: 600, color, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        {formatAmountShort(value)}원
        <span style={{ fontSize: 10, color: 'var(--text-4)' }}>✎</span>
      </div>
    </div>
  );
}

export default function Collections() {
  const { sites, companies, updateSite } = useData();
  const [view, setView] = useState('company');

  const today = new Date().toISOString().slice(0, 10);

  const totalContract  = sites.reduce((s, x) => s + (Number(x.contractAmount) || 0), 0);
  const totalCollected = sites.reduce((s, x) => s + (Number(x.collectedAmount) || 0), 0);
  const totalUncollected = totalContract - totalCollected;
  const collectionRate = totalContract > 0 ? Math.round((totalCollected / totalContract) * 100) : 0;

  const overdue = sites.filter(s =>
    s.collectDate && s.collectDate < today &&
    !isCompletedSite(s) &&
    (Number(s.collectedAmount) || 0) < (Number(s.contractAmount) || 0)
  );

  const companyStats = companies.map(c => {
    const cs = sites.filter(s => s.companyName === c.name);
    const contract  = cs.reduce((sum, s) => sum + (Number(s.contractAmount) || 0), 0);
    const collected = cs.reduce((sum, s) => sum + (Number(s.collectedAmount) || 0), 0);
    const uncollected = contract - collected;
    const rate = contract > 0 ? Math.round((collected / contract) * 100) : 0;
    return { ...c, siteCount: cs.length, contract, collected, uncollected, rate };
  }).filter(c => c.siteCount > 0).sort((a, b) => b.contract - a.contract);

  const sitesWithStats = sites
    .filter(s => s.status !== '취소')
    .map(s => ({
      ...s,
      uncollected: (Number(s.contractAmount) || 0) - (Number(s.collectedAmount) || 0),
      rate: s.contractAmount > 0 ? Math.round((Number(s.collectedAmount) / Number(s.contractAmount)) * 100) : 0,
      isOverdue: s.collectDate && s.collectDate < today && !isCompletedSite(s) &&
        (Number(s.collectedAmount) || 0) < (Number(s.contractAmount) || 0),
    }))
    .sort((a, b) => b.uncollected - a.uncollected);

  const handleUpdateAmount = (site, field, val) => {
    updateSite({ ...site, [field]: val });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">수금 현황</div>
      </div>

      {/* Summary cards */}
      <div className="collection-summary">
        <div className="collection-card" style={{ gridColumn: 'span 2', background: 'var(--primary)', color: '#fff' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>총 계약금액</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px' }}>{formatAmount(totalContract)}</div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
              <span>수금 진행률</span>
              <span style={{ fontWeight: 700, color: '#fff' }}>{collectionRate}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 3 }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${collectionRate}%`, background: '#fff', transition: 'width 0.6s ease' }} />
            </div>
          </div>
        </div>
        <div className="collection-card">
          <div className="collection-label">수금 완료</div>
          <div className="collection-value green">{formatAmount(totalCollected)}</div>
        </div>
        <div className="collection-card">
          <div className="collection-label">미수금</div>
          <div className="collection-value orange">{formatAmount(totalUncollected)}</div>
        </div>
        {overdue.length > 0 && (
          <div className="collection-card" style={{ gridColumn: 'span 2', background: 'var(--red-light)', border: '1px solid var(--red)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>미수금 연체 {overdue.length}건</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>수금 예정일이 지난 현장이 있습니다</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View toggle */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 4, gap: 4 }}>
          {['company', 'site'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)',
                fontSize: 14, fontWeight: 600,
                background: view === v ? 'var(--surface)' : 'transparent',
                color: view === v ? 'var(--text-1)' : 'var(--text-3)',
                boxShadow: view === v ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {v === 'company' ? '업체별' : '현장별'}
            </button>
          ))}
        </div>
      </div>

      {/* Company view */}
      {view === 'company' && (
        <div style={{ padding: '0 16px' }}>
          {companyStats.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-text">등록된 업체가 없습니다</div></div>
          ) : companyStats.map(c => (
            <div key={c.id} className="company-collection">
              <div className="company-collection-header">
                <div>
                  <div className="company-collection-name">{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>현장 {c.siteCount}건 · 계약 {formatAmountShort(c.contract)}원</div>
                </div>
                <div className="company-collection-rate">{c.rate}%</div>
              </div>
              <div className="company-collection-amounts">
                <div className="amount-item"><div className="amount-dot" style={{ background: 'var(--green)' }} /><span>수금 {formatAmountShort(c.collected)}원</span></div>
                <div className="amount-item"><div className="amount-dot" style={{ background: 'var(--orange)' }} /><span>미수 {formatAmountShort(c.uncollected)}원</span></div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${c.rate}%`, background: c.rate >= 100 ? 'var(--green)' : c.rate >= 50 ? 'var(--primary)' : 'var(--orange)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Site view */}
      {view === 'site' && (
        <div style={{ padding: '0 16px' }}>
          {sitesWithStats.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🏗</div><div className="empty-text">등록된 현장이 없습니다</div></div>
          ) : sitesWithStats.map(s => (
            <div key={s.id} style={{
              background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 16,
              marginBottom: 10, boxShadow: 'var(--shadow-sm)',
              border: s.isOverdue ? '1.5px solid var(--red)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    {s.isOverdue && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', background: 'var(--red-light)', color: 'var(--red)', borderRadius: 4 }}>연체</span>}
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>{s.siteName}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {s.companyName}
                    {s.collectDate && ` · 수금예정 ${fmtDate(s.collectDate)}`}
                  </div>
                </div>
                <StatusBadge status={s.status} style={{ marginLeft: 8 }} />
              </div>

              {/* Amount fields — tap수금 to edit inline */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 11, marginBottom: 2 }}>계약</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{formatAmountShort(s.contractAmount)}원</div>
                  </div>
                  <InlineAmount
                    value={s.collectedAmount}
                    color="var(--green)"
                    label="수금 ✎"
                    onSave={val => handleUpdateAmount(s, 'collectedAmount', val)}
                  />
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 11, marginBottom: 2 }}>미수</div>
                    <div style={{ fontWeight: 600, color: s.uncollected > 0 ? 'var(--orange)' : 'var(--green)' }}>{formatAmountShort(s.uncollected)}원</div>
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', alignSelf: 'flex-end' }}>{s.rate}%</div>
              </div>

              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${s.rate}%`, background: s.rate >= 100 ? 'var(--green)' : s.isOverdue ? 'var(--red)' : s.rate >= 50 ? 'var(--primary)' : 'var(--orange)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
