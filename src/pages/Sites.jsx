import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import SwipeableItem from '../components/SwipeableItem';
import { fmtDate, fmtDateTime } from '../utils/date';

// ─── Status config ────────────────────────────────────────────────────────────
export const STATUS_OPTIONS = ['실측예정', '실측완료', '견적완료', '시공예정', '시공완료', '수금예정', '수금완료'];

const STATUS_STYLE = {
  '실측예정': { bg: '#EBF3FF', color: '#3182F6' },
  '실측완료': { bg: '#E6FAF2', color: '#00C073' },
  '견적완료': { bg: '#F3EFFE', color: '#8B5CF6' },
  '시공예정': { bg: '#FFF4E6', color: '#FF9500' },
  '시공완료': { bg: '#E6FAF2', color: '#00C073' },
  '수금예정': { bg: '#FFF0EF', color: '#FF3B30' },
  '수금완료': { bg: '#E6FAF2', color: '#00C073' },
  // legacy
  '대기':   { bg: '#F2F4F6', color: '#8B95A1' },
  '진행중': { bg: '#EBF3FF', color: '#3182F6' },
  '완료':   { bg: '#E6FAF2', color: '#00C073' },
  '취소':   { bg: '#FFF0EF', color: '#FF3B30' },
};

export function StatusBadge({ status, style }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE['대기'];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: s.bg, color: s.color, whiteSpace: 'nowrap', flexShrink: 0, ...style }}>
      {status}
    </span>
  );
}

export function isCompletedSite(site) {
  return site.status === '수금완료' || site.status === '완료';
}

function formatAmount(n) {
  const num = Number(n) || 0;
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
  if (num >= 10000) return `${Math.floor(num / 10000).toLocaleString()}만`;
  return num.toLocaleString();
}

