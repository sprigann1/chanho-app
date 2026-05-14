import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { sheetsApi, MOCK_SITES, MOCK_COMPANIES } from '../api/sheets';

const DataContext = createContext(null);

const CACHE_KEY = 'chanho_v1';
function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; }
}
function writeCache(sites, companies, todos) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ sites, companies, todos })); } catch {}
}

export function DataProvider({ children }) {
  const [sites, setSites]       = useState([]);
  const [companies, setCompanies] = useState([]);
  const [todos, setTodos]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [toast, setToast]       = useState(null);

  const toastTimer = useRef(null);
  const syncing    = useRef(false);
  // Always-current snapshot — safe to read in callbacks without stale closure issues
  const snap = useRef({ sites: [], companies: [], todos: [] });

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // Central helpers that keep snap + state + cache in sync
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

  const runSync = useCallback(async (showSpinner = false) => {
    // Manual refresh (showSpinner) always runs; background skips if already syncing
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

      // GAS is source of truth: use its data even if empty (empty = sheets was cleared)
      // Only fall back to local when GAS request failed entirely (non-array response)
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

  // On mount: load cache instantly → background sync
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
  }, [runSync]);

  const loadData = useCallback(() => runSync(true), [runSync]);

  // ─── Sites CRUD ──────────────────────────────────────────────────────────────
  const addSite = useCallback(async (data) => {
    const newSite = { ...data, id: `s${Date.now()}` };
    _setSites(prev => [newSite, ...prev]);
    showToast('현장이 추가되었습니다');
    try { await sheetsApi.addSite(data); } catch {}
  }, [_setSites, showToast]);

  const updateSite = useCallback(async (data) => {
    _setSites(prev => prev.map(s => s.id === data.id ? data : s));
    showToast('현장 정보가 수정되었습니다');
    try { await sheetsApi.updateSite(data); } catch {}
  }, [_setSites, showToast]);

  const deleteSite = useCallback(async (id) => {
    _setSites(prev => prev.filter(s => s.id !== id));
    _setTodos(prev => prev.filter(t => t.siteId !== id));
    showToast('현장이 삭제되었습니다');
    try { await sheetsApi.deleteSite(id); } catch {}
  }, [_setSites, _setTodos, showToast]);

  // ─── Companies CRUD ───────────────────────────────────────────────────────────
  const addCompany = useCallback(async (data) => {
    const newCompany = { ...data, id: `c${Date.now()}` };
    _setCompanies(prev => [newCompany, ...prev]);
    showToast('업체가 추가되었습니다');
    try { await sheetsApi.addCompany(data); } catch {}
  }, [_setCompanies, showToast]);

  const updateCompany = useCallback(async (data) => {
    _setCompanies(prev => prev.map(c => c.id === data.id ? data : c));
    showToast('업체 정보가 수정되었습니다');
    try { await sheetsApi.updateCompany(data); } catch {}
  }, [_setCompanies, showToast]);

  const deleteCompany = useCallback(async (id) => {
    const co = snap.current.companies.find(c => c.id === id);
    _setCompanies(prev => prev.filter(c => c.id !== id));
    if (co) _setSites(prev => prev.filter(s => s.companyName !== co.name));
    showToast('업체가 삭제되었습니다');
    try { await sheetsApi.deleteCompany(id); } catch {}
  }, [_setCompanies, _setSites, showToast]);

  // ─── Todos CRUD ───────────────────────────────────────────────────────────────
  const addTodo = useCallback(async (data) => {
    const newTodo = { ...data, id: `t${Date.now()}`, completed: 'false' };
    _setTodos(prev => [...prev, newTodo]);
    showToast('할 일이 추가되었습니다');
    try { await sheetsApi.addTodo(newTodo); } catch {}
  }, [_setTodos, showToast]);

  const toggleTodo = useCallback(async (todo) => {
    const updated = { ...todo, completed: todo.completed === 'true' ? 'false' : 'true' };
    _setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
    try { await sheetsApi.updateTodo(updated); } catch {}
  }, [_setTodos]);

  const editTodo = useCallback(async (data) => {
    _setTodos(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
    showToast('할 일이 수정되었습니다');
    try { await sheetsApi.updateTodo(data); } catch {}
  }, [_setTodos, showToast]);

  const deleteTodo = useCallback(async (id) => {
    _setTodos(prev => prev.filter(t => t.id !== id));
    showToast('할 일이 삭제되었습니다');
    try { await sheetsApi.deleteTodo(id); } catch {}
  }, [_setTodos, showToast]);

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
