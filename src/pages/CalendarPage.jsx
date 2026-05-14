import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import ThemeToggle from '../components/ThemeToggle';
import { fmtDateTime } from '../utils/date';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TYPE_KEYS = [
  { key: 'all',       label: '전체' },
  { key: 'measure',   label: '실측',  dateField: 'measureDate' },
  { key: 'construct', label: '시공',  dateField: 'constructDate' },
  { key: 'collect',   label: '수금',  dateField: 'collectDate' },
  { key: 'todo',      label: '할일' },
];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m)    { return new Date(y, m, 1).getDay(); }
function toDateStr(y, m, d)   { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }

function getDotsForDate(sites, todos, dateStr, typeFilter) {
  const dots = new Set();
  if (typeFilter !== 'todo') {
    sites.forEach(s => {
      if (s.measureDate   === dateStr) dots.add('measure');
      if (s.constructDate === dateStr) dots.add('construct');
      if (s.collectDate   === dateStr) dots.add('collect');
    });
  }
  if (typeFilter === 'all' || typeFilter === 'todo') {
    if (todos.some(t => t.dueDate === dateStr && t.completed !== 'true')) dots.add('todo');
  }
  return [...dots];
}

function getSiteEventsForDate(sites, dateStr, typeFilter) {
  const events = [];
  if (typeFilter === 'todo') return events;
  if (typeFilter === 'all' || typeFilter === 'measure')
    sites.filter(s => s.measureDate   === dateStr).forEach(s => events.push({ ...s, type: 'measure' }));
  if (typeFilter === 'all' || typeFilter === 'construct')
    sites.filter(s => s.constructDate === dateStr).forEach(s => events.push({ ...s, type: 'construct' }));
  if (typeFilter === 'all' || typeFilter === 'collect')
    sites.filter(s => s.collectDate   === dateStr).forEach(s => events.push({ ...s, type: 'collect' }));
  return events;
}

function getTodosForDate(todos, dateStr, typeFilter) {
  if (typeFilter !== 'all' && typeFilter !== 'todo') return [];
  return todos.filter(t => t.dueDate === dateStr);
}

const TYPE_LABEL = { measure: '실측', construct: '시공', collect: '수금' };

