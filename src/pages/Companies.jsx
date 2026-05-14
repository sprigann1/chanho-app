import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const STATUS_OPTIONS = ['대기', '진행중', '완료', '취소'];
const STATUS_CLASS = { '대기': 'status-waiting', '진행중': 'status-progress', '완료': 'status-done', '취소': 'status-cancel' };

function formatAmount(n) {
  const num = Number(n) || 0;
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
  if (num >= 10000) return `${Math.floor(num / 10000).toLocaleString()}만`;
  return num.toLocaleString();
}

function formatDate(str) {
  if (!str) return '-';
  const d = new Date(str);
  return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function formatKorTodoDate(dueDate, dueTime) {
  if (!dueDate) return '';
  const [, m, d] = dueDate.split('-').map(Number);
  const datePart = `${m}월${d}일`;
  if (!dueTime) return datePart;
  const [h, min] = dueTime.split(':').map(Number);
  return `${datePart} ${min ? `${h}시${min}분` : `${h}시`}`;
}

// ─── Company Form Modal ───────────────────────────────────────────────────────
function CompanyModal({ company, onClose, onSave }) {
  const [form, setForm] = useState(company || { name: '', contact: '', phone: '', address: '', memo: '' });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

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
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="업체명 입력" />
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

// ─── Site Form Modal ──────────────────────────────────────────────────────────
function SiteModal({ site, companies, defaultCompany, onClose, onSave }) {
  const [form, setForm] = useState(site || {
    companyName: defaultCompany || (companies[0]?.name || ''),
    siteName: '', address: '',
    measureDate: '', constructDate: '', collectDate: '',
    contractAmount: '', collectedAmount: '',
    status: '대기', memo: '',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.companyName.trim()) return alert('업체를 선택하세요');
    if (!form.siteName.trim()) return alert('현장명을 입력하세요');
    onSave({
      ...form,
      contractAmount: Number(form.contractAmount) || 0,
      collectedAmount: Number(form.collectedAmount) || 0,
    });
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
              <label className="form-label">상태</label>
              <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">메모</label>
              <textarea className="form-input" value={form.memo} onChange={e => set('memo', e.target.value)} placeholder="메모" rows={2} style={{ resize: 'none' }} />
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

// ─── Todo Section ─────────────────────────────────────────────────────────────
function TodoSection({ siteId, siteName, todos, onAdd, onToggle, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ content: '', dueDate: '', dueTime: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const todayStr = new Date().toISOString().slice(0, 10);

  const siteTodos = todos
    .filter(t => t.siteId === siteId)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed === 'true' ? 1 : -1;
      const da = a.dueDate || '9999-99-99';
      const db = b.dueDate || '9999-99-99';
      return da.localeCompare(db);
    });

  const handleAdd = () => {
    if (!form.content.trim()) return;
    onAdd({ ...form, siteId, siteName });
    setForm({ content: '', dueDate: '', dueTime: '' });
    setShowForm(false);
  };

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
          할 일
          {siteTodos.length > 0 && (
            <span style={{ marginLeft: 6, fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>
              {siteTodos.filter(t => t.completed !== 'true').length}/{siteTodos.length}
            </span>
          )}
        </span>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            fontSize: 13, fontWeight: 600, color: showForm ? 'var(--text-3)' : 'var(--primary)',
            background: showForm ? 'var(--bg)' : 'var(--primary-light)',
            padding: '4px 10px', borderRadius: 8,
          }}
        >
          {showForm ? '취소' : '+ 추가'}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 12,
          marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <input
            className="form-input"
            value={form.content}
            onChange={e => set('content', e.target.value)}
            placeholder="할 일 내용"
            style={{ fontSize: 14 }}
            autoFocus
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              className="form-input"
              type="date"
              value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)}
              style={{ fontSize: 14 }}
            />
            <input
              className="form-input"
              type="time"
              value={form.dueTime}
              onChange={e => set('dueTime', e.target.value)}
              style={{ fontSize: 14 }}
            />
          </div>
          <button
            onClick={handleAdd}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: 14 }}
          >
            추가
          </button>
        </div>
      )}

      {siteTodos.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 14, padding: '12px 0' }}>
          등록된 할 일이 없습니다
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {siteTodos.map(todo => {
            const isOverdue = todo.dueDate && todo.dueDate < todayStr && todo.completed !== 'true';
            return (
              <div
                key={todo.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--bg)', borderRadius: 'var(--radius)',
                  padding: '10px 12px',
                  opacity: todo.completed === 'true' ? 0.55 : 1,
                }}
              >
                <button
                  onClick={() => onToggle(todo)}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${todo.completed === 'true' ? 'var(--green)' : 'var(--border)'}`,
                    background: todo.completed === 'true' ? 'var(--green)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 700,
                  }}
                >
                  {todo.completed === 'true' && '✓'}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500, color: 'var(--text-3)',
                    textDecoration: todo.completed === 'true' ? 'line-through' : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {todo.content}
                  </div>
                  {(todo.dueDate || todo.dueTime) && (
                    <div style={{ fontSize: 12, color: isOverdue ? 'var(--red)' : 'var(--text-4)', marginTop: 2, fontWeight: isOverdue ? 600 : 400 }}>
                      {isOverdue && '⚠ '}{formatKorTodoDate(todo.dueDate, todo.dueTime)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onDelete(todo.id)}
                  style={{ color: 'var(--text-4)', fontSize: 20, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Site Detail Modal ────────────────────────────────────────────────────────
function SiteDetailModal({ site, todos, onClose, onEdit, onDelete, onAddTodo, onToggleTodo, onDeleteTodo }) {
  const uncollected = (Number(site.contractAmount) || 0) - (Number(site.collectedAmount) || 0);
  const rate = site.contractAmount > 0
    ? Math.round((Number(site.collectedAmount) / Number(site.contractAmount)) * 100)
    : 0;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-header">
          <div>
            <div className="modal-title">{site.siteName}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{site.companyName}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`status-badge ${STATUS_CLASS[site.status]}`}>{site.status}</span>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>수금율 {rate}%</span>
          </div>

          <div className="info-list">
            {site.address && <InfoRow label="주소" value={site.address} />}
            <InfoRow label="실측일" value={formatDate(site.measureDate)} />
            <InfoRow label="시공일" value={formatDate(site.constructDate)} />
            <InfoRow label="수금 예정" value={formatDate(site.collectDate)} />
            <InfoRow label="계약금액" value={`${Number(site.contractAmount || 0).toLocaleString()}원`} />
            <InfoRow label="수금액" value={`${Number(site.collectedAmount || 0).toLocaleString()}원`} />
            <InfoRow
              label="미수금"
              value={`${uncollected.toLocaleString()}원`}
              valueStyle={{ color: uncollected > 0 ? 'var(--orange)' : 'var(--green)', fontWeight: 700 }}
            />
            {site.memo && <InfoRow label="메모" value={site.memo} />}
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${rate}%`,
                background: rate >= 100 ? 'var(--green)' : rate >= 50 ? 'var(--primary)' : 'var(--orange)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              <span>수금 진행률</span>
              <span>{rate}%</span>
            </div>
          </div>

          <TodoSection
            siteId={site.id}
            siteName={site.siteName}
            todos={todos}
            onAdd={onAddTodo}
            onToggle={onToggleTodo}
            onDelete={onDeleteTodo}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={onDelete}>삭제</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={onEdit}>수정</button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, valueStyle }) {
  return (
    <div className="info-row">
      <span className="info-key">{label}</span>
      <span className="info-val" style={valueStyle}>{value}</span>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
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

// ─── Main Companies Page ──────────────────────────────────────────────────────
export default function Companies() {
  const { companies, sites, todos, addCompany, updateCompany, deleteCompany, addSite, updateSite, deleteSite, addTodo, toggleTodo, deleteTodo } = useData();

  const toggleSiteComplete = (e, site) => {
    e.stopPropagation();
    updateSite({ ...site, status: site.status === '완료' ? '진행중' : '완료' });
  };
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [modal, setModal] = useState(null);

  const filteredCompanies = companies.filter(c =>
    c.name.includes(search) || c.contact?.includes(search)
  );

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const closeModal = () => setModal(null);

  const handleSaveCompany = (form) => {
    if (modal.company) updateCompany({ ...form, id: modal.company.id });
    else addCompany(form);
    closeModal();
  };

  const handleSaveSite = (form) => {
    if (modal.site) updateSite({ ...form, id: modal.site.id });
    else addSite(form);
    closeModal();
  };

  const handleDeleteSite = (id) => {
    deleteSite(id);
    closeModal();
  };

  const handleDeleteCompany = (id) => {
    deleteCompany(id);
    closeModal();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">업체 관리</div>
        <div style={{ marginTop: 12 }}>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="업체명, 담당자 검색"
            />
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filteredCompanies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <div className="empty-text">등록된 업체가 없습니다<br />아래 + 버튼으로 추가하세요</div>
          </div>
        ) : (
          filteredCompanies.map(company => {
            const companySites = sites
              .filter(s => s.companyName === company.name)
              .sort((a, b) => {
                const aD = a.status === '완료', bD = b.status === '완료';
                return aD !== bD ? (aD ? 1 : -1) : 0;
              });
            const isOpen = expandedIds.has(company.id);

            return (
              <div key={company.id} className="company-item">
                <div className="company-header" onClick={() => toggleExpand(company.id)}>
                  <div className="company-avatar">🏢</div>
                  <div className="company-info">
                    <div className="company-name">{company.name}</div>
                    <div className="company-meta">
                      {company.contact && `${company.contact} · `}{company.phone || '연락처 없음'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      background: 'var(--primary-light)', color: 'var(--primary)',
                      borderRadius: 20, padding: '2px 8px',
                    }}>
                      {companySites.length}건
                    </span>
                    <span className={`company-chevron ${isOpen ? 'open' : ''}`}>⌄</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="company-sites">
                    {/* Company actions */}
                    <div style={{ display: 'flex', gap: 8, padding: '4px 16px 8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: 12 }}
                        onClick={() => setModal({ type: 'editCompany', company })}
                      >
                        업체 수정
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ flex: 1, fontSize: 12 }}
                        onClick={() => setModal({ type: 'deleteCompany', company })}
                      >
                        업체 삭제
                      </button>
                    </div>

                    {companySites.length === 0 ? (
                      <div style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
                        등록된 현장이 없습니다
                      </div>
                    ) : (
                      companySites.map(site => {
                        const isDone = site.status === '완료';
                        return (
                          <div
                            key={site.id}
                            className="site-item"
                            style={{ opacity: isDone ? 0.6 : 1 }}
                            onClick={() => setModal({ type: 'siteDetail', site })}
                          >
                            <button
                              onClick={(e) => toggleSiteComplete(e, site)}
                              style={{
                                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                border: `2px solid ${isDone ? 'var(--green)' : 'var(--border)'}`,
                                background: isDone ? 'var(--green)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 12, fontWeight: 700,
                              }}
                            >
                              {isDone && '✓'}
                            </button>
                            <div className="site-info">
                              <div className="site-name" style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-3)' : undefined }}>
                                {site.siteName}
                              </div>
                              <div className="site-dates">
                                {site.measureDate && `실측 ${formatDate(site.measureDate)}`}
                                {site.measureDate && site.constructDate && ' · '}
                                {site.constructDate && `시공 ${formatDate(site.constructDate)}`}
                              </div>
                            </div>
                            <div className="site-amount">
                              {formatAmount(site.contractAmount)}원
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Add site button */}
                    <button
                      style={{
                        width: '100%', padding: '12px 16px',
                        fontSize: 13, fontWeight: 600,
                        color: 'var(--primary)', background: 'var(--primary-light)',
                        textAlign: 'center', marginTop: 4,
                      }}
                      onClick={() => setModal({ type: 'addSite', company })}
                    >
                      + 현장 추가
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setModal({ type: 'addCompany' })}>+</button>

      {/* Modals */}
      {modal?.type === 'addCompany' && (
        <CompanyModal onClose={closeModal} onSave={handleSaveCompany} />
      )}
      {modal?.type === 'editCompany' && (
        <CompanyModal company={modal.company} onClose={closeModal} onSave={handleSaveCompany} />
      )}
      {modal?.type === 'deleteCompany' && (
        <DeleteConfirmModal
          text={`'${modal.company.name}' 업체와 관련 현장이 모두 삭제됩니다`}
          onClose={closeModal}
          onConfirm={() => handleDeleteCompany(modal.company.id)}
        />
      )}
      {modal?.type === 'addSite' && (
        <SiteModal
          companies={companies}
          defaultCompany={modal.company?.name}
          onClose={closeModal}
          onSave={handleSaveSite}
        />
      )}
      {modal?.type === 'siteDetail' && (
        <SiteDetailModal
          site={modal.site}
          todos={todos}
          onClose={closeModal}
          onEdit={() => setModal({ type: 'editSite', site: modal.site })}
          onDelete={() => setModal({ type: 'deleteSite', site: modal.site })}
          onAddTodo={addTodo}
          onToggleTodo={toggleTodo}
          onDeleteTodo={deleteTodo}
        />
      )}
      {modal?.type === 'editSite' && (
        <SiteModal
          site={modal.site}
          companies={companies}
          onClose={closeModal}
          onSave={handleSaveSite}
        />
      )}
      {modal?.type === 'deleteSite' && (
        <DeleteConfirmModal
          text={`'${modal.site.siteName}' 현장이 삭제됩니다`}
          onClose={closeModal}
          onConfirm={() => handleDeleteSite(modal.site.id)}
        />
      )}
    </div>
  );
}
