// Google Apps Script - 이 파일을 구글 시트의 앱스크립트에 붙여넣기 하세요
// 시트 이름 설정
const SITES_SHEET = '현장';
const COMPANIES_SHEET = '업체';
const TASKS_SHEET = '할일';

// 현장 컬럼: id, companyName, siteName, address, measureDate, constructDate, collectDate, contractAmount, collectedAmount, status, memo
// 업체 컬럼: id, name, contact, phone, address, memo

// doGet: 읽기 + 쓰기 모두 처리 (JSONP 지원)
function doGet(e) {
  const p = e.parameter;
  const action = p.action;
  const cb = p.callback; // JSONP 콜백 함수명
  let result;

  try {
    if (action === 'getSites')           result = { success: true, data: getSites() };
    else if (action === 'getCompanies')  result = { success: true, data: getCompanies() };
    else if (action === 'addSite')       result = { success: true, data: addSite(p) };
    else if (action === 'updateSite')    result = { success: true, data: updateSite(p) };
    else if (action === 'deleteSite')    result = { success: true, data: deleteSite(p.id) };
    else if (action === 'addCompany')    result = { success: true, data: addCompany(p) };
    else if (action === 'updateCompany') result = { success: true, data: updateCompany(p) };
    else if (action === 'deleteCompany') result = { success: true, data: deleteCompany(p.id) };
    else if (action === 'getTodos')      result = { success: true, data: getTodos() };
    else if (action === 'addTodo')       result = { success: true, data: addTodo(p) };
    else if (action === 'updateTodo')    result = { success: true, data: updateTodo(p) };
    else if (action === 'deleteTodo')    result = { success: true, data: deleteTodo(p.id) };
    else result = { success: false, error: 'Unknown action: ' + action };
  } catch (err) {
    result = { success: false, error: err.message };
  }

  const json = JSON.stringify(result);
  if (cb) {
    // JSONP 응답: callback({...})
    return ContentService.createTextOutput(cb + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Sites ────────────────────────────────────────────────────────────────────
function getSites() {
  const sheet = getOrCreateSheet(SITES_SHEET, ['id','companyName','siteName','address','measureDate','constructDate','collectDate','contractAmount','collectedAmount','status','memo']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] !== undefined ? String(row[i]) : '');
    return obj;
  });
}

function addSite(data) {
  const sheet = getOrCreateSheet(SITES_SHEET, ['id','companyName','siteName','address','measureDate','constructDate','collectDate','contractAmount','collectedAmount','status','memo']);
  const id = 's' + Date.now();
  sheet.appendRow([id, data.companyName||'', data.siteName||'', data.address||'', data.measureDate||'', data.constructDate||'', data.collectDate||'', data.contractAmount||0, data.collectedAmount||0, data.status||'대기', data.memo||'']);
  return { id };
}

function updateSite(data) {
  const sheet = getOrCreateSheet(SITES_SHEET, ['id','companyName','siteName','address','measureDate','constructDate','collectDate','contractAmount','collectedAmount','status','memo']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      sheet.getRange(i + 1, 1, 1, 11).setValues([[data.id, data.companyName||'', data.siteName||'', data.address||'', data.measureDate||'', data.constructDate||'', data.collectDate||'', data.contractAmount||0, data.collectedAmount||0, data.status||'대기', data.memo||'']]);
      return { id: data.id };
    }
  }
  throw new Error('Site not found: ' + data.id);
}

function deleteSite(id) {
  const sheet = getOrCreateSheet(SITES_SHEET, []);
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { id };
    }
  }
  throw new Error('Site not found: ' + id);
}

// ─── Companies ────────────────────────────────────────────────────────────────
function getCompanies() {
  const sheet = getOrCreateSheet(COMPANIES_SHEET, ['id','name','contact','phone','address','memo']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] !== undefined ? String(row[i]) : '');
    return obj;
  });
}

function addCompany(data) {
  const sheet = getOrCreateSheet(COMPANIES_SHEET, ['id','name','contact','phone','address','memo']);
  const id = 'c' + Date.now();
  sheet.appendRow([id, data.name||'', data.contact||'', data.phone||'', data.address||'', data.memo||'']);
  return { id };
}

function updateCompany(data) {
  const sheet = getOrCreateSheet(COMPANIES_SHEET, ['id','name','contact','phone','address','memo']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      sheet.getRange(i + 1, 1, 1, 6).setValues([[data.id, data.name||'', data.contact||'', data.phone||'', data.address||'', data.memo||'']]);
      return { id: data.id };
    }
  }
  throw new Error('Company not found: ' + data.id);
}

function deleteCompany(id) {
  const sheet = getOrCreateSheet(COMPANIES_SHEET, []);
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { id };
    }
  }
  throw new Error('Company not found: ' + id);
}

// ─── Todos ────────────────────────────────────────────────────────────────────
// 컬럼: id, siteId, siteName, content, dueDate, dueTime, completed, category
function getTodos() {
  const sheet = getOrCreateSheet(TASKS_SHEET, ['id','siteId','siteName','content','dueDate','dueTime','completed','category']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] !== undefined ? String(row[i]) : '');
    return obj;
  });
}

function addTodo(data) {
  const sheet = getOrCreateSheet(TASKS_SHEET, ['id','siteId','siteName','content','dueDate','dueTime','completed','category']);
  const id = data.id || ('t' + Date.now());
  sheet.appendRow([id, data.siteId||'', data.siteName||'', data.content||'', data.dueDate||'', data.dueTime||'', 'false', data.category||'공사전']);
  return { id };
}

function updateTodo(data) {
  const sheet = getOrCreateSheet(TASKS_SHEET, ['id','siteId','siteName','content','dueDate','dueTime','completed','category']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      sheet.getRange(i + 1, 1, 1, 8).setValues([[
        data.id, data.siteId||'', data.siteName||'', data.content||'',
        data.dueDate||'', data.dueTime||'', data.completed||'false', data.category||'공사전'
      ]]);
      return { id: data.id };
    }
  }
  throw new Error('Todo not found: ' + data.id);
}

function deleteTodo(id) {
  const sheet = getOrCreateSheet(TASKS_SHEET, []);
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { id };
    }
  }
  throw new Error('Todo not found: ' + id);
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers.length) sheet.appendRow(headers);
  }
  return sheet;
}
