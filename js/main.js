/* ============================================================
   门户站点交互：导航 / 22步 / 站内检索 / 滚动动画 / 数字统计
   ============================================================ */
import { initStudio } from './studio.js?v=20251120b';
import { initPoster } from './poster.js';

/* ---------- 22 步数据（源自申报书） ---------- */
const STEPS = [
  { id:1,  name:'领取项目与任务解读', goal:'提取品牌定位、目标人群、传播目标、预算与周期四项约束要素', time:'5 分钟', score:4, phase:1 },
  { id:2,  name:'市场与竞品分析', goal:'检索同类案例，标注竞品诉求与视觉风格差异，形成 3 条机会点', time:'8 分钟', score:4, phase:1 },
  { id:3,  name:'目标受众画像构建', goal:'完成人群分层，输出含年龄、兴趣、媒介习惯、触达成本的画像卡', time:'8 分钟', score:4, phase:1 },
  { id:4,  name:'定位与诉求策略确定', goal:'选定定位与理性/感性诉求组合，回应 AI 质询并判断采纳或拒绝', time:'10 分钟', score:4, phase:1 },
  { id:5,  name:'创意概念发想与比选', goal:'提出不少于 3 个创意方向，依据评估报告完成比选并留存理由', time:'10 分钟', score:4, phase:2 },
  { id:6,  name:'拍摄脚本与分镜设计', goal:'完成标题、副标题、主视觉与行动号召（CTA）的信息层级编排及分镜', time:'10 分钟', score:4, phase:2 },
  { id:7,  name:'AIGC 概念草图生成与筛选', goal:'编写提示词产出主视觉草图不少于 5 版，依据品牌调性筛选迭代', time:'12 分钟', score:4, phase:2 },
  { id:8,  name:'智能合规审查与人工确认', goal:'识别禁用用语、著作权与肖像风险，人工复核后签署合规确认', time:'8 分钟', score:4, phase:2 },
  { id:9,  name:'虚拟影棚器材选型', goal:'按拍摄对象选择影室灯/闪光灯、柔光箱、色片、机身与镜头并说明依据', time:'8 分钟', score:5, phase:3 },
  { id:10, name:'布光方案设计', goal:'设置灯位、光比与色温，形成初步布光方案', time:'10 分钟', score:5, phase:3 },
  { id:11, name:'虚拟试拍与参数调整', goal:'对比不少于 3 组布光方案，修正高光溢出、色温偏差与阴影死角', time:'12 分钟', score:5, phase:3 },
  { id:12, name:'布光图与参数单输出', goal:'输出标准布光图、器材清单与曝光参数单，作为实训室实拍依据', time:'8 分钟', score:5, phase:3 },
  { id:13, name:'实训室实拍验证与虚实对比', goal:'按布光图实拍，上传成片与虚拟预演对比并分析差异原因', time:'15 分钟', score:6, phase:3 },
  { id:14, name:'信息流广告版式适配', goal:'按手机信息流安全区与单手操作习惯适配，保证 3 秒内信息可读', time:'8 分钟', score:4, phase:4 },
  { id:15, name:'互动 H5 交互流程设计', goal:'设计不少于 3 个交互节点的流程与页面跳转逻辑，标注反馈动效', time:'10 分钟', score:4, phase:4 },
  { id:16, name:'户外数字屏远距离适配', goal:'按远距离瞬时读取规则调整字号、对比度与信息量', time:'6 分钟', score:4, phase:4 },
  { id:17, name:'预算分配与排期设置', goal:'在预算约束下完成多终端预算分配与投放排期并说明依据', time:'8 分钟', score:4, phase:5 },
  { id:18, name:'仿真投放运行', goal:'启动仿真投放，观察实时数据流并记录异常波动', time:'6 分钟', score:4, phase:5 },
  { id:19, name:'效能数据采集与基准对照', goal:'采集曝光、CTR、停留时长、CVR、品牌记忆度并与行业基准对照', time:'8 分钟', score:4, phase:5 },
  { id:20, name:'效能诊断', goal:'依据诊断报告定位不少于 2 个关键问题要素', time:'8 分钟', score:5, phase:6 },
  { id:21, name:'方案迭代与再验证', goal:'修改变量后重新投放，比较前后效能差异并判断假设是否成立', time:'10 分钟', score:5, phase:6 },
  { id:22, name:'实验报告与反思', goal:'提交含策略说明、布光图、虚实对比、数据图表与反思的实验报告', time:'15 分钟', score:6, phase:6 },
];

function renderSteps() {
  const grid = document.getElementById('stepsGrid');
  if (!grid) return;
  grid.innerHTML = STEPS.map(s => `
    <article class="step-card" data-phase="${s.phase}">
      <div class="step-n">${String(s.id).padStart(2,'0')}</div>
      <div><h4>${s.name}</h4><p>${s.goal}</p>
        <div class="step-meta"><span>⏱ ${s.time}</span><span>满分 <b>${s.score}</b></span></div>
      </div>
    </article>`).join('');
}

