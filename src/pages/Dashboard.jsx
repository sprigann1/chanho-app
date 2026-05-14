import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import SwipeableItem from '../components/SwipeableItem';
import { fmtDate, fmtDateTime } from '../utils/date';
import { isCompletedSite } from './Sites';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS   = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function formatAmount(n) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000)     return `${Math.floor(n / 10000)}만`;
  return n.toLocaleString();
}

// ─── Add Todo Modal ───────────────────────────────────────────────────────────
function AddTodoModal({ companies, sites, onClose, onSave }) {
  const [companyName, setCompanyName] = useState(companies[0]?.name || '');
  const [siteId, setSiteId] = useState('');
  const [form, setForm] = useState({ content: '', dueDate: '', dueTime: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const companySites = sites.filter(s => s.companyName === companyName);

  const handleSave = () => {
    if (!form.content.trim()) return alert('할 일 내용을 입력하세요');
    const site = sites.find(s => s.id === siteId) || companySites[0];
    if (!site) return alert('현장을 선택하세요');
    onSave({ ...form, siteId: site.id, siteName: site.siteName, companyName: site.companyName });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-header">
          <span className="modal-title">할 일 추가</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">업체</label>
            <select className="form-input" value={companyName} onChange={e => { setCompanyName(e.target.value); setSiteId(''); }}>
              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">현장</label>
            <select className="form-input" value={siteId} onChange={e => setSiteId(e.target.value)}>
              <option value="">현장 선택</option>
              {companySites.map(s => <option key={s.id} value={s.id}>{s.siteName}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">할 일 내용 *</label>
            <input className="form-input" value={form.content} onChange={e => set('content', e.target.value)} placeholder="할 일 입력" autoFocus />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">날짜</label>
              <input className="form-input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">시간</label>
              <input className="form-input" type="time" value={form.dueTime} onChange={e => set('dueTime', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { sites, companies, todos, loading, syncStatus, lastSync, loadData, toggleTodo, addTodo, deleteTodo, deleteSite } = useData();
  const navigate = useNavigate();
  const [showAddTodo, setShowAddTodo] = useState(false);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const d7 = new Date(today); d7.setDate(d7.getDate() + 7);
  const sevenDaysStr = d7.toISOString().slice(0, 10);

  const TYPE_LABEL = { measure: '실측', construct: '시공', collect: '수금' };
  const TYPE_CLASS  = { measure: 'measure', construct: 'construct', collect: 'collect' };

  // Today's events
  const allTodayEvents = [
    ...sites.filter(s => s.measureDate   === todayStr).map(s => ({ ...s, type: 'measure' })),
    ...sites.filter(s => s.constructDate === todayStr).map(s => ({ ...s, type: 'construct' })),
    ...sites.filter(s => s.collectDate   === todayStr).map(s => ({ ...s, type: 'collect' })),
  ];

  // Active (non-completed) sites
  const activeSites = sites
    .filter(s => !isCompletedSite(s) && s.status !== '취소')
    .sort((a, b) => (a.constructDate || '9999').localeCompare(b.constructDate || '9999'));

  // Incomplete todos grouped by company → site
  const incompleteTodos = (todos || []).filter(t => t.completed !== 'true');

  const todoGroups = (() => {
    const companyMap = {};
    const companyOrder = [];
    incompleteTodos.forEach(todo => {
      const site = sites.find(s => s.id === todo.siteId);
      const company = site?.companyName || todo.companyName || '기타';
      const siteName = todo.siteName || '기타';
      const siteKey = todo.siteId || siteName;
      if (!companyMap[company]) { companyMap[company] = { siteMap: {}, siteOrder: [] }; companyOrder.push(company); }
      if (!companyMap[company].siteMap[siteKey]) { companyMap[company].siteMap[siteKey] = { siteName, siteKey, todos: [] }; companyMap[company].siteOrder.push(siteKey); }
      companyMap[company].siteMap[siteKey].todos.push(todo);
    });
    return companyOrder.sort((a, b) => a.localeCompare(b, 'ko')).map(company => ({
      companyName: company,
      sites: companyMap[company].siteOrder.map(sk => {
        const sg = companyMap[company].siteMap[sk];
        return {
          siteName: sg.siteName, siteKey: sk,
          todos: [...sg.todos].sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')),
        };
      }),
    }));
  })();

  // 7-day schedule grouped by company
  const scheduleMap = {};
  const scheduleOrder = [];
  const ensureCompany = (name) => {
    if (!scheduleMap[name]) { scheduleMap[name] = { measure: 0, construct: 0, todo: 0 }; scheduleOrder.push(name); }
  };
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    sites.forEach(s => {
      if (s.measureDate === ds || s.constructDate === ds) {
        ensureCompany(s.companyName);
        if (s.measureDate === ds)   scheduleMap[s.companyName].measure++;
        if (s.constructDate === ds) scheduleMap[s.companyName].construct++;
      }
    });
  }
  (todos || []).filter(t => t.dueDate && t.dueDate > todayStr && t.dueDate <= sevenDaysStr && t.completed !== 'true').forEach(t => {
    const site = sites.find(s => s.id === t.siteId);
    const company = site?.companyName || t.siteName || '기타';
    ensureCompany(company);
    scheduleMap[company].todo++;
  });
  const scheduleGroups = scheduleOrder.map(name => ({ name, ...scheduleMap[name] }));

  // 6-stat summary — based on site status field
  const statItems = [
    { label: '실측예정', value: sites.filter(s => s.status === '실측예정').length, color: '#3182F6' },
    { label: '실측완료', value: sites.filter(s => s.status === '실측완료').length, color: '#00C073' },
    { label: '견적완료', value: sites.filter(s => s.status === '견적완료').length, color: '#8B5CF6' },
    { label: '시공예정', value: sites.filter(s => s.status === '시공예정').length, color: '#FF9500' },
    { label: '시공완료', value: sites.filter(s => s.status === '시공완료').length, color: '#00C073' },
    { label: '수금예정', value: sites.filter(s => s.status === '수금예정').length, color: '#FF3B30' },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="page-title">창호 영업관리</div>
            <div className="page-subtitle">
              {today.getFullYear()}년 {MONTHS[today.getMonth()]} {today.getDate()}일 ({WEEKDAYS[today.getDay()]})
            </div>
          </div>
          <button
            onClick={loadData}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: syncStatus === 'ok' ? 'var(--green-light)' : syncStatus === 'error' ? 'var(--red-light)' : 'var(--bg)',
              color: syncStatus === 'ok' ? 'var(--green)' : syncStatus === 'error' ? 'var(--red)' : 'var(--text-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}
          >
            {loading ? '⌛' : '↻'}
          </button>
        </div>
        <div className="sync-bar">
          <div className={`sync-dot ${syncStatus === 'error' ? 'error' : syncStatus === 'loading' ? 'loading' : ''}`} />
          <span>
            {syncStatus === 'ok' && lastSync
              ? `동기화 완료 · ${lastSync.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
              : syncStatus === 'error'   ? '오프라인 모드 (로컬 데이터 사용 중)'
              : syncStatus === 'loading' ? '동기화 중...'
              : '대기 중'}
          </span>
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <>
          {/* Today's events */}
          <div className="section">
            <div className="section-title">
              오늘 일정
              {allTodayEvents.length > 0 && (
                <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                  {allTodayEvents.length}건
                </span>
              )}
            </div>
            {allTodayEvents.length === 0 ? (
              <div className="card card-padding" style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
                오늘 예정된 일정이 없습니다
              </div>
            ) : (
              <div className="card">
                {allTodayEvents.map((ev, i) => (
                  <div key={`${ev.id}-${ev.type}-${i}`} className="event-item" style={{ padding: '14px 16px' }} onClick={() => navigate('/sites')}>
                    <div className={`event-dot ${TYPE_CLASS[ev.type]}`} />
                    <div className="event-info">
                      <div className="event-name">{ev.siteName}</div>
                      <div className="event-company">{ev.companyName}</div>
                    </div>
                    <span className={`event-badge ${TYPE_CLASS[ev.type]}`}>{TYPE_LABEL[ev.type]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active sites */}
          {activeSites.length > 0 && (
            <div className="section">
              <div className="section-title">
                진행 중 현장
                <button className="section-link" onClick={() => navigate('/sites')}>전체 보기</button>
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {activeSites.slice(0, 5).map((site, idx) => (
                  <SwipeableItem key={site.id} onDelete={() => deleteSite(site.id)}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: idx < Math.min(activeSites.length, 5) - 1 ? '1px solid var(--border)' : 'none', background: 'var(--surface)' }}
                      onClick={() => navigate('/sites')}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {site.companyName}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--primary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {site.siteName}
                        </div>
                        {(site.measureDate || site.constructDate) && (
                          <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>
                            {site.measureDate && `실측 ${fmtDate(site.measureDate)}`}
                            {site.measureDate && site.constructDate && ' · '}
                            {site.constructDate && `시공 ${fmtDate(site.constructDate)}`}
                          </div>
                        )}
                      </div>
                      <span className={`status-badge status-${site.status === '진행중' ? 'progress' : 'waiting'}`}>
                        {site.status}
                      </span>
                    </div>
                  </SwipeableItem>
                ))}
                {activeSites.length > 5 && (
                  <div style={{ padding: '10px 16px', textAlign: 'center', fontSize: 13, color: 'var(--primary)', fontWeight: 600 }} onClick={() => navigate('/sites')}>
                    +{activeSites.length - 5}건 더 보기
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Todos — incomplete only, checked ones disappear */}
          <div className="section">
            <div className="section-title">
              할 일
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {incompleteTodos.length > 0 && (
                  <span style={{ background: 'var(--purple-light)', color: 'var(--purple)', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                    {incompleteTodos.length}개
                  </span>
                )}
                <button
                  onClick={() => setShowAddTodo(true)}
                  style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: 8 }}
                >
                  + 추가
                </button>
              </div>
            </div>

            {todoGroups.length === 0 ? (
              <div className="card card-padding" style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
                미완료 할 일이 없습니다
              </div>
            ) : (
              <div className="card" style={{ overflow: 'hidden' }}>
                {todoGroups.map((group, gi) => (
                  <div key={group.companyName}>
                    <div style={{ padding: '10px 16px 6px', fontSize: 17, fontWeight: 800, color: '#000', borderTop: gi > 0 ? '2px solid var(--border)' : 'none' }}>
                      {group.companyName}
                    </div>
                    {group.sites.map(sg => (
                      <div key={sg.siteKey}>
                        <div style={{ padding: '4px 16px 4px 20px', fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                          {sg.siteName}
                        </div>
                        {sg.todos.map((todo, tidx) => {
                          const isOverdue = todo.dueDate && todo.dueDate < todayStr;
                          return (
                            <SwipeableItem key={todo.id} onDelete={() => deleteTodo(todo.id)}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 8px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                                <button
                                  onClick={() => toggleTodo(todo)}
                                  style={{
                                    width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                                    border: `2px solid var(--border)`,
                                    background: 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: 11, fontWeight: 700,
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {todo.content}
                                  </div>
                                  {todo.dueDate && (
                                    <div style={{ fontSize: 12, marginTop: 2, color: isOverdue ? 'var(--red)' : 'var(--text-4)', fontWeight: isOverdue ? 600 : 400 }}>
                                      {isOverdue && '⚠ '}{fmtDateTime(todo.dueDate, todo.dueTime)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </SwipeableItem>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7-day schedule */}
          {scheduleGroups.length > 0 && (
            <div className="section">
              <div className="section-title">
                7일 이내 일정
                <button className="section-link" onClick={() => navigate('/calendar')}>달력 보기</button>
              </div>
              <div className="card">
                {scheduleGroups.map((g, i) => {
                  const parts = [];
                  if (g.measure > 0)   parts.push(`실측 ${g.measure}건`);
                  if (g.construct > 0) parts.push(`시공 ${g.construct}건`);
                  if (g.todo > 0)      parts.push(`할일 ${g.todo}건`);
                  return (
                    <div key={g.name} style={{ padding: '12px 16px', borderBottom: i < scheduleGroups.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>{g.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{parts.join(' · ')}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6-stat overview */}
          <div className="section">
            <div className="section-title">전체 현황</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {statItems.map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '12px 10px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>
                    {value}
                    <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 2 }}>건</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showAddTodo && (
        <AddTodoModal companies={companies} sites={sites} onClose={() => setShowAddTodo(false)} onSave={addTodo} />
      )}
    </div>
  );
}
