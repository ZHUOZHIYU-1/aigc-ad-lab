/* ============================================================
   实验数据存档模块：本地 IndexedDB 持久化 + GitHub 云端同步
   - 任何访问者都能把"做完的东西"保存到自己浏览器（无需配置）
   - 管理员填入自己的 GitHub 令牌后，可把记录同步进网站仓库，
     实现"数据真正存在网站里"，所有访问者打开即可看到公共记录
   ============================================================ */

const DB_NAME = 'aigc_lab_archive';
const DB_VER = 1;
const STORE = 'records';
const CLOUD_PATH = 'records/archive.json';
const REPO_OWNER = 'ZHUOZHIYU-1';
const REPO_NAME = 'aigc-ad-lab';

/* 云端内嵌附件的大小保护：超过上限的文件只同步元数据，内容仅存本地 */
const CLOUD_MAX_FILE = 3 * 1024 * 1024;      // 单文件 3MB
const CLOUD_MAX_TOTAL = 14 * 1024 * 1024;    // 内嵌总量 14MB

const TYPE_LABEL = {
  poster: '🎨 海报作品', studio: '💡 布光方案', model3d: '🧊 3D模型',
  report: '📄 实验报告', video: '🎬 视频演示', other: '📦 其他',
};

let db = null;
let cloudRecords = [];   // 从云端读取的公共记录（不写入本地库）

/* ---------------- IndexedDB 基础 ---------------- */
function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}
function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
async function getAllRecords() {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const req = d.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function saveRecord(rec) {
  const d = await openDB();
  const tx = d.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(rec);
  await txDone(tx);
}
async function deleteRecord(id) {
  const d = await openDB();
  const tx = d.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
}
async function clearRecords() {
  const d = await openDB();
  const tx = d.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).clear();
  await txDone(tx);
}

/* ---------------- base64 / 编码工具 ---------------- */
function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
function b64ToBuf(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
function utf8ToB64(str) { return bufToB64(new TextEncoder().encode(str).buffer); }
function b64ToUtf8(b64) { return new TextDecoder().decode(b64ToBuf(b64)); }
function fileToBuf(file) { return new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsArrayBuffer(file);
}); }

/* ---------------- 界面渲染 ---------------- */
function fmtSize(n) {
  if (n == null) return '—';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}