export default function CalendarPage() {
  const { sites, todos } = useData();
  const now = new Date();
  const [year, setYear]         = useState(now.getFullYear());
  const [month, setMonth]       = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.toISOString().slice(0, 10));
  const [typeFilter, setTypeFilter]     = useState('all');

  const todayStr    = now.toISOString().slice(0, 10);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const selectedSiteEvents = getSiteEventsForDate(sites, selectedDate, typeFilter);
  const selectedTodos      = getTodosForDate(todos, selectedDate, typeFilter);
  const totalSelected      = selectedSiteEvents.length + selectedTodos.length;

  // Build calendar cells
  const cells = [];
  const prevMonthDays = getDaysInMonth(year, month === 0 ? 11 : month - 1);
  for (let i = 0; i < firstDay; i++)
    cells.push({ day: prevMonthDays - firstDay + 1 + i, thisMonth: false, dateStr: null });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, thisMonth: true, dateStr: toDateStr(year, month, d) });
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++)
    cells.push({ day: i, thisMonth: false, dateStr: null });

  const selectedLabel = (() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length < 3) return '';
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dow = new Date(Number(parts[0]), m - 1, d).getDay();
    return `${m}월 ${d}일 (${WEEKDAYS[dow]})`;
  })();

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="page-title">일정 달력</div>
          <ThemeToggle />
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="tabs">
        {TYPE_KEYS.map(({ key, label }) => (
          <button
            key={key}
            className={`tab-chip ${typeFilter === key ? 'active ' + (key !== 'all' ? key : '') : ''}`}
            onClick={() => setTypeFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="month-nav">
        <button className="month-btn" onClick={prevMonth}>‹</button>
        <div className="month-label">{year}년 {month + 1}월</div>
        <button className="month-btn" onClick={nextMonth}>›</button>
      </div>

      {/* Calendar grid */}
      <div style={{ padding: '0 12px' }}>
        <div className="calendar-grid">
          {WEEKDAYS.map((wd, i) => (
            <div key={wd} className="calendar-weekday"
              style={{ color: i === 0 ? 'var(--red)' : i === 6 ? 'var(--primary)' : undefined }}>
              {wd}
            </div>
          ))}

          {cells.map((cell, i) => {
            if (!cell.thisMonth) return <div key={`pad-${i}`} style={{ aspectRatio: 1 }} />;

            const dots       = getDotsForDate(sites, todos, cell.dateStr, typeFilter);
            const isToday    = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;
            const dayOfWeek  = i % 7;

            return (
              <div
                key={cell.dateStr}
                className={`calendar-day ${isToday ? 'today' : ''} ${isSelected && !isToday ? 'selected' : ''}`}
                onClick={() => setSelectedDate(cell.dateStr)}
              >
                <div className={`day-num ${dayOfWeek === 0 ? 'sunday' : dayOfWeek === 6 ? 'saturday' : ''}`}>
                  {cell.day}
                </div>
                <div className="day-dots">
                  {dots.slice(0, 3).map((dot, di) => (
                    <div key={di} className={`day-dot ${dot}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected date panel */}
      {selectedDate && (
        <div className="selected-day-panel">
          <div className="panel-header">
            {selectedLabel} · {totalSelected > 0 ? `${totalSelected}건` : '일정 없음'}
          </div>

          {totalSelected === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              이 날 일정이 없습니다
            </div>
          ) : (
            <>
              {selectedSiteEvents.map((ev, i) => (
                <SiteEventRow key={`${ev.id}-${ev.type}-${i}`} event={ev} />
              ))}
              {selectedTodos.map(todo => (
                <TodoRow key={todo.id} todo={todo} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Monthly summary */}
      <div style={{ padding: '16px 16px 0' }}>
        <div className="section-title">이번 달 현황</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          {[
            { type: 'measure',   label: '실측', color: 'var(--green)',   count: sites.filter(s => s.measureDate?.startsWith(monthPrefix)).length },
            { type: 'construct', label: '시공', color: 'var(--primary)', count: sites.filter(s => s.constructDate?.startsWith(monthPrefix)).length },
            { type: 'collect',   label: '수금', color: 'var(--orange)',  count: sites.filter(s => s.collectDate?.startsWith(monthPrefix)).length },
            { type: 'todo',      label: '할일', color: 'var(--purple)',  count: todos.filter(t => t.dueDate?.startsWith(monthPrefix) && t.completed !== 'true').length },
          ].map(({ type, label, color, count }) => (
            <div key={type} style={{
              background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '12px 8px',
              boxShadow: 'var(--shadow-sm)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>
                {count}<span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 2 }}>건</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SiteEventRow({ event }) {
  const cfg = {
    measure:   { bg: 'var(--green-light)',   color: 'var(--green)',   label: '실측' },
    construct: { bg: 'var(--primary-light)', color: 'var(--primary)', label: '시공' },
    collect:   { bg: 'var(--orange-light)',  color: 'var(--orange)',  label: '수금' },
  };
  const { bg, color, label } = cfg[event.type];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: bg, color, fontSize: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {label}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.siteName}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 2 }}>{event.companyName}</div>
      </div>
      {event.type === 'collect' && (
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--orange)', flexShrink: 0 }}>
          {Math.floor(((Number(event.contractAmount) || 0) - (Number(event.collectedAmount) || 0)) / 10000).toLocaleString()}만원
        </div>
      )}
    </div>
  );
}

function TodoRow({ todo }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue  = todo.dueDate && todo.dueDate < todayStr && todo.completed !== 'true';
  const isDone     = todo.completed === 'true';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderBottom: '1px solid var(--border)',
      opacity: isDone ? 0.55 : 1,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--purple-light)', color: 'var(--purple)',
        fontSize: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {isDone ? '✓' : '할일'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 16, fontWeight: 600, color: 'var(--text-1)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textDecoration: isDone ? 'line-through' : 'none',
        }}>
          {todo.content}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 2 }}>
          {todo.siteName}
          {todo.dueTime && ` · ${fmtDateTime(todo.dueDate, todo.dueTime).split(' ').slice(1).join(' ')}`}
        </div>
      </div>
      {isOverdue && (
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
          background: 'var(--red-light)', color: 'var(--red)', flexShrink: 0,
        }}>
          기한초과
        </span>
      )}
      {!isOverdue && (
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 6, flexShrink: 0,
          background: 'var(--purple-light)', color: 'var(--purple)',
        }}>
          할일
        </span>
      )}
    </div>
  );
}
