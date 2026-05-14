const GAS_URL =
  'https://script.google.com/macros/s/AKfycbzDfQbePoGpQNG1r-EUo68o_3j5r7oS0d3RBeFzpJXULW5BCDhrZZrbfXFtWL7fn8Hu/exec';

export const MOCK_COMPANIES = [
  { id: 'c1', name: '삼성건설', contact: '김철수', phone: '010-1234-5678', address: '서울시 강남구', memo: '' },
  { id: 'c2', name: '현대인테리어', contact: '이영희', phone: '010-2345-6789', address: '서울시 서초구', memo: '' },
  { id: 'c3', name: '대우리모델링', contact: '박민준', phone: '010-3456-7890', address: '서울시 송파구', memo: '' },
  { id: 'c4', name: '한진건설', contact: '최지수', phone: '010-4567-8901', address: '경기도 성남시', memo: '' },
];

const today = new Date();
const fmt = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const MOCK_SITES = [
  {
    id: 's1', companyName: '삼성건설', siteName: '역삼동 오피스텔 A동',
    address: '서울시 강남구 역삼동 123', measureDate: fmt(addDays(today, -2)),
    constructDate: fmt(addDays(today, 5)), collectDate: fmt(addDays(today, 30)),
    contractAmount: 8500000, collectedAmount: 4000000, status: '진행중', memo: '3층~8층 전체',
  },
  {
    id: 's2', companyName: '삼성건설', siteName: '방배동 빌라 B호',
    address: '서울시 서초구 방배동 45', measureDate: fmt(addDays(today, 3)),
    constructDate: fmt(addDays(today, 14)), collectDate: fmt(addDays(today, 45)),
    contractAmount: 3200000, collectedAmount: 0, status: '대기', memo: '',
  },
  {
    id: 's3', companyName: '현대인테리어', siteName: '잠실 아파트 101동',
    address: '서울시 송파구 잠실동 200', measureDate: fmt(addDays(today, -10)),
    constructDate: fmt(today), collectDate: fmt(addDays(today, 20)),
    contractAmount: 12000000, collectedAmount: 6000000, status: '진행중', memo: '샷시 전체교체',
  },
  {
    id: 's4', companyName: '현대인테리어', siteName: '서초 빌딩 2층',
    address: '서울시 서초구 서초동 888', measureDate: fmt(addDays(today, -30)),
    constructDate: fmt(addDays(today, -15)), collectDate: fmt(addDays(today, -5)),
    contractAmount: 5500000, collectedAmount: 5500000, status: '완료', memo: '',
  },
  {
    id: 's5', companyName: '대우리모델링', siteName: '분당 신축 상가',
    address: '경기도 성남시 분당구 판교로 100', measureDate: fmt(addDays(today, 1)),
    constructDate: fmt(addDays(today, 10)), collectDate: fmt(addDays(today, 40)),
    contractAmount: 22000000, collectedAmount: 11000000, status: '진행중', memo: '신축 상가 1~3층',
  },
  {
    id: 's6', companyName: '한진건설', siteName: '수원 아파트 단지',
    address: '경기도 수원시 영통구', measureDate: fmt(addDays(today, 0)),
    constructDate: fmt(addDays(today, 7)), collectDate: fmt(addDays(today, 35)),
    contractAmount: 45000000, collectedAmount: 20000000, status: '진행중', memo: '전체 단지 200세대',
  },
];

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