function fmtTime(ts) {
  try { return new Date(ts).toLocaleString('zh-CN', { hour12: false }); } catch { return String(ts); }
}
function safe(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function ext(name) { const m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toUpperCase() : '文件'; }
function isImage(f) { return /^image\//i.test(f.type || '') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(f.name || ''); }

function filterRecords(all) {
  const q = (document.getElementById('arSearch')?.value || '').trim().toLowerCase();
  const t = document.getElementById('arFilter')?.value || 'all';
  return all.filter(r => {
    if (t !== 'all' && r.type !== t) return false;
    if (!q) return true;
    return [r.title, r.author, r.note, TYPE_LABEL[r.type]].some(v => String(v || '').toLowerCase().includes(q));
  });
}

async function renderList() {
  const box = document.getElementById('arList');
  if (!box) return;
  let local = [];
  try { local = await getAllRecords(); } catch { /* ignore */ }

  // 去重：云端里如果本地已存在同 id，本地优先
  const localIds = new Set(local.map(r => r.id));
  const merged = [...local, ...cloudRecords.filter(r => !localIds.has(r.id))]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const list = filterRecords(merged);

  // 统计
  const totalFiles = merged.reduce((s, r) => s + (r.files?.length || 0), 0);
  const totalSize = merged.reduce((s, r) => s + (r.files || []).reduce((x, f) => x + (f.size || 0), 0), 0);
  const stat = document.getElementById('arStats');
  if (stat) stat.innerHTML =
    `<span>共 <b>${merged.length}</b> 条记录</span><span>附件 <b>${totalFiles}</b> 个</span><span>本地数据量 <b>${fmtSize(totalSize)}</b></span><span>云端公共记录 <b>${cloudRecords.length}</b> 条</span>`;

  if (!list.length) {
    box.innerHTML = `<div class="ar-empty">还没有记录。在左侧填写信息、上传附件，点「保存记录」即可留存；或点「加载云端记录」查看已共享的内容。</div>`;
    return;
  }

  box.innerHTML = list.map(r => {
    const files = r.files || [];
    const imgs = files.filter(isImage).slice(0, 3);
    const thumbs = imgs.map(f => f.data
      ? `<img src="data:${f.type || 'image/png'};base64,${f.data}" alt="${safe(f.name)}">`
      : (f.url ? `<img src="${f.url}" alt="${safe(f.name)}">` : '')).join('');
    const fileRows = files.map((f, i) => `
      <button class="ar-file" data-rec="${safe(r.id)}" data-i="${i}" type="button" title="点击下载">
        <span>📎 ${safe(f.name)}</span><em>${fmtSize(f.size)}</em>
      </button>`).join('');
    const fromCloud = r._cloud ? '<span class="ar-badge-cloud">云端</span>' : '<span class="ar-badge-local">本地</span>';
    return `
      <article class="ar-card" data-id="${safe(r.id)}">
        <div class="ar-card-top">
          <span class="ar-type">${TYPE_LABEL[r.type] || TYPE_LABEL.other}</span>
          ${fromCloud}
          <time>${fmtTime(r.createdAt)}</time>
        </div>
        <h4>${safe(r.title)}</h4>
        ${r.author ? `<div class="ar-author">作者：${safe(r.author)}</div>` : ''}
        ${r.note ? `<p class="ar-note">${safe(r.note)}</p>` : ''}
        ${thumbs ? `<div class="ar-thumbs">${thumbs}</div>` : ''}
        ${fileRows ? `<div class="ar-files">${fileRows}</div>` : ''}
        <div class="ar-card-actions">
          ${r._cloud ? '' : `<button class="ar-del" data-id="${safe(r.id)}" type="button">删除</button>`}
        </div>
      </article>`;
  }).join('');

  // 下载附件
  box.querySelectorAll('.ar-file').forEach(btn => btn.addEventListener('click', () => {
    const recId = btn.dataset.rec, idx = parseInt(btn.dataset.i, 10);
    const rec = merged.find(x => x.id === recId);
    const f = rec?.files?.[idx];
    if (!f) return;
    if (f.data) {
      const blob = new Blob([b64ToBuf(f.data)], { type: f.type || 'application/octet-stream' });
      dlBlob(blob, f.name);
    } else if (f.url) {
      const a = document.createElement('a'); a.href = f.url; a.download = f.name || 'attachment'; a.click();
    } else {
      showMsg('该文件较大，未随记录同步到云端，仅保存在原始设备的浏览器里。', 'warn');
    }
  }));
  // 删除
  box.querySelectorAll('.ar-del').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('确定删除这条本地记录吗？')) return;
    try { await deleteRecord(btn.dataset.id); showMsg('已删除'); await renderList(); }
    catch (e) { showMsg('删除失败：' + e.message, 'err'); }
  }));
}
function dlBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name || 'download'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

let msgTimer;
function showMsg(text, kind = '') {
  const el = document.getElementById('arCloudMsg');
  if (!el) return;
  el.textContent = text;
  el.className = 'ar-msg ' + (kind === 'err' ? 'err' : kind === 'warn' ? 'warn' : kind === 'ok' ? 'ok' : '');
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { el.textContent = ''; el.className = 'ar-msg'; }, 6000);
}

/* ---------------- 云端读写 ---------------- */
function apiHeaders(token, json = false) {
  const h = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) h.Authorization = 'Bearer ' + token;
  if (json) h['Content-Type'] = 'application/json';
  return h;
}
async function cloudFetch(token) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CLOUD_PATH}`;
  const resp = await fetch(url, { headers: apiHeaders(token) });
  if (resp.status === 404) return { archive: null, sha: null };
  if (!resp.ok) throw new Error('读取云端失败（HTTP ' + resp.status + '）' + (resp.status === 401 ? '，请检查令牌' : ''));
  const d = await resp.json();
  let archive = null;
  try { archive = JSON.parse(b64ToUtf8((d.content || '').replace(/\s/g, ''))); } catch { archive = null; }
  return { archive, sha: d.sha };
}
/* 公开读取：直接访问经 GitHub Pages 发布的静态文件，避免未认证 API 被限流(403) */
async function cloudReadPublic() {
  const url = `./records/archive.json?t=${Date.now()}`;
  const resp = await fetch(url, { cache: 'no-store' });
  if (resp.status === 404) return null;               // 尚未有人同步过
  if (!resp.ok) throw new Error('读取云端文件失败（HTTP ' + resp.status + '）');
  return await resp.json();
}
async function cloudWrite(token, archive, sha) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CLOUD_PATH}`;
  const payload = {
    message: 'chore: 更新实验数据存档记录',
    content: utf8ToB64(JSON.stringify(archive)),
    branch: 'main',
  };
  if (sha) payload.sha = sha;
  const resp = await fetch(url, { method: 'PUT', headers: apiHeaders(token, true), body: JSON.stringify(payload) });
  if (!resp.ok) {
    const d = await resp.json().catch(() => ({}));
    throw new Error('写入云端失败（HTTP ' + resp.status + '）：' + (d.message || '请检查令牌权限'));
  }
}

