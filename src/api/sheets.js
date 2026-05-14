const GAS_URL =
  'https://script.google.com/macros/s/AKfycbzDfQbePoGpQNG1r-EUo68o_3j5r7oS0d3RBeFzpJXULW5BCDhrZZrbfXFtWL7fn8Hu/exec';

// JSONP 호출 — script 태그를 동적으로 삽입해 CORS 없이 GAS에 접근
function jsonpFetch(params = {}) {
  return new Promise((resolve, reject) => {
    const cbName = `_cb${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    const url = new URL(GAS_URL);
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
    );
    url.searchParams.set('callback', cbName);

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('요청 시간 초과'));
    }, 10000);

    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[cbName] = (data) => {
      cleanup();
      if (data?.success === false) reject(new Error(data.error || '서버 오류'));
      else resolve(data?.data ?? data);
    };

    const script = document.createElement('script');
    script.onerror = () => { cleanup(); reject(new Error('네트워크 오류')); };
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

export const sheetsApi = {
  getSites:      ()     => jsonpFetch({ action: 'getSites' }),
  getCompanies:  ()     => jsonpFetch({ action: 'getCompanies' }),
  addSite:       (data) => jsonpFetch({ action: 'addSite',       ...data }),
  updateSite:    (data) => jsonpFetch({ action: 'updateSite',    ...data }),
  deleteSite:    (id)   => jsonpFetch({ action: 'deleteSite',    id }),
  addCompany:    (data) => jsonpFetch({ action: 'addCompany',    ...data }),
  updateCompany: (data) => jsonpFetch({ action: 'updateCompany', ...data }),
  deleteCompany: (id)   => jsonpFetch({ action: 'deleteCompany', id }),
  getTodos:      ()     => jsonpFetch({ action: 'getTodos' }),
  addTodo:       (data) => jsonpFetch({ action: 'addTodo',       ...data }),
  updateTodo:    (data) => jsonpFetch({ action: 'updateTodo',    ...data }),
  deleteTodo:    (id)   => jsonpFetch({ action: 'deleteTodo',    id }),
};
