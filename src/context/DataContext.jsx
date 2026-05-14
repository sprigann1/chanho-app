import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { sheetsApi, MOCK_SITES, MOCK_COMPANIES } from '../api/sheets';

const DataContext = createContext(null);

const CACHE_KEY = 'chanho_v1';
const RETRY_KEY = 'chanho_retry_v1';

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; }
}
function writeCache(sites, companies, todos) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ sites, companies, todos })); } catch {}
}
function readRetryQueue() {
  try { return JSON.parse(localStorage.getItem(RETRY_KEY)) || []; } catch { return []; }
}
function writeRetryQueue(q) {
  try { localStorage.setItem(RETRY_KEY, JSON.stringify(q)); } catch {}
}

// For update ops on the same entity: keep only the latest (batching)
function mergeIntoQueue(queue, item) {
  if (!item.action.startsWith('update')) return [...queue, item];
  const filtered = queue.filter(q =>
    !(q.action === item.action && q.params?.id === item.params?.id)
  );
  return [...filtered, item];
}

export function DataProvider({ children }) {
  const [sites, setSites]           = useState([]);
  const [companies, setCompanies]   = useState([]);
  const [todos, setTodos]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync]     = useState(null);
  const [toast, setToast]           = useState(null);

  const toastTimer = useRef(null);
  const syncing    = useRef(false);
  const retryQueue = useRef(readRetryQueue());
  const snap       = useRef({ sites: [], companies: [], todos: [] });

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const _setSites = useCallback((v) => {
    const next = typeof v === 'function' ? v(snap.current.sites) : v;
    snap.current = { ...snap.current, sites: next };
    setSites(next);
    writeCache(snap.current.sites, snap.current.companies, snap.current.todos);
  }, []);

  const _setCompanies = useCallback((v) => {
    const next = typeof v === 'function' ? v(snap.current.companies) : v;
    snap.current = { ...snap.current, companies: next };
    setCompanies(next);
    writeCache(snap.current.sites, snap.current.companies, snap.current.todos);
  }, []);

  const _setTodos = useCallback((v) => {
    const next = typeof v === 'function' ? v(snap.current.todos) : v;
    snap.current = { ...snap.current, todos: next };
    setTodos(next);
    writeCache(snap.current.sites, snap.current.companies, snap.current.todos);
  }, []);

  // Fire-and-forget API call; enqueue for retry on failure
  const dispatch = useCallback((action, params) => {
    const item = { action, params };
    sheetsApi[action](params).catch(() => {
      retryQueue.current = mergeIntoQueue(retryQueue.current, item);
      writeRetryQueue(retryQueue.current);
    });
  }, []);

  // Silently retry all queued operations
  const flushRetryQueue = useCallback(async () => {
    if (retryQueue.current.length === 0) return;
    const queue = [...retryQueue.current];
    const failed = [];
    for (const item of queue) {
      try {
        await sheetsApi[item.action](item.params);
      } catch {
        failed.push(item);
      }
    }
    retryQueue.current = failed;
    writeRetryQueue(failed);
  }, []);

  const runSync = useCallback(async (showSpinner = false) => {
    if (!showSpinner && syncing.current) return;
    syncing.current = true;
    if (showSpinner) setLoading(true);
    setSyncStatus('loading');
    try {
      const [s, c, t] = await Promise.all([
        sheetsApi.getSites(),
        sheetsApi.getCompanies(),
        sheetsApi.getTodos(),
      ]);

      // GAS is source of truth: empty array means sheets was cleared
      // Fall back to local only when GAS request failed entirely (non-array)
      const nextSites     = Array.isArray(s) ? s : snap.current.sites;
      const nextCompanies = Array.isArray(c) ? c : snap.current.companies;
      const nextTodos     = Array.isArray(t) ? t : snap.current.todos;

      snap.current = { sites: nextSites, companies: nextCompanies, todos: nextTodos };
      setSites(nextSites);
      setCompanies(nextCompanies);
      setTodos(nextTodos);
      writeCache(nextSites, nextCompanies, nextTodos);
      setSyncStatus('ok');
      setLastSync(new Date());
    } catch {
      setSyncStatus('error');
    } finally {
      if (showSpinner) setLoading(false);
      syncing.current = false;
    }
  }, []);

  // On mount: load cache instantly → background sync + flush retry queue
  useEffect(() => {
    const cache = readCache();
    const hasCache = !!(cache?.sites?.length);
    if (hasCache) {
      snap.current = {
        sites:     cache.sites,
        companies: cache.companies || MOCK_COMPANIES,
        todos:     cache.todos     || [],
      };
      setSites(snap.current.sites);
      setCompanies(snap.current.companies);
      setTodos(snap.current.todos);
    } else {
      snap.current = { sites: MOCK_SITES, companies: MOCK_COMPANIES, todos: [] };
      setSites(MOCK_SITES);
      setCompanies(MOCK_COMPANIES);
    }
    runSync(!hasCache);
    flushRetryQueue();
  }, [runSync, flushRetryQueue]);

  // Retry failed operations every 30s
  useEffect(() => {
    const id = setInterval(flushRetryQueue, 30_000);
    return () => clearInterval(id);
  }, [flushRetryQueue]);

  const loadData = useCallback(() => runSync(true), [runSync]);

  // ─── Sites CRUD ──────────────────────────────────────────────────────────────
  const addSite = useCallback((data) => {
    const newSite = { ...data, id: `s${Date.now()}` };
    _setSites(prev => [newSite, ...prev]);
    showToast('현장이 추가되었습니다');
    dispatch('addSite', data);
  }, [_setSites, showToast, dispatch]);

  const updateSite = useCallback((data) => {
    _setSites(prev => prev.map(s => s.id === data.id ? data : s));
    showToast('현장 정보가 수정되었습니다');
    dispatch('updateSite', data);
  }, [_setSites, showToast, dispatch]);

  const deleteSite = useCallback((id) => {
    _setSites(prev => prev.filter(s => s.id !== id));
    _setTodos(prev => prev.filter(t => t.siteId !== id));
    showToast('현장이 삭제되었습니다');
    dispatch('deleteSite', id);
  }, [_setSites, _setTodos, showToast, dispatch]);

  // ─── Companies CRUD ───────────────────────────────────────────────────────────
  const addCompany = useCallback((data) => {
    const newCompany = { ...data, id: `c${Date.now()}` };
    _setCompanies(prev => [newCompany, ...prev]);
    showToast('업체가 추가되었습니다');
    dispatch('addCompany', data);
  }, [_setCompanies, showToast, dispatch]);

  const updateCompany = useCallback((data) => {
    _setCompanies(prev => prev.map(c => c.id === data.id ? data : c));
    showToast('업체 정보가 수정되었습니다');
    dispatch('updateCompany', data);
  }, [_setCompanies, showToast, dispatch]);

  const deleteCompany = useCallback((id) => {
    const co = snap.current.companies.find(c => c.id === id);
    _setCompanies(prev => prev.filter(c => c.id !== id));
    if (co) _setSites(prev => prev.filter(s => s.companyName !== co.name));
    showToast('업체가 삭제되었습니다');
    dispatch('deleteCompany', id);
  }, [_setCompanies, _setSites, showToast, dispatch]);

  // ─── Todos CRUD ───────────────────────────────────────────────────────────────
  const addTodo = useCallback((data) => {
    const newTodo = { ...data, id: `t${Date.now()}`, completed: 'false' };
    _setTodos(prev => [...prev, newTodo]);
    showToast('할 일이 추가되었습니다');
    dispatch('addTodo', newTodo);
  }, [_setTodos, showToast, dispatch]);

  const toggleTodo = useCallback((todo) => {
    const updated = { ...todo, completed: todo.completed === 'true' ? 'false' : 'true' };
    _setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
    dispatch('updateTodo', updated);
  }, [_setTodos, dispatch]);

  const editTodo = useCallback((data) => {
    _setTodos(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
    showToast('할 일이 수정되었습니다');
    dispatch('updateTodo', data);
  }, [_setTodos, showToast, dispatch]);

  const deleteTodo = useCallback((id) => {
    _setTodos(prev => prev.filter(t => t.id !== id));
    showToast('할 일이 삭제되었습니다');
    dispatch('deleteTodo', id);
  }, [_setTodos, showToast, dispatch]);

  return (
    <DataContext.Provider value={{
      sites, companies, todos, loading, syncStatus, lastSync, toast,
      loadData, showToast,
      addSite, updateSite, deleteSite,
      addCompany, updateCompany, deleteCompany,
      addTodo, toggleTodo, editTodo, deleteTodo,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