/* 把本地记录转换为可同步的轻量结构（大文件内容不内嵌） */
async function buildArchive(local) {
  let embedded = 0;
  const out = [];
  for (const r of local) {
    const files = [];
    for (const f of (r.files || [])) {
      let data = f.data || null;   // 已存在的 base64（如从画布导入）
      if (!data && f.blob && f.size <= CLOUD_MAX_FILE && embedded + f.size <= CLOUD_MAX_TOTAL) {
        try {
          data = bufToB64(await fileToBuf(f.blob));
          embedded += f.size;
        } catch { data = null; }
      }
      files.push({ name: f.name, type: f.type, size: f.size, data, cloudSkipped: !data && !!f.blob });
    }
    out.push({ id: r.id, title: r.title, type: r.type, author: r.author, note: r.note, createdAt: r.createdAt, files });
  }
  return { updatedAt: Date.now(), app: 'AIGC广告虚拟仿真实验-数据存档', records: out };
}

async function loadCloud(auto = false) {
  try {
    const archive = await cloudReadPublic();
    cloudRecords = (archive?.records || []).map(r => ({ ...r, _cloud: true }));
    await renderList();
    if (!auto) showMsg(`已从云端加载 ${cloudRecords.length} 条公共记录。`, 'ok');
  } catch (e) {
    if (!auto) showMsg('加载云端失败：' + e.message, 'err');
  }
}

/* ---------------- 表单与事件 ---------------- */
async function onSave(e) {
  e.preventDefault();
  const title = (document.getElementById('arTitle')?.value || '').trim();
  if (!title) { showMsg('请填写实验名称', 'warn'); document.getElementById('arTitle')?.focus(); return; }
  const fileInput = document.getElementById('arFiles');
  const files = [];
  if (fileInput?.files) {
    for (const f of fileInput.files) {
      files.push({ name: f.name, type: f.type, size: f.size, blob: f });
    }
  }
  const rec = {
    id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    title,
    type: document.getElementById('arType')?.value || 'other',
    author: (document.getElementById('arAuthor')?.value || '').trim(),
    note: (document.getElementById('arNote')?.value || '').trim(),
    createdAt: Date.now(),
    files,
  };
  try {
    await saveRecord(rec);
    e.target.reset();
    updateFileNames();
    showMsg('记录已保存到本机浏览器。', 'ok');
    await renderList();
  } catch (err) { showMsg('保存失败：' + err.message, 'err'); }
}

function updateFileNames() {
  const el = document.getElementById('arFileNames');
  const input = document.getElementById('arFiles');
  if (!el || !input) return;
  const names = [...input.files].map(f => `${safe(f.name)} <em>${fmtSize(f.size)}</em>`);
  el.innerHTML = names.length ? names.join('') : '';
}

/* 从画布快捷导入为图片附件 */
async function importFromCanvas(canvasSel, defaultType, titlePrefix) {
  const canvas = document.querySelector(canvasSel);
  if (!canvas) { showMsg('未找到对应画布，请先进入该实验模块。', 'warn'); return; }
  let dataUrl;
  try { dataUrl = canvas.toDataURL('image/png'); }
  catch { showMsg('该画布无法导出，请检查浏览器设置。', 'err'); return; }
  const name = `${titlePrefix}_${Date.now()}.png`;
  const b64 = dataUrl.split(',')[1] || '';
  const bytes = b64ToBuf(b64);
  const rec = {
    id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    title: titlePrefix + ' · ' + fmtTime(Date.now()),
    type: defaultType,
    author: '', note: '由实验画布一键存档', createdAt: Date.now(),
    files: [{ name, type: 'image/png', size: bytes.byteLength, data: b64 }],
  };
  try {
    await saveRecord(rec);
    showMsg('画布作品已存入存档。', 'ok');
    await renderList();
    document.getElementById('records')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) { showMsg('存档失败：' + err.message, 'err'); }
}