// ─── File upload helper ───────────────────────────────────────────────────────
function FileUploadField({ label, value, onChange, onClear }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <label style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: '10px', background: 'var(--bg)', borderRadius: 8,
        cursor: 'pointer', color: 'var(--text-3)', fontSize: 13, fontWeight: 600,
        border: '1.5px dashed var(--border)',
      }}>
        {value ? '📷 사진 변경' : '📷 사진 첨부'}
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onChange} />
      </label>
      {value && (
        <div style={{ position: 'relative', marginTop: 8 }}>
          <img src={value} alt={label} style={{ width: '100%', borderRadius: 8, maxHeight: 180, objectFit: 'cover' }} />
          <button
            type="button"
            onClick={onClear}
            style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Site Modal (edit / add) ─────────────────────────────────────────────────
function SiteModal({ site, companies, defaultCompany, onClose, onSave }) {
  const defaultStatus = STATUS_OPTIONS[0];
  const [form, setForm] = useState(site || {
    companyName: defaultCompany || (companies[0]?.name || ''),
    siteName: '', address: '',
    measureDate: '', constructDate: '', collectDate: '',
    contractAmount: '', collectedAmount: '',
    status: defaultStatus, memo: '',
    measureImageUrl: '', quoteImageUrl: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set(field, ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.companyName) return alert('업체를 선택하세요');
    if (!form.siteName.trim()) return alert('현장명을 입력하세요');
    onSave({ ...form, contractAmount: Number(form.contractAmount) || 0, collectedAmount: Number(form.collectedAmount) || 0 });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-header">
          <span className="modal-title">{site ? '현장 수정' : '현장 추가'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">업체 *</label>
              <select className="form-input" value={form.companyName} onChange={e => set('companyName', e.target.value)}>
                {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">현장명 *</label>
              <input className="form-input" value={form.siteName} onChange={e => set('siteName', e.target.value)} placeholder="현장명 입력" />
            </div>
            <div className="form-group">
              <label className="form-label">상태</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('status', s)}
                    style={{
                      padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                      background: form.status === s ? (STATUS_STYLE[s]?.bg || 'var(--primary-light)') : 'var(--bg)',
                      color: form.status === s ? (STATUS_STYLE[s]?.color || 'var(--primary)') : 'var(--text-3)',
                      border: `2px solid ${form.status === s ? (STATUS_STYLE[s]?.color || 'var(--primary)') : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">주소</label>
              <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="현장 주소" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">실측일</label>
                <input className="form-input" type="date" value={form.measureDate} onChange={e => set('measureDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">시공일</label>
                <input className="form-input" type="date" value={form.constructDate} onChange={e => set('constructDate', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">수금 예정일</label>
              <input className="form-input" type="date" value={form.collectDate} onChange={e => set('collectDate', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">계약금액 (원)</label>
                <input className="form-input" type="number" value={form.contractAmount} onChange={e => set('contractAmount', e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">수금액 (원)</label>
                <input className="form-input" type="number" value={form.collectedAmount} onChange={e => set('collectedAmount', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">메모</label>
              <textarea className="form-input" value={form.memo} onChange={e => set('memo', e.target.value)} placeholder="메모" rows={2} style={{ resize: 'none' }} />
            </div>

            {/* File uploads */}
            <FileUploadField
              label="실측지"
              value={form.measureImageUrl}
              onChange={e => handleFile(e, 'measureImageUrl')}
              onClear={() => set('measureImageUrl', '')}
            />
            <FileUploadField
              label="견적서"
              value={form.quoteImageUrl}
              onChange={e => handleFile(e, 'quoteImageUrl')}
              onClear={() => set('quoteImageUrl', '')}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>저장</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Company Modal ────────────────────────────────────────────────────────────
function CompanyModal({ company, onClose, onSave }) {
  const [form, setForm] = useState(company || { name: '', contact: '', phone: '', address: '', memo: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('업체명을 입력하세요');
    onSave(form);
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-header">
          <span className="modal-title">{company ? '업체 수정' : '업체 추가'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">업체명 *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="업체명 입력" autoFocus />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">담당자</label>
                <input className="form-input" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="이름" />
              </div>
              <div className="form-group">
                <label className="form-label">연락처</label>
                <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="010-0000-0000" type="tel" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">주소</label>
              <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="주소 입력" />
            </div>
            <div className="form-group">
              <label className="form-label">메모</label>
              <textarea className="form-input" value={form.memo} onChange={e => set('memo', e.target.value)} placeholder="메모" rows={3} style={{ resize: 'none' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>저장</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ text, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="delete-confirm">
          <div className="delete-confirm-icon">🗑</div>
          <div className="delete-confirm-text">정말 삭제하시겠어요?</div>
          <div className="delete-confirm-sub" style={{ margin: '6px 0 20px' }}>{text}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>취소</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>삭제</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Site Row ─────────────────────────────────────────────────────────────────
function SiteRow({ site, onTap, showBorder }) {
  const done = isCompletedSite(site);
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: showBorder ? '1px solid var(--border)' : 'none', background: 'var(--surface)', opacity: done ? 0.6 : 1, cursor: 'pointer' }}
      onClick={onTap}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: done ? 'var(--text-3)' : 'var(--text-1)', textDecoration: done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {site.siteName}
          </span>
          <StatusBadge status={site.status} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 3 }}>
          {site.measureDate && `실측 ${fmtDate(site.measureDate)}`}
          {site.measureDate && site.constructDate && ' · '}
          {site.constructDate && `시공 ${fmtDate(site.constructDate)}`}
          {!site.measureDate && !site.constructDate && site.collectDate && `수금예정 ${fmtDate(site.collectDate)}`}
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: done ? 'var(--text-4)' : 'var(--text-2)', flexShrink: 0 }}>
        {formatAmount(site.contractAmount)}원
      </div>
    </div>
  );
}

// ─── Main Sites Page ──────────────────────────────────────────────────────────
export default function Sites() {
  const { companies, sites, todos, addCompany, updateCompany, deleteCompany, addSite, updateSite, deleteSite, addTodo, toggleTodo, deleteTodo } = useData();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [expandedDone, setExpandedDone] = useState({});

  const closeModal = () => setModal(null);

  const handleSaveCompany = (form) => {
    if (modal?.company) updateCompany({ ...form, id: modal.company.id });
    else addCompany(form);
    closeModal();
  };

  const handleSaveSite = (form) => {
    if (modal?.site) updateSite({ ...form, id: modal.site.id });
    else addSite(form);
    closeModal();
  };

  const visibleCompanies = companies.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || sites.some(s => s.companyName === c.name && s.siteName.toLowerCase().includes(q));
  });

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="page-title">현장 관리</div>
          <button
            onClick={() => setModal({ type: 'addCompany' })}
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '6px 12px', borderRadius: 8 }}
          >
            + 업체
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="업체명, 현장명 검색" />
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {visibleCompanies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏗</div>
            <div className="empty-text">등록된 업체가 없습니다<br />위 버튼으로 업체를 추가하세요</div>
          </div>
        ) : (
          visibleCompanies.map(company => {
            const q = search.toLowerCase();
            const allSites = sites.filter(s => s.companyName === company.name);
            const filtered = search
              ? allSites.filter(s => s.siteName.toLowerCase().includes(q) || company.name.toLowerCase().includes(q))
              : allSites;

            const activeSites = filtered.filter(s => !isCompletedSite(s));
            const doneSites   = filtered.filter(s => isCompletedSite(s));
            const showDone    = expandedDone[company.id];

            return (
              <div key={company.id} style={{ marginBottom: 24 }}>
                {/* Company header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 17, fontWeight: 800, color: '#000' }}>{company.name}</span>
                    {company.contact && <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>{company.contact} · {company.phone}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setModal({ type: 'editCompany', company })} style={{ fontSize: 12, color: 'var(--text-3)', padding: '4px 8px', background: 'var(--bg)', borderRadius: 6 }}>수정</button>
                    <button onClick={() => setModal({ type: 'deleteCompany', company })} style={{ fontSize: 12, color: 'var(--red)', padding: '4px 8px', background: 'var(--red-light)', borderRadius: 6 }}>삭제</button>
                  </div>
                </div>

                {/* Active sites */}
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  {activeSites.length === 0 && doneSites.length === 0 ? (
                    <div style={{ padding: '14px 16px', color: 'var(--text-4)', fontSize: 13, textAlign: 'center' }}>현장이 없습니다</div>
                  ) : (
                    activeSites.map((site, idx) => (
                      <SwipeableItem key={site.id} onDelete={() => setModal({ type: 'deleteSite', site })}>
                        <SiteRow
                          site={site}
                          onTap={() => setModal({ type: 'editSite', site })}
                          showBorder={idx < activeSites.length - 1 || doneSites.length > 0}
                        />
                      </SwipeableItem>
                    ))
                  )}

                  {/* Completed collapse section */}
                  {doneSites.length > 0 && (
                    <>
                      <button
                        onClick={() => setExpandedDone(prev => ({ ...prev, [company.id]: !showDone }))}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-3)', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
                      >
                        <span style={{ display: 'inline-block', transform: showDone ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', fontSize: 11 }}>▼</span>
                        완료됨 {doneSites.length}개
                      </button>
                      {showDone && doneSites.map((site, idx) => (
                        <SwipeableItem key={site.id} onDelete={() => setModal({ type: 'deleteSite', site })}>
                          <SiteRow
                            site={site}
                            onTap={() => setModal({ type: 'editSite', site })}
                            showBorder={idx < doneSites.length - 1}
                          />
                        </SwipeableItem>
                      ))}
                    </>
                  )}

                  {/* Add site */}
                  <button
                    onClick={() => setModal({ type: 'addSite', company })}
                    style={{ width: '100%', padding: '11px 16px', fontSize: 13, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', textAlign: 'center', borderTop: '1px solid var(--border)' }}
                  >
                    + 현장 추가
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button className="fab" onClick={() => setModal({ type: 'addSite' })}>+</button>

      {/* Modals */}
      {modal?.type === 'addCompany' && <CompanyModal onClose={closeModal} onSave={handleSaveCompany} />}
      {modal?.type === 'editCompany' && <CompanyModal company={modal.company} onClose={closeModal} onSave={handleSaveCompany} />}
      {modal?.type === 'deleteCompany' && (
        <DeleteConfirmModal text={`'${modal.company.name}' 업체와 관련 현장이 모두 삭제됩니다`} onClose={closeModal} onConfirm={() => { deleteCompany(modal.company.id); closeModal(); }} />
      )}
      {modal?.type === 'addSite' && (
        <SiteModal companies={companies} defaultCompany={modal.company?.name} onClose={closeModal} onSave={handleSaveSite} />
      )}
      {modal?.type === 'editSite' && (
        <SiteModal site={modal.site} companies={companies} onClose={closeModal} onSave={handleSaveSite} />
      )}
      {modal?.type === 'deleteSite' && (
        <DeleteConfirmModal text={`'${modal.site.siteName}' 현장이 삭제됩니다`} onClose={closeModal} onConfirm={() => { deleteSite(modal.site.id); closeModal(); }} />
      )}
    </div>
  );
}