function bindStepTabs() {
  document.querySelectorAll('.stab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.stab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      tab.classList.add('active'); tab.setAttribute('aria-selected','true');
      const f = tab.dataset.filter;
      document.querySelectorAll('.step-card').forEach(c => c.classList.toggle('hidden', f !== 'all' && c.dataset.phase !== f));
    });
  });
}

/* ---------- 站内检索 ---------- */
function bindSearch() {
  const input = document.getElementById('siteSearch');
  const btn = document.getElementById('searchBtn');
  if (!input || !btn) return;
  const MAP = [
    { kw:['海报','poster','生成海报','产品图','提示词','文案','画面','模板'], target:'poster', label:'AIGC 商业海报工坊' },
    { kw:['布光','灯光','影棚','试拍','光比','色温','灯具','材质','参数单','布光图','灰卡','柔光箱','滤光片','影室灯','微距','棚拍','打印'], target:'lab', label:'虚拟影棚实验室' },
    { kw:['AIGC','创意','生成','草图','提示词','合规','智能体','智能','质询'], target:'ai', label:'AIGC 智能体' },
    { kw:['多终端','信息流','H5','户外','数字屏','AR','适配'], target:'terminals', label:'多终端适配' },
    { kw:['效能','CTR','转化','诊断','曝光','记忆度','指标'], target:'results', label:'实验结果与结论' },
    { kw:['步骤','操作','22','流程','阶段','学时'], target:'center', label:'实验中心' },
    { kw:['团队','教师','负责人','阎伟','张金'], target:'team', label:'教学团队' },
    { kw:['资源','课件','指导书','视频','题库','支持'], target:'resources', label:'教学资源' },
    { kw:['共享','排行','计划','服务','应用'], target:'sharing', label:'应用与共享' },
    { kw:['通知','公告','动态','新闻','进展'], target:'news', label:'项目动态' },
    { kw:['概览','背景','必要性','目标','原理','知识点'], target:'overview', label:'项目概览' },
  ];
  const run = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { input.focus(); return; }
    const hit = MAP.find(m => m.kw.some(k => q.includes(k.toLowerCase())));
    const target = hit ? hit.target : 'center';
    const label = hit ? hit.label : '实验中心';
    document.getElementById(target)?.scrollIntoView({ behavior:'smooth', block:'start' });
    toast(hit ? `已定位到「${label}」` : `未找到精确匹配，已为您定位到「${label}」`);
  };
  btn.addEventListener('click', run);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  document.querySelectorAll('.hot-words a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); input.value = a.textContent; run();
  }));
}

let toastTimer;
function toast(msg) {
  let el = document.getElementById('siteToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'siteToast';
    el.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%) translateY(20px);background:#0f2a5a;color:#fff;padding:10px 20px;border-radius:100px;font-size:.85rem;box-shadow:0 10px 30px rgba(0,0,0,.25);z-index:300;opacity:0;transition:.3s;pointer-events:none';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateX(-50%) translateY(0)'; });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) translateY(20px)'; }, 2400);
}

/* ---------- 移动端导航 ---------- */
function bindNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open'); toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
    }));
  }
  // 导航当前项高亮
  const links = [...document.querySelectorAll('.main-nav a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(a => a.style.color = '');
          const active = links.find(a => a.getAttribute('href') === '#' + e.target.id);
          if (active) { active.style.color = '#1d5fd0'; active.style.fontWeight = '700'; }
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => io.observe(s));
  }
}

/* ---------- 滚动出现动画 ---------- */
function bindReveal() {
  const targets = document.querySelectorAll('.smart-card,.ov-card,.obj-card,.phase,.step-card,.ai-card,.term-card,.metric,.result,.res-card,.share-card,.news-col,.member,.school,.support-list>div');
  targets.forEach(el => el.classList.add('reveal'));
  if (!('IntersectionObserver' in window)) { targets.forEach(el => el.classList.add('visible')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold:.08, rootMargin:'0px 0px -30px 0px' });
  targets.forEach(el => io.observe(el));
}

/* ---------- 数字统计 ---------- */
function bindCounters() {
  const nums = document.querySelectorAll('.data-cell b[data-count]');
  if (!nums.length) return;
  const run = el => {
    const target = parseInt(el.dataset.count,10), dur=1100, start=performance.now();
    const tick = now => {
      const p = Math.min((now-start)/dur,1), e = 1-Math.pow(1-p,3);
      el.textContent = Math.round(target*e);
      if (p<1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
  }), { threshold:.5 });
  nums.forEach(n => io.observe(n));
}

/* ---------- 启动 ---------- */
function boot() {
  renderSteps();
  bindStepTabs();
  bindNav();
  bindSearch();
  bindReveal();
  bindCounters();
  initStudio();
  initPoster();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
