import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import SwipeableItem from '../components/SwipeableItem';
import { fmtDateTime } from '../utils/date';

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

// ─── Edit Todo Modal ──────────────────────────────────────────────────────────
function EditTodoModal({ todo, onClose, onSave }) {
  const [form, setForm] = useState({ content: todo.content || '', dueDate: todo.dueDate || '', dueTime: todo.dueTime || '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.content.trim()) return alert('할 일 내용을 입력하세요');
    onSave({ ...todo, ...form });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-header">
          <span className="modal-title">할 일 수정</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
            {todo.companyName}
            <span style={{ color: 'var(--text-3)', fontWeight: 400 }}> · {todo.siteName}</span>
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

// ─── Todo Row ─────────────────────────────────────────────────────────────────
function TodoRow({ todo, onToggle, onEdit, isDone }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = !isDone && todo.dueDate && todo.dueDate < todayStr;

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--surface)', opacity: isDone ? 0.55 : 1 }}
      onClick={onEdit}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(todo); }}
        style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          border: `2px solid ${isDone ? 'var(--green)' : isOverdue ? 'var(--red)' : 'var(--border)'}`,
          background: isDone ? 'var(--green)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 700,
        }}
      >
        {isDone && '✓'}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {todo.content}
        </div>
        <div style={{ fontSize: 12, marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{todo.companyName}</span>
          <span style={{ color: 'var(--text-4)' }}>·</span>
          <span style={{ color: 'var(--text-3)' }}>{todo.siteName}</span>
          {todo.dueDate && (
            <span style={{ color: isOverdue ? 'var(--red)' : 'var(--text-4)', fontWeight: isOverdue ? 600 : 400 }}>
              {isOverdue && '⚠ '}{fmtDateTime(todo.dueDate, todo.dueTime)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Todos Page ──────────────────────────────────────────────────────────
export default function Todos() {
  const { todos, companies, sites, addTodo, toggleTodo, editTodo, deleteTodo } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [showDone, setShowDone] = useState(false);

  const incompleteTodos = (todos || [])
    .filter(t => t.completed !== 'true')
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));

  const completedTodos = (todos || [])
    .filter(t => t.completed === 'true')
    .sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="page-title">할 일</div>
          <span style={{ fontSize: 13, color: incompleteTodos.length > 0 ? 'var(--purple)' : 'var(--green)', fontWeight: 600 }}>
            {incompleteTodos.length > 0 ? `${incompleteTodos.length}개 남음` : '모두 완료 🎉'}
          </span>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {incompleteTodos.length === 0 && completedTodos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-text">등록된 할 일이 없습니다<br />아래 + 버튼으로 추가하세요</div>
          </div>
        ) : (
          <>
            {/* Incomplete todos */}
            {incompleteTodos.length > 0 ? (
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginBottom: 12 }}>
                {incompleteTodos.map((todo, idx) => (
                  <SwipeableItem key={todo.id} onDelete={() => deleteTodo(todo.id)}>
                    <div style={{ borderBottom: idx < incompleteTodos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <TodoRow todo={todo} onToggle={toggleTodo} onEdit={() => setEditingTodo(todo)} isDone={false} />
                    </div>
                  </SwipeableItem>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0 12px', color: 'var(--text-3)', fontSize: 14 }}>
                미완료 할 일이 없습니다 🎉
              </div>
            )}

            {/* Completed section */}
            {completedTodos.length > 0 && (
              <div>
                <button
                  onClick={() => setShowDone(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    width: '100%', padding: '8px 2px',
                    fontSize: 13, fontWeight: 600, color: 'var(--text-3)',
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    transform: showDone ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s',
                    fontSize: 11,
                  }}>
                    ▼
                  </span>
                  완료됨 {completedTodos.length}개
                </button>
                {showDone && (
                  <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    {completedTodos.map((todo, idx) => (
                      <SwipeableItem key={todo.id} onDelete={() => deleteTodo(todo.id)}>
                        <div style={{ borderBottom: idx < completedTodos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <TodoRow todo={todo} onToggle={toggleTodo} onEdit={() => setEditingTodo(todo)} isDone />
                        </div>
                      </SwipeableItem>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>+</button>

      {showAdd && (
        <AddTodoModal companies={companies} sites={sites} onClose={() => setShowAdd(false)} onSave={addTodo} />
      )}
      {editingTodo && (
        <EditTodoModal todo={editingTodo} onClose={() => setEditingTodo(null)} onSave={editTodo} />
      )}
    </div>
  );
}
