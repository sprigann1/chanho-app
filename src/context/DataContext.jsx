import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  collection, doc, onSnapshot, addDoc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

const DataContext = createContext(null);

const CACHE_KEY = 'chanho_v1';

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; }
}
function writeCache(sites, companies, todos) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ sites, companies, todos })); } catch {}
}

export function DataProvider({ children }) {
  const [sites, setSites]         = useState([]);
  const [companies, setCompanies] = useState([]);
  const [todos, setTodos]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [syncStatus, setSyncStatus] = useState('loading');
  const [lastSync, setLastSync]   = useState(null);
  const [toast, setToast]         = useState(null);

  const toastTimer = useRef(null);
  // Track how many collections have received their first snapshot
  const readyCount = useRef(0);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // Load from localStorage immediately so UI isn't blank while Firestore connects
  useEffect(() => {
    const cache = readCache();
    if (cache?.sites?.length || cache?.companies?.length) {
      setSites(cache.sites || []);
      setCompanies(cache.companies || []);
      setTodos(cache.todos || []);
      setLoading(false);
    }
  }, []);

  // Real-time Firestore listeners
  useEffect(() => {
    const onReady = () => {
      readyCount.current += 1;
      if (readyCount.current >= 3) {
        setLoading(false);
        setSyncStatus('ok');
        setLastSync(new Date());
      }
    };

    let latestSites     = [];
    let latestCompanies = [];
    let latestTodos     = [];

    const unsubCompanies = onSnapshot(
      query(collection(db, 'companies'), orderBy('name')),
      (snap) => {
        latestCompanies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCompanies(latestCompanies);
        writeCache(latestSites, latestCompanies, latestTodos);
        onReady();
      },
      () => setSyncStatus('error'),
    );

    const unsubSites = onSnapshot(
      query(collection(db, 'sites'), orderBy('createdAt', 'desc')),
      (snap) => {
        latestSites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSites(latestSites);
        writeCache(latestSites, latestCompanies, latestTodos);
        onReady();
      },
      () => setSyncStatus('error'),
    );

    const unsubTodos = onSnapshot(
      query(collection(db, 'todos'), orderBy('createdAt', 'desc')),
      (snap) => {
        latestTodos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTodos(latestTodos);
        writeCache(latestSites, latestCompanies, latestTodos);
        onReady();
      },
      () => setSyncStatus('error'),
    );

    return () => {
      unsubCompanies();
      unsubSites();
      unsubTodos();
    };
  }, []);

  // loadData: re-trigger sync status indicator (listeners are always live)
  const loadData = useCallback(() => {
    setSyncStatus('loading');
    setTimeout(() => {
      setSyncStatus('ok');
      setLastSync(new Date());
    }, 500);
  }, []);

  // ─── Companies CRUD ────────────────────────────────────────────────────────
  const addCompany = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'companies'), { ...data, createdAt: Date.now() });
      showToast('업체가 추가되었습니다');
    } catch { showToast('오류가 발생했습니다'); }
  }, [showToast]);

  const updateCompany = useCallback(async (data) => {
    const { id, ...rest } = data;
    try {
      await setDoc(doc(db, 'companies', id), rest, { merge: true });
      showToast('업체 정보가 수정되었습니다');
    } catch { showToast('오류가 발생했습니다'); }
  }, [showToast]);

  const deleteCompany = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'companies', id));
      showToast('업체가 삭제되었습니다');
    } catch { showToast('오류가 발생했습니다'); }
  }, [showToast]);

  // ─── Sites CRUD ────────────────────────────────────────────────────────────
  const addSite = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'sites'), { ...data, createdAt: Date.now() });
      showToast('현장이 추가되었습니다');
    } catch { showToast('오류가 발생했습니다'); }
  }, [showToast]);

  const updateSite = useCallback(async (data) => {
    const { id, ...rest } = data;
    try {
      await setDoc(doc(db, 'sites', id), rest, { merge: true });
      showToast('현장 정보가 수정되었습니다');
    } catch { showToast('오류가 발생했습니다'); }
  }, [showToast]);

  const deleteSite = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'sites', id));
      showToast('현장이 삭제되었습니다');
    } catch { showToast('오류가 발생했습니다'); }
  }, [showToast]);

  // ─── Todos CRUD ────────────────────────────────────────────────────────────
  const addTodo = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'todos'), { ...data, completed: 'false', createdAt: Date.now() });
      showToast('할 일이 추가되었습니다');
    } catch { showToast('오류가 발생했습니다'); }
  }, [showToast]);

  const toggleTodo = useCallback(async (todo) => {
    const { id, ...rest } = todo;
    const updated = { ...rest, completed: todo.completed === 'true' ? 'false' : 'true' };
    try {
      await setDoc(doc(db, 'todos', id), updated, { merge: true });
    } catch {}
  }, []);

  const editTodo = useCallback(async (data) => {
    const { id, ...rest } = data;
    try {
      await setDoc(doc(db, 'todos', id), rest, { merge: true });
      showToast('할 일이 수정되었습니다');
    } catch { showToast('오류가 발생했습니다'); }
  }, [showToast]);

  const deleteTodo = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'todos', id));
      showToast('할 일이 삭제되었습니다');
    } catch { showToast('오류가 발생했습니다'); }
  }, [showToast]);

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