function exportBackup() {
  getAllRecords().then(local => {
    const clean = local.map(r => ({
      ...r,
      files: (r.files || []).map(f => ({
        name: f.name, type: f.type, size: f.size,
        data: f.data || null,
      })),
    }));
    const blob = new Blob([JSON.stringify({ app: 'AIGC存档备份', exportedAt: Date.now(), records: clean }, null, 2)], { type: 'application/json' });
    dlBlob(blob, `实验存档备份_${new Date().toISOString().slice(0, 10)}.json`);
    showMsg('备份文件已生成（附件内容如为本地大文件，需逐条在浏览器中下载）。', 'ok');
  });
}
async function importBackup(file) {
  try {
    const obj = JSON.parse(await file.text());
    const arr = Array.isArray(obj.records) ? obj.records : [];
    for (const r of arr) {
      if (!r.id) r.id = 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      r.files = (r.files || []).map(f => ({ ...f, blob: null })); // 导入的记录附件用 data（若有）
      await saveRecord(r);
    }
    showMsg(`已导入 ${arr.length} 条记录。`, 'ok');
    await renderList();
  } catch (e) { showMsg('导入失败：' + e.message, 'err'); }
}

export function initRecords() {
  const form = document.getElementById('archiveForm');
  if (form) form.addEventListener('submit', onSave);
  document.getElementById('arFiles')?.addEventListener('change', updateFileNames);
  document.getElementById('arSearch')?.addEventListener('input', renderList);
  document.getElementById('arFilter')?.addEventListener('change', renderList);

  document.getElementById('arImportPoster')?.addEventListener('click', () =>
    importFromCanvas('#posterCanvas', 'poster', '海报作品'));
  document.getElementById('arImportStudio')?.addEventListener('click', () =>
    importFromCanvas('#studioCanvas', 'studio', '布光方案'));

  document.getElementById('arExportBtn')?.addEventListener('click', exportBackup);
  document.getElementById('arImportFile')?.addEventListener('change', e => {
    if (e.target.files?.[0]) importBackup(e.target.files[0]);
  });
  document.getElementById('arClearBtn')?.addEventListener('click', async () => {
    if (!confirm('确定清空本机所有存档记录吗？此操作不可撤销（云端记录不受影响）。')) return;
    try { await clearRecords(); showMsg('本机存档已清空。', 'ok'); await renderList(); }
    catch (err) { showMsg('清空失败：' + err.message, 'err'); }
  });

  document.getElementById('arCloudLoadBtn')?.addEventListener('click', () => loadCloud(false));

  document.getElementById('arSyncBtn')?.addEventListener('click', async () => {
    const token = (document.getElementById('arToken')?.value || '').trim();
    if (!token) { showMsg('请先填入你的 GitHub 令牌（仅需一次，保存在本机）。', 'warn'); return; }
    try {
      showMsg('正在同步，请稍候…');
      const local = await getAllRecords();
      if (!local.length) { showMsg('本机还没有记录可同步。', 'warn'); return; }
      const archive = await buildArchive(local);
      const { sha } = await cloudFetch(token);
      await cloudWrite(token, archive, sha);
      localStorage.setItem('ar_gh_token', token);
      cloudRecords = archive.records.map(r => ({ ...r, _cloud: true }));
      await renderList();
      showMsg(`同步成功！${archive.records.length} 条记录已存入网站仓库，所有访问者可见。`, 'ok');
    } catch (e) { showMsg('同步失败：' + e.message, 'err'); }
  });

  // 回填已保存的令牌（仅本机）
  const savedToken = localStorage.getItem('ar_gh_token');
  if (savedToken) { const t = document.getElementById('arToken'); if (t) t.value = savedToken; }

  // 自动加载云端公共记录（公开读取，无需令牌）
  loadCloud(true);
  renderList();
}
