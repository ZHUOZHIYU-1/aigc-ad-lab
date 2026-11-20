/* ============================================================
   虚拟影棚实验室 · 可实操 3D 场景编辑器
   ------------------------------------------------------------
   · 布景物体：选中 / 移动 / 旋转 / 缩放 / 改色 / 换材质 / 复制 / 删除 / 撤销
   · 添加物体：立方体、球体、圆柱、圆锥、圆环、展板
   · 上传：3D 模型(GLB/GLTF)、物体贴图、场景背景、广告画面
   · 照片转3D：浮雕 / 抠图挤出 / 瓶身环绕 / 立体卡片（浏览器本地处理，不上传服务器）
   · 灯具：拖拽灯位、光强 / 色温 / 光比实时物理光照渲染
   · AI 布光参谋、方案评分、布光参数单导出、场景截图
   ============================================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const PRESETS = {
  flat:      { label: '大平光',   key: [-6, 6, 7],  fill: [6, 5, 6],   rim: [0, 6, -6],  intensity: 0.8, temp: 5600, ratio: 1.4 },
  rembrandt: { label: '伦勃朗光', key: [-5, 7, 6],  fill: [4, 3, 4],   rim: [3, 6, -5],  intensity: 1.0, temp: 5200, ratio: 3.2 },
  rim:       { label: '侧逆光',   key: [6, 6, -5],  fill: [-6, 4, 5],  rim: [-3, 7, -6], intensity: 1.1, temp: 6100, ratio: 4.0 },
  butterfly: { label: '蝴蝶光',   key: [0, 9, 7],   fill: [0, 4, 5],   rim: [0, 7, -6],  intensity: 0.9, temp: 5500, ratio: 2.2 },
};

/* 商业拍摄场景：一键布置灯位 / 光比 / 色温 / 背景 / 材质，供棚拍、微距反复试错 */
const SCENES = {
  product:  { label:'商品棚拍', key:[-6,6,7],  fill:[6,5,6],   rim:[0,6,-6],  intensity:0.85, temp:5600, ratio:1.6, bgA:'#0d1626', bgB:'#1b2b4a', material:'metal', scale:1.25, gear:['softbox','graycard'], desc:'干净背景 + 大面积柔光，突出商品轮廓与质感' },
  macro:    { label:'珠宝微距', key:[-5,7,5],  fill:[4,4,3],   rim:[-3,7,-6], intensity:1.1,  temp:5200, ratio:3.2, bgA:'#05070d', bgB:'#12131f', material:'glass', scale:1.6,  gear:['softbox','reflector'], desc:'深色背景 + 侧逆光勾勒，适合珠宝与玻璃微距' },
  portrait: { label:'人像棚拍', key:[-5,7,6],  fill:[4,4,4],   rim:[3,6,-5],  intensity:0.95, temp:5100, ratio:2.4, bgA:'#1a1622', bgB:'#3a2b3f', material:'skin',  scale:1.05, gear:['strobe','softbox'], desc:'伦勃朗三角光，塑造人物立体感与眼神光' },
  liquid:   { label:'动感液体', key:[6,6,-4],  fill:[-6,4,5],  rim:[2,7,-6],  intensity:1.15, temp:6500, ratio:4.2, bgA:'#04060f', bgB:'#1a0f2e', material:'glass', scale:1.2,  gear:['gel-blue','gel-red','reflector'], desc:'彩色滤光片 + 强侧逆光，制造高速动感与撞色冲击' },
};

/* 实训室器材（1:1 还原摄影摄像实训室设备） */
const EQUIP_META = {
  strobe:    { name:'影室灯',     color:'#f59e0b' },
  softbox:   { name:'柔光箱',     color:'#e2e8f0' },
  reflector: { name:'反光板',     color:'#cbd5e1' },
  graycard:  { name:'标准灰卡',   color:'#808080' },
  'gel-red':    { name:'红色滤光片', color:'#ef4444' },
  'gel-blue':   { name:'蓝色滤光片', color:'#3b82f6' },
  'gel-yellow': { name:'黄色滤光片', color:'#facc15' },
  'gel-green':  { name:'绿色滤光片', color:'#22c55e' },
};

const MATERIALS = {
  metal:  { label: '金属', color: 0xdfe4ea, metalness: 0.95, roughness: 0.22 },
  glass:  { label: '玻璃', color: 0xcfe8f5, metalness: 0.0,  roughness: 0.06, transmission: 0.92, thickness: 1.4, ior: 1.5 },
  fabric: { label: '织物', color: 0x7c6f9e, metalness: 0.0,  roughness: 0.95 },
  skin:   { label: '皮肤', color: 0xe0ac8c, metalness: 0.0,  roughness: 0.62 },
};

const LIGHT_META = {
  key:  { name: '主光 Key',  color: '#f59e0b', defIntensity: 1.0, defTemp: 5600 },
  fill: { name: '补光 Fill', color: '#38bdf8', defIntensity: 0.4, defTemp: 6500 },
  rim:  { name: '轮廓光 Rim', color: '#a855f7', defIntensity: 0.9, defTemp: 5000 },
};

// 可添加的基础几何体
const SHAPES = {
  box:      { label: '立方体', color: '#7dd3fc', geo: () => new THREE.BoxGeometry(1.6, 1.6, 1.6) },
  sphere:   { label: '球体',   color: '#fca5a5', geo: () => new THREE.SphereGeometry(1, 40, 28) },
  cylinder: { label: '圆柱',   color: '#86efac', geo: () => new THREE.CylinderGeometry(0.8, 0.8, 1.8, 40) },
  cone:     { label: '圆锥',   color: '#fde68a', geo: () => new THREE.ConeGeometry(0.9, 1.8, 40) },
  torus:    { label: '圆环',   color: '#d8b4fe', geo: () => new THREE.TorusGeometry(0.85, 0.3, 20, 48) },
  plane:    { label: '展板',   color: '#f8fafc', geo: () => new THREE.PlaneGeometry(2.6, 1.8) },
};

// Three.js r155+ 物理光照单位，需放大强度
const LIGHT_SCALE = 160;

export function initStudio() {
  const canvas = document.getElementById('studioCanvas');
  const canvasWrap = document.getElementById('canvasWrap');
  const loading = document.getElementById('canvasLoading');
  if (!canvas || !canvasWrap) return;

  const testGl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!testGl) {
    if (loading) loading.innerHTML = '<div style="text-align:center;padding:20px;color:#9aa9c0;line-height:1.8">当前浏览器未启用 WebGL，3D 实验室无法加载。<br>请使用 Chrome / Edge / Firefox 最新版，或在设置中开启硬件加速。</div>';
    return;
  }

  function setTip(text) { const el = document.getElementById('vpTip'); if (el) el.textContent = text; }

  /* ---------------- 基础场景 ---------------- */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d18);
  scene.fog = new THREE.Fog(0x080d18, 18, 34);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(8, 6, 10);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  } catch (e) {
    if (loading) loading.textContent = '渲染器初始化失败：' + e.message;
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 22;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.set(0, 1.5, 0);
  controls.update();

  // 环境
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.92, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(40, 40, 0x1e3a5f, 0x16233a);
  grid.position.y = 0.002;
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  scene.add(grid);

  const backdrop = new THREE.Mesh(
    new THREE.CylinderGeometry(14, 14, 20, 48, 1, true, Math.PI * 0.15, Math.PI * 1.7),
    new THREE.MeshStandardMaterial({ color: 0x0e1626, roughness: 1, side: THREE.BackSide })
  );
  backdrop.position.y = 9;
  scene.add(backdrop);

  const ambient = new THREE.AmbientLight(0x5a6b8c, 0.9);
  scene.add(ambient);

  /* ---------------- 物体系统 ---------------- */
  const state = { selected: 'key', mode: 'translate', preset: 'flat', scene: 'product', material: 'metal', ratio: PRESETS.flat.ratio, score: 0, tips: [] };

  const objects = new Map();          // id -> 物体记录
  const deletedIds = new Set();       // 已删除（隐藏）的物体，撤销时可恢复
  const draggables = [];              // 射线拾取目标
  let objSeq = 0;
  const history = [];                 // 撤销栈

  function physMaterial(color, opts = {}) {
    return new THREE.MeshPhysicalMaterial({
      color, metalness: 0.55, roughness: 0.35, envMapIntensity: 1.0,
      clearcoat: 0.25, clearcoatRoughness: 0.25, side: THREE.DoubleSide, ...opts,
    });
  }

  function registerObject(rec) {
    rec.group.userData.objId = rec.id;
    rec.group.userData.kind = 'object';
    rec.group.traverse(o => {
      o.userData.objId = rec.id;
      o.userData.kind = 'object';
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    scene.add(rec.group);
    objects.set(rec.id, rec);
    draggables.push(rec.group);
    renderObjList();
    return rec;
  }

  // 默认布景：拍摄主体（瓶）
  const productMat = physMaterial(MATERIALS.metal.color, { metalness: MATERIALS.metal.metalness, roughness: MATERIALS.metal.roughness });
  const productGroup = new THREE.Group();
  productGroup.position.set(0, 0.4, 0);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 2.0, 48), productMat);
  body.position.y = 1.0;
  productGroup.add(body);
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.9, 48, 24), productMat);
  shoulder.scale.y = 0.42; shoulder.position.y = 2.0;
  productGroup.add(shoulder);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.5, 32), productMat);
  neck.position.y = 2.42;
  productGroup.add(neck);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 32), new THREE.MeshStandardMaterial({ color: 0x9aa7bb, metalness: 0.8, roughness: 0.3 }));
  cap.position.y = 2.76;
  productGroup.add(cap);
  const product = registerObject({ id: 'product', name: '拍摄主体 · 产品瓶', type: 'bottle', group: productGroup, color: '#dfe4ea', material: 'metal' });

  // 默认布景：展台
  const standGroup = new THREE.Group();
  const standMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.35, 0.4, 64), physMaterial(0x1b2436, { metalness: 0.3, roughness: 0.6 }));
  standMesh.position.y = 0.2;
  standGroup.add(standMesh);
  const stand = registerObject({ id: 'stand', name: '圆形展台', type: 'stand', group: standGroup, color: '#1b2436', material: 'custom' });

  // 默认布景：道具
  function addShape(shapeKey, pos, name) {
    const def = SHAPES[shapeKey];
    const mesh = new THREE.Mesh(def.geo(), physMaterial(def.color));
    const group = new THREE.Group();
    group.add(mesh);
    if (pos) group.position.set(...pos);
    else group.position.set((Math.random() - 0.5) * 4, shapeKey === 'plane' ? 1.6 : 0.9, (Math.random() - 0.5) * 3 - 1);
    const id = 'obj_' + (++objSeq);
    return registerObject({ id, name: name || def.label, type: shapeKey, group, color: def.color, material: 'custom' });
  }
  addShape('box', [-3.6, 0.8, 1.2], '道具 · 立方体');
  addShape('sphere', [3.4, 1.0, 0.8], '道具 · 球体');
  addShape('torus', [2.6, 1.2, -2.6], '道具 · 圆环');

  // 记录初始布景状态，供「恢复默认」使用
  const defaultObjStates = {};
  objects.forEach(o => {
    defaultObjStates[o.id] = {
      pos: o.group.position.toArray(), rot: [o.group.rotation.x, o.group.rotation.y, o.group.rotation.z],
      scale: o.group.scale.toArray(), color: o.color, name: o.name,
    };
  });
  const defaultObjIds = new Set(objects.keys());

  /* ---------------- 灯光系统 ---------------- */
  const target = new THREE.Object3D();
  target.position.set(0, 1.5, 0);
  scene.add(target);

  const lights = {};

  function makeFixture(key, pos) {
    const meta = LIGHT_META[key];
    const group = new THREE.Group();
    group.position.set(...pos);
    group.userData.dragKey = key;
    group.userData.kind = 'light';

    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.4 }));
    group.add(housing);
    const emitterMat = new THREE.MeshStandardMaterial({ color: meta.color, emissive: meta.color, emissiveIntensity: 2.6, roughness: 0.3, side: THREE.DoubleSide });
    const emitter = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32), emitterMat);
    emitter.position.z = 0.49;
    group.add(emitter);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14),
      new THREE.MeshBasicMaterial({ color: meta.color, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
    group.add(glow);
    group.userData.glow = glow;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 40),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0 }));
    group.add(ring);
    group.userData.ring = ring;
    group.userData.emitterMat = emitterMat;
    group.traverse(o => { o.userData.dragKey = key; o.userData.kind = 'light'; });
    scene.add(group);
    draggables.push(group);

    const spot = new THREE.SpotLight(kelvinToRGB(meta.defTemp), meta.defIntensity, 30, Math.PI / 5.5, 0.55, 1.2);
    spot.position.copy(group.position);
    spot.target = target;
    scene.add(spot);

    lights[key] = { key, group, spot, ring, emitterMat, intensity: meta.defIntensity, temp: meta.defTemp, enabled: true };
    return group;
  }
  makeFixture('key', PRESETS.flat.key);
  makeFixture('fill', PRESETS.flat.fill);
  makeFixture('rim', PRESETS.flat.rim);
  lights.key.spot.castShadow = true;
  lights.key.spot.shadow.mapSize.set(1024, 1024);
  lights.key.spot.shadow.bias = -0.0015;
  lights.key.spot.shadow.camera.near = 0.5;
  lights.key.spot.shadow.camera.far = 30;

  /* ---------------- 商业场景 / 实训室器材（1:1 还原） ---------------- */
  function addStand(group, topY) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.05, topY, 10),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 })
    );
    pole.position.y = topY / 2;
    group.add(pole);
    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.5, 0.06, 20),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.5 })
    );
    foot.position.y = 0.03;
    group.add(foot);
  }

  function grayCardTexture() {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 340;
    const c = cv.getContext('2d');
    c.fillStyle = '#0f172a'; c.fillRect(0, 0, 256, 340);
    [['#ffffff','WHITE'], ['#808080','18% GRAY'], ['#1a1a1a','BLACK']].forEach((b, i) => {
      c.fillStyle = b[0]; c.fillRect(14, 14 + i * 96, 228, 86);
      c.fillStyle = b[0] === '#1a1a1a' ? '#e2e8f0' : '#334155';
      c.font = 'bold 15px sans-serif'; c.textAlign = 'center';
      c.fillText(b[1], 128, 62 + i * 96);
    });
    ['#ef4444','#f59e0b','#facc15','#22c55e','#3b82f6','#a855f7'].forEach((col, i) => {
      c.fillStyle = col; c.fillRect(14 + i * 38, 304, 34, 22);
    });
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; return tex;
  }

  function buildEquipment(type) {
    const g = new THREE.Group();
    const meta = EQUIP_META[type] || { name: '器材', color: '#cbd5e1' };
    const dark = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.65, roughness: 0.4 });
    if (type === 'strobe') {
      addStand(g, 1.5);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.72), dark); head.position.y = 1.62; g.add(head);
      const bowl = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xdbe3ee, metalness: 0.85, roughness: 0.25, side: THREE.DoubleSide })
      );
      bowl.rotation.x = Math.PI / 2; bowl.position.set(0, 1.62, 0.36); g.add(bowl);
      const flash = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20),
        new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffd27a, emissiveIntensity: 2.2 }));
      flash.position.set(0, 1.62, 0.55); g.add(flash);
    } else if (type === 'softbox') {
      addStand(g, 1.5);
      const box = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.95, 0.7, 4, 1),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.3, roughness: 0.7, side: THREE.DoubleSide }));
      box.rotation.x = Math.PI / 2; box.rotation.z = Math.PI / 4; box.position.set(0, 1.6, 0); g.add(box);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.55),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e0, emissiveIntensity: 0.85, side: THREE.DoubleSide, roughness: 0.9 }));
      face.position.set(0, 1.6, 0.42); g.add(face);
    } else if (type === 'reflector') {
      addStand(g, 1.4);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.85, 32),
        new THREE.MeshStandardMaterial({ color: 0xdbe4ef, metalness: 0.92, roughness: 0.18, side: THREE.DoubleSide }));
      disc.position.y = 1.55; g.add(disc);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.028, 8, 40),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 }));
      rim.position.y = 1.55; g.add(rim);
    } else if (type === 'graycard') {
      addStand(g, 1.5);
      const card = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.66),
        new THREE.MeshStandardMaterial({ map: grayCardTexture(), roughness: 0.95, side: THREE.DoubleSide }));
      card.position.y = 1.55; g.add(card);
    } else if (type.startsWith('gel-')) {
      addStand(g, 1.5);
      const film = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(meta.color), transparent: true, opacity: 0.5, roughness: 0.2,
        metalness: 0, side: THREE.DoubleSide, depthWrite: false }));
      film.position.y = 1.6; g.add(film);
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.03, 8, 4),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 }));
      frame.rotation.z = Math.PI / 4; frame.position.y = 1.6; g.add(frame);
    }
    g.userData.equipType = type;
    return g;
  }

  function addEquipment(type, noSnap) {
    const meta = EQUIP_META[type];
    if (!meta) return null;
    if (!noSnap) snapshot();
    const group = buildEquipment(type);
    const idx = [...objects.values()].filter(o => o.type === 'equip').length;
    const ang = (idx % 6) * Math.PI / 3 + 0.4;
    const r = 3.4;
    group.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
    group.lookAt(target.position.x, 1.4, target.position.z);
    const id = 'obj_' + (++objSeq);
    const rec = registerObject({ id, name: meta.name, type: 'equip', equipType: type, group, color: meta.color, material: 'custom' });
    if (!noSnap) { selectObject(id); setTip(`实训室器材「${meta.name}」已加入影棚，可移动/旋转/缩放`); }
    return rec;
  }

  function setSceneColor(a, b) {
    scene.background = new THREE.Color(a);
    backdrop.material.map = null; backdrop.material.color.set(a); backdrop.material.needsUpdate = true;
    bgTexture = null; bgGradientCanvas = null;
    const ea = document.getElementById('bgColorA'), eb = document.getElementById('bgColorB');
    if (ea) ea.value = a; if (eb) eb.value = b;
    document.querySelectorAll('[data-bg]').forEach(x => x.classList.toggle('active', x.dataset.bg === 'color'));
  }

  function applyScene(name) {
    const sc = SCENES[name];
    if (!sc) return;
    snapshot();
    state.scene = name;
    lights.key.group.position.set(...sc.key);
    lights.fill.group.position.set(...sc.fill);
    lights.rim.group.position.set(...sc.rim);
    lights.key.intensity = sc.intensity;
    lights.key.temp = sc.temp;
    lights.fill.temp = sc.temp + 500;
    lights.rim.temp = sc.temp - 400;
    state.ratio = sc.ratio;
    Object.values(lights).forEach(l => { l.enabled = true; });
    document.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
    setSceneColor(sc.bgA, sc.bgB);
    const productObj = objects.get('product');
    if (productObj) {
      applyMaterialToObject(productObj, sc.material);
      productObj.group.scale.setScalar(sc.scale);
      productObj.group.position.set(0, 0.4, 0);
    }
    (sc.gear || []).forEach(g => {
      const exists = [...objects.values()].some(o => o.equipType === g && o.group.visible);
      if (!exists) addEquipment(g, true);
    });
    document.querySelectorAll('.scene-preset').forEach(b => b.classList.toggle('active', b.dataset.scene === name));
    syncSlidersFromSelection(); syncSwitches(); selectObject('key'); updateLights(); evaluate();
    setTip(`已按「${sc.label}」一键布置：${sc.desc} · 可继续调灯反复试拍`);
  }

  /* ---------------- 选中高亮框 ---------------- */
  const selectionBox = new THREE.BoxHelper(productGroup, 0x22d3ee);
  selectionBox.visible = false;
  scene.add(selectionBox);

  function isLight(k) { return !!lights[k]; }
  function currentObject() { return objects.get(state.selected) || null; }

  /* ---------------- 撤销 ---------------- */
  function snapshot() {
    const snap = { objects: [], lights: [], seq: objSeq };
    objects.forEach(o => snap.objects.push({
      id: o.id, name: o.name, color: o.color, material: o.material,
      pos: o.group.position.toArray(), rot: [o.group.rotation.x, o.group.rotation.y, o.group.rotation.z],
      scale: o.group.scale.toArray(), visible: o.group.visible,
    }));
    Object.values(lights).forEach(l => snap.lights.push({ key: l.key, pos: l.group.position.toArray(), intensity: l.intensity, temp: l.temp, enabled: l.enabled }));
    history.push(snap);
    if (history.length > 50) history.shift();
  }
  function undo() {
    const h = history.pop();
    if (!h) { setTip('没有可撤销的操作'); return; }
    deletedIds.clear();
    h.objects.forEach(s => {
      const o = objects.get(s.id);
      if (!o) return;
      o.name = s.name; o.color = s.color; o.material = s.material;
      o.group.position.fromArray(s.pos);
      o.group.rotation.set(s.rot[0], s.rot[1], s.rot[2]);
      o.group.scale.fromArray(s.scale);
      o.group.visible = s.visible;
    });
    h.lights.forEach(s => {
      const l = lights[s.key];
      l.group.position.fromArray(s.pos); l.intensity = s.intensity; l.temp = s.temp; l.enabled = s.enabled;
    });
    objSeq = h.seq;
    applyColorToObject(currentObject());
    renderObjList(); syncPropInputs(); syncSlidersFromSelection(); syncSwitches();
    updateLights(); evaluate();
    setTip('已撤销上一步操作');
  }

  /* ---------------- 选中 ---------------- */
  function selectObject(key) {
    state.selected = key;
    document.querySelectorAll('.light-item').forEach(el => el.classList.toggle('active', el.dataset.light === key));
    document.querySelectorAll('.obj-chip').forEach(el => el.classList.toggle('active', el.dataset.obj === key));
    const obj = objects.get(key);
    if (obj) {
      selectionBox.setFromObject(obj.group);
      selectionBox.visible = obj.group.visible;
      setTip(`已选中「${obj.name}」· 当前${modeLabel()}模式：在画布中拖拽`);
      syncPropInputs();
    } else {
      selectionBox.visible = false;
      const m = LIGHT_META[key];
      if (m) setTip(`已选中${m.name} · 拖拽改变灯位，或用滑块调节`);
    }
    syncSlidersFromSelection();
    updateLights();
    updateModeButtons();
  }
  function modeLabel() { return { translate: '移动', rotate: '旋转', scale: '缩放' }[state.mode] || '移动'; }

  /* ---------------- 灯光同步 / 预设 ---------------- */
  function updateLights() {
    Object.values(lights).forEach(l => {
      l.group.lookAt(target.position);
      l.spot.position.copy(l.group.position);
      l.spot.intensity = l.enabled ? l.intensity * LIGHT_SCALE : 0;
      l.spot.color.copy(kelvinToRGB(l.temp));
      l.ring.material.opacity = state.selected === l.key ? 0.9 : 0;
      l.emitterMat.emissiveIntensity = state.selected === l.key ? 3.6 : 2.4;
      l.group.userData.glow.material.opacity = state.selected === l.key ? 0.62 : 0.3;
    });
    lights.fill.spot.intensity = lights.fill.enabled ? (lights.key.intensity / state.ratio) * LIGHT_SCALE : 0;
  }
  function applyPreset(name) {
    const pre = PRESETS[name];
    if (!pre) return;
    state.preset = name;
    lights.key.group.position.set(...pre.key);
    lights.fill.group.position.set(...pre.fill);
    lights.rim.group.position.set(...pre.rim);
    lights.key.intensity = pre.intensity;
    lights.key.temp = pre.temp;
    lights.fill.temp = pre.temp + 600;
    lights.rim.temp = pre.temp - 400;
    state.ratio = pre.ratio;
    Object.values(lights).forEach(l => { l.enabled = true; });
    document.querySelectorAll('.preset').forEach(b => b.classList.toggle('active', b.dataset.preset === name));
    syncSlidersFromSelection(); syncSwitches(); selectObject('key'); updateLights(); evaluate();
  }

  /* ---------------- 材质 / 颜色 ---------------- */
  function applyMaterialToObject(obj, name) {
    if (!obj || !MATERIALS[name]) return;
    const m = MATERIALS[name];
    obj.material = name;
    obj.color = '#' + new THREE.Color(m.color).getHexString();
    let touched = false;
    obj.group.traverse(o => {
      if (o.isMesh && o.material) {
        // GLTF 模型材质可能是数组（多材质网格），逐一处理；统一转为可调 MeshPhysicalMaterial
        const list = Array.isArray(o.material) ? o.material : [o.material];
        const applied = list.map(mat => { touched = true; return matApply(mat, m); });
        // 原来是数组就保持数组，否则还原为单个材质对象
        o.material = Array.isArray(o.material) ? applied : applied[0];
      }
    });
    if (!touched && obj.group.children[0]?.material) obj.group.children[0].material = matApply(obj.group.children[0].material, m);
    if (obj.id === 'product') state.material = name;
    document.querySelectorAll('.material').forEach(b => b.classList.toggle('active', b.dataset.material === name));
    renderObjList(); syncPropInputs(); evaluate();
  }
  // 把任意网格材质（含 GLTF 的 MeshStandardMaterial）统一转为可表达玻璃/金属质感的 MeshPhysicalMaterial
  function matApply(mat, m) {
    let out = mat;
    if (!mat || !mat.isMeshPhysicalMaterial) {
      const src = mat || new THREE.MeshStandardMaterial();
      out = new THREE.MeshPhysicalMaterial({
        color: src.color ? src.color.clone() : new THREE.Color(m.color),
        map: src.map || null, normalMap: src.normalMap || null,
        roughnessMap: src.roughnessMap || null, metalnessMap: src.metalnessMap || null,
        side: src.side !== undefined ? src.side : THREE.FrontSide,
        transparent: src.transparent || false, opacity: src.opacity !== undefined ? src.opacity : 1,
      });
    }
    out.color.setHex(m.color);
    out.metalness = m.metalness; out.roughness = m.roughness;
    if ('transmission' in m) {
      out.transmission = m.transmission; out.thickness = m.thickness; out.ior = m.ior;
      out.transparent = true; out.opacity = 1;
    } else { out.transmission = 0; out.transparent = false; out.opacity = 1; }
    out.needsUpdate = true;
    return out;
  }
  function applyColorToObject(obj) {
    if (!obj || !obj.color) return;
    obj.group.traverse(o => {
      if (o.isMesh && o.material) {
        const list = Array.isArray(o.material) ? o.material : [o.material];
        list.forEach(mat => { if (mat && mat.color) mat.color.set(obj.color); });
      }
    });
    renderObjList();
  }
  function setMaterial(name) {
    const obj = currentObject();
    // 上传的 3D 模型同样支持切换材质；未选中任何物体时才回退到默认拍摄主体
    if (obj) { snapshot(); applyMaterialToObject(obj, name); setTip(`已将「${obj.name}」切换为${MATERIALS[name].label}材质`); }
    else { snapshot(); applyMaterialToObject(product, name); setTip('已将拍摄主体切换为' + MATERIALS[name].label + '材质'); }
  }

  /* ---------------- 物体增删 / 属性 ---------------- */
  function addObject(shapeKey) {
    snapshot();
    const obj = addShape(shapeKey);
    selectObject(obj.id);
    setTip(`已添加「${obj.name}」· ${modeLabel()}模式下拖拽可编辑`);
  }
  function duplicateSelected() {
    const src = currentObject();
    if (!src) { setTip('请先选中一个布景物体'); return; }
    snapshot();
    const clone = src.group.clone(true);
    clone.position.x += 1.2; clone.position.z += 0.8;
    clone.traverse(o => {
      o.userData.objId = null; o.userData.kind = 'object';
      if (o.isMesh && o.material) o.material = o.material.clone();
    });
    const id = 'obj_' + (++objSeq);
    const rec = registerObject({ id, name: src.name + ' 副本', type: src.type, group: clone, color: src.color, material: src.material });
    clone.userData.objId = id; clone.traverse(o => { o.userData.objId = id; o.userData.kind = 'object'; });
    selectObject(id); setTip('已复制物体，可继续编辑');
  }
  function deleteSelected() {
    const obj = currentObject();
    if (!obj) { setTip('请先选中一个布景物体'); return; }
    snapshot();
    obj.group.visible = false;
    deletedIds.add(obj.id);
    selectionBox.visible = false;
    renderObjList();
    selectObject('key');
    setTip(`「${obj.name}」已删除（可用撤销恢复，或重新添加/上传）`);
  }
  function hideSelected() {
    const obj = currentObject();
    if (!obj) { setTip('请先选中一个布景物体'); return; }
    obj.group.visible = !obj.group.visible;
    if (obj.group.visible) deletedIds.delete(obj.id); else deletedIds.add(obj.id);
    selectionBox.visible = obj.group.visible;
    renderObjList();
    setTip(obj.group.visible ? '物体已显示' : '物体已隐藏');
  }

  function renderObjList() {
    const list = document.getElementById('objList');
    if (!list) return;
    const active = [...objects.values()].filter(o => !deletedIds.has(o.id));
    list.innerHTML = active.map(o => `
      <button class="obj-chip ${state.selected === o.id ? 'active' : ''} ${o.group.visible ? '' : 'hidden-obj'}" data-obj="${o.id}" title="选中 ${o.name}">
        <span class="ochip-dot" style="background:${o.color}"></span>${o.name}
      </button>`).join('') || '<span style="font-size:.7rem;color:#6f86a8">暂无布景物体 · 用上方「添加布景 / 上传替换」补充</span>';
    list.querySelectorAll('[data-obj]').forEach(b => b.addEventListener('click', () => selectObject(b.dataset.obj)));
  }
  function syncPropInputs() {
    const obj = currentObject();
    const block = document.getElementById('objectBlock');
    if (!block) return;
    if (!obj) { block.classList.remove('has-object'); return; }
    block.classList.add('has-object');
    const set = (id, v) => { const el = document.getElementById(id); if (el && document.activeElement !== el) el.value = v; };
    set('objName', obj.name);
    set('posX', obj.group.position.x.toFixed(2));
    set('posY', obj.group.position.y.toFixed(2));
    set('posZ', obj.group.position.z.toFixed(2));
    set('rotY', Math.round(THREE.MathUtils.radToDeg(obj.group.rotation.y)));
    set('scaleVal', obj.group.scale.x.toFixed(2));
    set('objColor', obj.color);
    const tag = document.getElementById('objSelName');
    if (tag) tag.textContent = obj.name;
  }

  /* ---------------- 射线拾取 + 拖拽（移动 / 旋转 / 缩放） ---------------- */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const hitPoint = new THREE.Vector3();
  const offset = new THREE.Vector3();
  let drag = null;

  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }
  function pick() {
    raycaster.setFromCamera(pointer, camera);
    const targets = draggables.filter(g => g.visible);
    const hits = raycaster.intersectObjects(targets, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !o.userData.objId && !o.userData.dragKey) o = o.parent;
    if (!o) return null;
    return o.userData.objId || o.userData.dragKey;
  }

  canvas.addEventListener('pointerdown', (e) => {
    setPointer(e);
    const picked = pick();
    if (!picked) return;
    selectObject(picked);
    const light = isLight(picked);
    const mode = light ? 'translate' : state.mode;
    drag = {
      id: picked, light, mode,
      startX: e.clientX, startY: e.clientY,
      startRot: light ? null : objects.get(picked).group.rotation.clone(),
      startScale: light ? 1 : objects.get(picked).group.scale.x,
    };
    if (mode === 'translate') {
      const normal = new THREE.Vector3();
      camera.getWorldDirection(normal);
      dragPlane.setFromNormalAndCoplanarPoint(normal, light ? target.position : objects.get(picked).group.position);
      raycaster.ray.intersectPlane(dragPlane, hitPoint);
      const obj = light ? lights[picked].group : objects.get(picked).group;
      offset.copy(obj.position).sub(hitPoint);
    }
    snapshot();
    controls.enabled = false;
    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = 'grabbing';
    setTip(light ? '正在调整灯位…' : `正在${modeLabel()}「${objects.get(picked).name}」…`);
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', (e) => {
    setPointer(e);
    if (drag) {
      const obj = drag.light ? lights[drag.id].group : objects.get(drag.id).group;
      if (drag.mode === 'translate') {
        raycaster.setFromCamera(pointer, camera);
        raycaster.ray.intersectPlane(dragPlane, hitPoint);
        const p = hitPoint.clone().add(offset);
        if (drag.light) {
          p.y = THREE.MathUtils.clamp(p.y, 1.2, 12);
          const d = Math.hypot(p.x, p.z);
          if (d < 3) { p.x *= 3 / (d || 1); p.z *= 3 / (d || 1); }
          if (d > 13) { p.x *= 13 / d; p.z *= 13 / d; }
        } else {
          p.x = THREE.MathUtils.clamp(p.x, -6, 6);
          p.z = THREE.MathUtils.clamp(p.z, -6, 6);
          p.y = objects.get(drag.id).group.position.y; // 保持高度
        }
        obj.position.copy(p);
      } else if (drag.mode === 'rotate') {
        const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
        obj.rotation.y = drag.startRot.y + dx * 0.012;
        obj.rotation.x = drag.startRot.x + dy * 0.008;
      } else if (drag.mode === 'scale') {
        const dy = e.clientY - drag.startY;
        const s = THREE.MathUtils.clamp(drag.startScale * (1 - dy * 0.006), 0.15, 5);
        obj.scale.setScalar(s);
      }
      if (!drag.light && selectionBox.visible) selectionBox.setFromObject(obj);
      syncPropInputs();
      updateLights();
      scheduleEvaluate();
    } else {
      canvas.style.cursor = pick() ? 'grab' : 'default';
    }
  });

  const endDrag = (e) => {
    if (!drag) return;
    drag = null;
    controls.enabled = true;
    canvas.style.cursor = 'default';
    canvas.releasePointerCapture?.(e.pointerId);
    evaluate();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  /* ---------------- 上传功能 ---------------- */
  function readFileAsURL(file) { return new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); }); }

  async function uploadTexture(file) {
    const obj = currentObject() || product;
    snapshot();
    const url = await readFileAsURL(file);
    const loader = new THREE.TextureLoader();
    loader.load(url, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      obj.group.traverse(o => { if (o.isMesh && o.material) { o.material.map = tex; o.material.needsUpdate = true; } });
      obj.textureUrl = url;
      setTip(`已将图片贴图应用到「${obj.name}」`);
    }, undefined, () => setTip('贴图加载失败'));
  }

  function uploadPoster(file) {
    snapshot();
    readFileAsURL(file).then(url => {
      new THREE.TextureLoader().load(url, tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = physMaterial(0xffffff, { metalness: 0, roughness: 0.85, map: tex });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), mat);
        const group = new THREE.Group();
        group.add(mesh);
        group.position.set(0, 1.8, -2.8);
        const id = 'obj_' + (++objSeq);
        const rec = registerObject({ id, name: '广告画面 · ' + file.name.slice(0, 12), type: 'poster', group, color: '#ffffff', material: 'custom', textureUrl: url });
        selectObject(id);
        setTip('广告画面已作为布景添加，可移动/旋转/缩放');
      }, undefined, () => setTip('画面加载失败'));
    });
  }

  function uploadModel(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'glb' && ext !== 'gltf') { setTip('请上传 .glb 或 .gltf 格式的 3D 模型'); return; }
    setTip('正在解析模型，请稍候…');
    snapshot();
    const url = URL.createObjectURL(file);
    new GLTFLoader().load(url, gltf => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x || 0, size.y || 0, size.z || 0) || 1;
      model.scale.setScalar(2.4 / maxDim);
      const box2 = new THREE.Box3().setFromObject(model);
      model.position.y = -box2.min.y + 0.02;
      model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      const group = new THREE.Group();
      group.add(model);
      group.position.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
      const id = 'obj_' + (++objSeq);
      const rec = registerObject({ id, name: file.name.replace(/\.[^.]+$/, '').slice(0, 16), type: 'model', group, color: '#cbd5e1', material: 'custom' });
      selectObject(id);
      setTip(`3D 模型「${rec.name}」已加入场景`);
      URL.revokeObjectURL(url);
    }, undefined, err => { setTip('模型解析失败：' + (err?.message || '格式不支持')); URL.revokeObjectURL(url); });
  }

  /* ---------------- 照片一键转 3D（浏览器本地处理，不上传服务器） ----------------
     说明：用 Canvas 读取产品照片像素，结合 Three.js 生成真实 3D 网格。
     四种模式：照片浮雕(亮度转深度) / 抠图立体(去背景挤出) / 瓶身环绕(圆柱贴图) / 立体卡片。
     生成的物体与手工添加物体一致：可选中、移动、旋转、缩放、改名、复制、删除、撤销。
  */
  const P3 = { img:null, canvas:null, ctx:null, data:null, w:0, h:0, mode:'cutout', ready:false };

  function p3LoadImage(file){
    return new Promise((res,rej)=>{
      const r=new FileReader();
      r.onload=()=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=r.result; };
      r.onerror=rej; r.readAsDataURL(file);
    });
  }
  function p3Prepare(img){
    const max=640; let w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
    const sc=Math.min(1,max/Math.max(w,h)); w=Math.max(2,Math.round(w*sc)); h=Math.max(2,Math.round(h*sc));
    const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
    const ctx=cv.getContext('2d',{willReadFrequently:true}); ctx.drawImage(img,0,0,w,h);
    P3.img=img; P3.canvas=cv; P3.ctx=ctx; P3.w=w; P3.h=h;
    try{ P3.data=ctx.getImageData(0,0,w,h).data; }catch(e){ P3.data=null; }
  }
  function p3LumAt(u,v){
    const {w,h,data}=P3; if(!data) return .5;
    const px=Math.min(w-1,Math.max(0,Math.round(u*(w-1))));
    const py=Math.min(h-1,Math.max(0,Math.round((1-v)*(h-1))));
    const i=(py*w+px)*4;
    return (data[i]*0.299+data[i+1]*0.587+data[i+2]*0.114)/255;
  }
  function p3Texture(cv){
    const t=new THREE.CanvasTexture(cv);
    t.colorSpace=THREE.SRGBColorSpace;
    t.anisotropy=renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  // 智能抠图：边缘洪水填充（flood fill）+ 轮廓保护 + 边缘羽化。
  // 相比"四角颜色距离"，能正确处理白底白物、浅底浅物等主体/背景近色的情况：
  // 只移除"与画面边缘连通且颜色接近背景"的区域，主体内部近色像素被轮廓保护而保留。
  function p3MakeCutout(threshold){
    const {w,h,data}=P3;
    const N=w*h;

    // 1) 估计背景色：取四条边像素的中位数（比四角平均更抗噪/抗阴影/抗水印）
    const brs=[],bgs=[],bbs=[];
    const step=Math.max(1,Math.floor(Math.min(w,h)/48));
    const take=(x,y)=>{ const i=(y*w+x)*4; brs.push(data[i]); bgs.push(data[i+1]); bbs.push(data[i+2]); };
    for(let x=0;x<w;x+=step){ take(x,0); take(x,h-1); }
    for(let y=0;y<h;y+=step){ take(0,y); take(w-1,y); }
    const median=a=>{ a.sort((p,q)=>p-q); return a[a.length>>1]||0; };
    const br=median(brs), bg=median(bgs), bb=median(bbs);

    // 2) 颜色距离阈值：UI 的 20~110 映射到合理容差
    const tol=Math.max(16,threshold*2.0);
    const colorDist=i=>{ const p=i*4; const dr=data[p]-br,dg=data[p+1]-bg,db=data[p+2]-bb; return Math.sqrt(dr*dr+dg*dg+db*db); };

    // 3) 预计算梯度幅值（相隔2px采样，抗噪），用于识别主体轮廓，作为洪水填充的"墙"
    const grad=new Uint16Array(N);
    for(let y=2;y<h-2;y++) for(let x=2;x<w-2;x++){
      const i=y*w+x, l=(i-2)*4, r=(i+2)*4, u=(i-2*w)*4, dn=(i+2*w)*4;
      const gx=Math.abs(data[r]-data[l])+Math.abs(data[r+1]-data[l+1])+Math.abs(data[r+2]-data[l+2]);
      const gy=Math.abs(data[dn]-data[u])+Math.abs(data[dn+1]-data[u+1])+Math.abs(data[dn+2]-data[u+2]);
      grad[i]=Math.min(765,gx+gy);
    }
    // 梯度墙阈值：主体边缘（如小熊的浅色轮廓线）处的跳变超过它即阻止扩散
    const gradWall=90;

    // 4) 从四边种子做 BFS，标记"与边缘连通且接近背景色"的像素为背景
    const visited=new Uint8Array(N), isBg=new Uint8Array(N), queue=new Int32Array(N);
    let head=0,tail=0;
    const push=idx=>{ if(!visited[idx]){ visited[idx]=1; queue[tail++]=idx; } };
    for(let x=0;x<w;x++){ push(x); push((h-1)*w+x); }
    for(let y=0;y<h;y++){ push(y*w); push(y*w+w-1); }
    while(head<tail){
      const idx=queue[head++];
      if(colorDist(idx)>tol) continue;           // 离背景色够远 → 主体，停止扩散
      if(grad[idx]>gradWall) continue;            // 遇到轮廓边缘 → 停止，保护主体内部近色区域
      isBg[idx]=1;
      const x=idx%w, y=(idx/w)|0;
      if(x>0)push(idx-1); if(x<w-1)push(idx+1);
      if(y>0)push(idx-w); if(y<h-1)push(idx+w);
    }

    // 4) 形态学收尾：填掉主体内部的小洞（去孤立背景斑），并做羽化边缘
    const out=document.createElement('canvas'); out.width=w; out.height=h;
    const oc=out.getContext('2d'); const od=oc.createImageData(w,h);
    const mask=document.createElement('canvas'); mask.width=w; mask.height=h;
    const mc=mask.getContext('2d'); const md=mc.createImageData(w,h);
    const closed=new Uint8Array(isBg);
    for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
      const i=y*w+x;
      if(!isBg[i]) continue;
      // 若某背景像素被大量主体包围（小洞），则填为主体
      let obj=0;
      for(let dy=-2;dy<=2;dy+=2) for(let dx=-2;dx<=2;dx+=2){ if(!isBg[(y+dy)*w+(x+dx)]) obj++; }
      if(obj>=7) closed[i]=0;
    }
    for(let p=0;p<N;p++){
      const i=p*4;
      let a=closed[p]?0:255;
      // 羽化：主体边缘向内 1px 半透明，减少锯齿
      if(a===255){
        const x=p%w,y=(p/w)|0;
        let nearBg=false;
        for(let dy=-1;dy<=1&&!nearBg;dy++)for(let dx=-1;dx<=1;dx++){
          const nx=x+dx,ny=y+dy; if(nx<0||ny<0||nx>=w||ny>=h)continue;
          if(closed[ny*w+nx]){ nearBg=true; break; }
        }
        if(nearBg) a=165;
      }
      od.data[i]=data[i]; od.data[i+1]=data[i+1]; od.data[i+2]=data[i+2]; od.data[i+3]=a;
      md.data[i]=a; md.data[i+1]=a; md.data[i+2]=a; md.data[i+3]=255;
    }
    oc.putImageData(od,0,0); mc.putImageData(md,0,0);
    P3.maskCanvas=mask;   // 供轮廓挤出使用
    return { out, mask };
  }

  // Douglas-Peucker 轮廓简化，降低挤出网格点数
  function p3Simplify(pts,eps){
    if(pts.length<5) return pts;
    const sqd=(p,a,b)=>{ const dx=b[0]-a[0],dy=b[1]-a[1]; const L=dx*dx+dy*dy;
      if(!L) return (p[0]-a[0])**2+(p[1]-a[1])**2;
      let t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L; t=Math.max(0,Math.min(1,t));
      return (p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2; };
    const keep=new Uint8Array(pts.length); keep[0]=keep[pts.length-1]=1;
    const stack=[[0,pts.length-1]];
    while(stack.length){
      const [s,e]=stack.pop(); let max=0,idx=-1;
      for(let i=s+1;i<e;i++){ const d=sqd(pts[i],pts[s],pts[e]); if(d>max){max=d;idx=i;} }
      if(max>eps*eps && idx>0){ keep[idx]=1; stack.push([s,idx],[idx,e]); }
    }
    return pts.filter((_,i)=>keep[i]);
  }

  // 从蒙版提取闭合轮廓环（Moore 邻域追踪），返回像素坐标点数组集合
  function p3Contours(){
    const {w,h}=P3;
    if(!P3.maskCanvas) return [];
    const img=P3.maskCanvas.getContext('2d').getImageData(0,0,w,h).data;
    const bin=new Uint8Array(w*h);
    for(let i=0;i<w*h;i++) bin[i]=img[i*4]>127?1:0;
    // 8 邻域顺时针：0:E 1:SE 2:S 3:SW 4:W 5:NW 6:N 7:NE
    const NBR=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
    const visited=new Uint8Array(w*h);
    const loops=[];
    const area=p=>{ let a=0; for(let i=0;i<p.length;i++){const q=p[i],r=p[(i+1)%p.length]; a+=q[0]*r[1]-r[0]*q[1];} return a/2; };

    function findSeed(){
      for(let y=0;y<h;y++) for(let x=0;x<w;x++){
        const i=y*w+x;
        if(bin[i]===1 && !visited[i]) return [x,y];
      }
      return null;
    }
    function traceOne(sx,sy){
      const contour=[[sx,sy]];
      let cx=sx, cy=sy, prevDir=4;
      const maxSteps=w*h*8;
      for(let step=0;step<maxSteps;step++){
        const start=(prevDir+1)%8;
        let found=false;
        for(let k=0;k<8;k++){
          const d=(start+k)%8;
          const nx=cx+NBR[d][0], ny=cy+NBR[d][1];
          if(nx>=0&&ny>=0&&nx<w&&ny<h && bin[ny*w+nx]===1){
            cx=nx; cy=ny; prevDir=(d+4)%8;
            contour.push([cx,cy]); found=true; break;
          }
        }
        if(!found) break;
        if(cx===sx && cy===sy) break;
      }
      // flood fill 标记整个连通域已访问，避免下次重复追踪该区域
      const stack=[[sx,sy]];
      while(stack.length){
        const [x,y]=stack.pop(), i=y*w+x;
        if(x<0||y<0||x>=w||y>=h||visited[i]||bin[i]!==1) continue;
        visited[i]=1;
        stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
      }
      return contour;
    }
    let seed;
    while((seed=findSeed())!==null){
      const c=traceOne(seed[0],seed[1]);
      const a=Math.abs(area(c));
      if(c.length>8 && a>12) loops.push({pts:p3Simplify(c,Math.max(1.2,w*0.004)), a});
    }
    return loops.sort((p,q)=>q.a-p.a);
  }

  // 用轮廓挤出生成有厚度的实心 3D 小熊模型
  function p3BuildExtruded(outTex,sideColor,depth){
    const {w,h}=P3;
    const loops=p3Contours();
    const group=new THREE.Group();
    if(!loops.length) return null;
    const thick=Math.max(6,Math.round(w*0.14*depth));
    const bevel=Math.max(1,Math.round(w*0.007));
    // shape 用图像像素坐标重映射到中心，y 翻转使模型正立
    const toVec=p=>new THREE.Vector2(p[0]-w/2, h/2-p[1]);
    // 每个连通域作为独立实心形状（避免分离主体被误当孔洞）
    const shapes=loops.map(loop=>{
      const pts=loop.pts, fv=toVec(pts[0]);
      const s=new THREE.Shape();
      s.moveTo(fv.x,fv.y);
      for(let i=1;i<pts.length;i++){ const v=toVec(pts[i]); s.lineTo(v.x,v.y); }
      s.closePath();
      return s;
    });
    const uvgen={
      generateTopUV:(geo,v,ia,ib,ic)=>[ia,ib,ic].map(i=>
        new THREE.Vector2((v[i*3]+w/2)/w, 0.5+v[i*3+1]/h)),
      generateSideWallUV:()=>[new THREE.Vector2(0,0),new THREE.Vector2(1,0),new THREE.Vector2(1,1),new THREE.Vector2(0,1)],
    };
    const geo=new THREE.ExtrudeGeometry(shapes,{
      depth:thick, steps:1, bevelEnabled:true, bevelThickness:bevel, bevelSize:bevel, bevelSegments:2,
      curveSegments:2, UVGenerator:uvgen,
    });
    const capMat=new THREE.MeshStandardMaterial({map:outTex,roughness:.62,metalness:.03,side:THREE.DoubleSide});
    const sideMat=new THREE.MeshStandardMaterial({color:new THREE.Color(sideColor),roughness:.6,metalness:.06});
    const mesh=new THREE.Mesh(geo,[capMat,sideMat]);
    mesh.position.z=-thick/2;   // 厚度居中
    group.add(mesh);
    return group;
  }

  // Chamfer 距离变换：每个前景(主体)像素到最近背景像素的距离，用于自动"充气"
  function p3DistanceTransform(maskCanvas){
    const {w,h}=P3;
    const data=maskCanvas.getContext('2d').getImageData(0,0,w,h).data;
    const d=new Float32Array(w*h), INF=1e6;
    for(let i=0;i<w*h;i++) d[i]=(data[i*4]>127)?INF:0;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      const i=y*w+x; if(!d[i]) continue;
      if(x>0) d[i]=Math.min(d[i],d[i-1]+1);
      if(y>0) d[i]=Math.min(d[i],d[i-w]+1);
      if(x>0&&y>0) d[i]=Math.min(d[i],d[i-w-1]+1.4142);
      if(x<w-1&&y>0) d[i]=Math.min(d[i],d[i-w+1]+1.4142);
    }
    for(let y=h-1;y>=0;y--) for(let x=w-1;x>=0;x--){
      const i=y*w+x; if(!d[i]) continue;
      if(x<w-1) d[i]=Math.min(d[i],d[i+1]+1);
      if(y<h-1) d[i]=Math.min(d[i],d[i+w]+1);
      if(x<w-1&&y<h-1) d[i]=Math.min(d[i],d[i+w+1]+1.4142);
      if(x>0&&y<h-1) d[i]=Math.min(d[i],d[i+w-1]+1.4142);
    }
    let dMax=1; for(let i=0;i<w*h;i++) if(d[i]<INF && d[i]>dMax) dMax=d[i];
    return {d,dMax};
  }

  // 圆润立体：距离场驱动的双凸面——中心饱满、边缘收薄，正反两面都贴彩色图。
  // 宽大的头部/身体自动鼓得高，细窄的手臂/耳朵自然变薄，接近真实玩偶的立体感。
  function p3BuildRounded(outTex,maskCanvas,depth){
    const {w,h}=P3;
    const ratio=h/w, PW=3, PH=3*ratio;
    const {d,dMax}=p3DistanceTransform(maskCanvas);
    const maskTex=p3Texture(maskCanvas);
    const segX=112, segY=Math.max(20,Math.round(segX*ratio));
    const halfThick=0.12+depth*1.05;
    const group=new THREE.Group();
    const makeSide=sign=>{
      const geo=new THREE.PlaneGeometry(PW,PH,segX,segY);
      const pos=geo.attributes.position, uv=geo.attributes.uv;
      for(let i=0;i<pos.count;i++){
        const u=uv.getX(i), v=uv.getY(i);
        const px=Math.min(w-1,Math.max(0,Math.floor(u*w)));
        const py=Math.min(h-1,Math.max(0,Math.floor((1-v)*h)));
        const dist=d[py*w+px];
        const t=dist>=1e5?0:Math.min(1,dist/dMax);
        const dome=Math.sqrt(Math.max(0,1-(1-t)*(1-t)));   // 球冠曲线：中心饱满、边缘平滑收薄
        pos.setZ(i, sign*halfThick*dome);
      }
      geo.computeVertexNormals();
      const mat=new THREE.MeshStandardMaterial({
        map:outTex, alphaMap:maskTex, transparent:true, alphaTest:0.42,
        roughness:.56, metalness:.02, side:THREE.DoubleSide, depthWrite:true,
      });
      return new THREE.Mesh(geo,mat);
    };
    group.add(makeSide(1));   // 正面鼓起
    group.add(makeSide(-1));  // 背面鼓起（也贴彩色图，转到背面不再白纸）
    return group;
  }

  function p3Build(mode,depth,threshold,sideColor){
    const {w,h,canvas}=P3;
    const ratio=h/w, PW=3, PH=3*ratio;
    const group=new THREE.Group();
    if(mode==='relief'){
      // 照片浮雕：逐顶点按亮度设置深度，正面贴原图，配背板
      const segX=72, segY=Math.max(6,Math.min(120,Math.round(segX*ratio)));
      const geo=new THREE.PlaneGeometry(PW,PH,segX,segY);
      const pos=geo.attributes.position, uv=geo.attributes.uv;
      for(let i=0;i<pos.count;i++){
        const lum=p3LumAt(uv.getX(i),uv.getY(i));
        pos.setZ(i,(lum-0.45)*depth*1.8);
      }
      geo.computeVertexNormals();
      const mat=new THREE.MeshStandardMaterial({map:p3Texture(canvas),roughness:.62,metalness:.05,side:THREE.DoubleSide});
      group.add(new THREE.Mesh(geo,mat));
      const back=new THREE.Mesh(new THREE.PlaneGeometry(PW,PH),new THREE.MeshStandardMaterial({color:new THREE.Color(sideColor),roughness:.8,side:THREE.DoubleSide}));
      back.position.z=-depth*1.3; group.add(back);
    } else if(mode==='cutout'){
      // 抠图立体（真·3D 圆润版）：距离场驱动双凸立体，中心饱满、边缘收薄，
      // 正反两面都贴彩色抠图。头部/身体鼓得高、手臂/耳朵自然变薄，接近真实玩偶。
      const {out,mask}=p3MakeCutout(threshold);
      const tex=p3Texture(out);
      const rounded=p3BuildRounded(tex,mask,depth);
      if(rounded){
        return rounded;
      }
      // 回退方案A：距离场失败时用轮廓挤出
      const extruded=p3BuildExtruded(tex,sideColor,depth);
      if(extruded){
        return extruded;
      }
      // 回退方案B：轮廓提取失败时，用每层都贴彩色图的堆叠平面（保证不是白纸）
      const maskTex=p3Texture(mask);
      const layers=Math.max(6,Math.round(8+depth*10));
      const thickness=depth*0.7;
      const tint=new THREE.Color(sideColor).lerp(new THREE.Color(0xffffff),0.55);
      for(let i=0;i<layers;i++){
        const front=(i===layers-1);
        const m=new THREE.MeshStandardMaterial({
          map:tex, alphaMap:maskTex, color:front?0xffffff:tint,
          transparent:true, alphaTest:.3, roughness:.6, metalness:.03,
          side:THREE.DoubleSide, depthWrite:false,
        });
        const mesh=new THREE.Mesh(new THREE.PlaneGeometry(PW,PH),m);
        mesh.position.z=(i-(layers-1)/2)*(thickness/layers);
        group.add(mesh);
      }
    } else if(mode==='cylinder'){
      // 瓶身环绕：照片缠绕圆柱侧面（适合饮料瓶 / 易拉罐 / 罐装产品）
      const tex=p3Texture(canvas);
      // 圆柱 UV 从 +X 起绕一圈，默认相机在(8,6,10)，照片中心(主体)会落到背面。
      // 用环绕平移把照片水平中心(0.5)对准初始相机视线方向(约 u=0.11)，让产品图案正对观众。
      tex.wrapS=THREE.RepeatWrapping;
      tex.offset.x=0.39;
      const rad=1.15, height=2.7;
      const body=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,height,64,1,true),
        new THREE.MeshStandardMaterial({map:tex,roughness:.5,metalness:.06,side:THREE.DoubleSide}));
      group.add(body);
      const capMat=new THREE.MeshStandardMaterial({color:new THREE.Color(sideColor),roughness:.45,metalness:.35});
      const top=new THREE.Mesh(new THREE.CylinderGeometry(rad*0.62,rad,0.22,48),capMat); top.position.y=height/2+0.08; group.add(top);
      const bot=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,0.12,48),capMat); bot.position.y=-height/2; group.add(bot);
    } else {
      // 立体卡片：带厚度的平面展示牌，+Z 面贴原图
      const tex=p3Texture(canvas);
      const thick=Math.max(0.08,depth*0.5);
      const side=new THREE.MeshStandardMaterial({color:new THREE.Color(sideColor),roughness:.7});
      const front=new THREE.MeshStandardMaterial({map:tex,roughness:.6,side:THREE.DoubleSide});
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(PW,PH,thick),[side,side,side,side,front,side]);
      group.add(mesh);
    }
    return group;
  }
  function p3AddToScene(){
    if(!P3.ready){ setTip('请先选择一张产品照片'); return; }
    const depth=parseFloat(document.getElementById('p3Depth')?.value||'55')/100;
    const threshold=parseInt(document.getElementById('p3Thresh')?.value||'62',10);
    const sideColor=document.getElementById('p3Side')?.value||'#d9dde3';
    setTip('正在生成 3D 物体…');
    snapshot();
    try{
      const group=p3Build(P3.mode,depth,threshold,sideColor);
      const box=new THREE.Box3().setFromObject(group);
      const size=box.getSize(new THREE.Vector3());
      const maxDim=Math.max(size.x||0,size.y||0,size.z||0)||1;
      group.scale.setScalar(2.8/maxDim);
      const box2=new THREE.Box3().setFromObject(group);
      group.position.y=-box2.min.y+0.02;
      group.position.x=(Math.random()-0.5)*1.4;
      group.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
      const id='obj_'+(++objSeq);
      const label={relief:'照片浮雕',cutout:'抠图立体',cylinder:'瓶身环绕',card:'立体卡片'}[P3.mode];
      const rec=registerObject({ id, name:label+' · 照片3D', type:'photo3d', group, color:sideColor, material:'custom' });
      rec.photo3d=true;
      selectObject(id);
      setTip(`照片已转为 3D 物体「${rec.name}」，可移动/旋转/缩放`);
      closePhoto3D();
    }catch(err){
      setTip('转换失败：'+(err?.message||'请换一张图片重试'));
    }
  }
  function p3RenderPreview(){
    const cv=document.getElementById('p3Preview'); if(!cv||!P3.ready) return;
    const maxW=340, sc=Math.min(1,maxW/P3.w);
    cv.width=Math.max(1,Math.round(P3.w*sc)); cv.height=Math.max(1,Math.round(P3.h*sc));
    cv.hidden=false;
    const ctx=cv.getContext('2d'); let src=P3.canvas;
    if(P3.mode==='cutout'){
      const th=parseInt(document.getElementById('p3Thresh')?.value||'62',10);
      src=p3MakeCutout(th).out;
      for(let y=0;y<cv.height;y+=16)for(let x=0;x<cv.width;x+=16){ ctx.fillStyle=((x/16+y/16)%2)?'#dfe3ec':'#ffffff'; ctx.fillRect(x,y,16,16); }
    } else if(P3.mode==='relief'){
      const tmp=document.createElement('canvas'); tmp.width=P3.w; tmp.height=P3.h;
      const tc=tmp.getContext('2d'); tc.drawImage(P3.canvas,0,0);
      const d=tc.getImageData(0,0,P3.w,P3.h);
      for(let i=0;i<d.data.length;i+=4){ const l=d.data[i]*.299+d.data[i+1]*.587+d.data[i+2]*.114; d.data[i]=d.data[i+1]=d.data[i+2]=l; }
      tc.putImageData(d,0,0); src=tmp;
    }
    ctx.drawImage(src,0,0,cv.width,cv.height);
    if(P3.mode==='cylinder'){
      ctx.fillStyle='rgba(15,20,36,.75)'; ctx.fillRect(0,cv.height-24,cv.width,24);
      ctx.fillStyle='#fff'; ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('加入影棚后可 360° 旋转查看瓶身',cv.width/2,cv.height-7);
    }
  }
  function openPhoto3D(){ const m=document.getElementById('photo3dModal'); if(m){ m.classList.add('open'); m.setAttribute('aria-hidden','false'); } }
  function closePhoto3D(){ const m=document.getElementById('photo3dModal'); if(m){ m.classList.remove('open'); m.setAttribute('aria-hidden','true'); } }

  /* ---------- 背景控制（纯色 / 渐变 / 图片 / 清除） ---------- */
  let bgTexture = null;          // 当前自定义背景贴图
  let bgGradientCanvas = null;   // 渐变背景画布
  function setBackground(mode) {
    snapshot();
    if (mode === 'image') {
      if (bgTexture) {
        scene.background = bgTexture;
        backdrop.material.map = bgTexture;
        backdrop.material.color.setHex(0xffffff);
        backdrop.material.needsUpdate = true;
        setTip('已切换为图片背景（可点「上传背景图」更换）');
      } else {
        document.getElementById('bgFile')?.click();
        setTip('请选择一张背景图片');
      }
    } else if (mode === 'gradient') {
      const a = document.getElementById('bgColorA')?.value || '#080d18';
      const b = document.getElementById('bgColorB')?.value || '#1a2a4a';
      const cv = document.createElement('canvas'); cv.width = 16; cv.height = 256;
      const cx = cv.getContext('2d');
      const g = cx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, a); g.addColorStop(1, b);
      cx.fillStyle = g; cx.fillRect(0, 0, 16, 256);
      bgGradientCanvas = cv;
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      scene.background = tex;
      backdrop.material.map = null; backdrop.material.color.set(b); backdrop.material.needsUpdate = true;
      setTip('已切换为渐变背景');
    } else { // color
      const a = document.getElementById('bgColorA')?.value || '#080d18';
      scene.background = new THREE.Color(a);
      backdrop.material.map = null; backdrop.material.color.set(a); backdrop.material.needsUpdate = true;
      setTip('已切换为纯色背景');
    }
    document.querySelectorAll('[data-bg]').forEach(x => x.classList.toggle('active', x.dataset.bg === mode));
  }
  function uploadBackground(file) {
    readFileAsURL(file).then(url => {
      new THREE.TextureLoader().load(url, tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        bgTexture = tex;
        scene.background = tex;
        backdrop.material.map = tex;
        backdrop.material.color.setHex(0xffffff);
        backdrop.material.needsUpdate = true;
        document.querySelectorAll('[data-bg]').forEach(x => x.classList.toggle('active', x.dataset.bg === 'image'));
        setTip('已上传并更换影棚背景图片');
      }, undefined, () => setTip('背景加载失败'));
    });
  }
  function clearBackground() {
    snapshot();
    bgTexture = null; bgGradientCanvas = null;
    scene.background = new THREE.Color(0x080d18);
    backdrop.material.map = null; backdrop.material.color.setHex(0x0e1626); backdrop.material.needsUpdate = true;
    const a = document.getElementById('bgColorA'), b = document.getElementById('bgColorB');
    if (a) a.value = '#080d18'; if (b) b.value = '#1a2a4a';
    document.querySelectorAll('[data-bg]').forEach(x => x.classList.toggle('active', x.dataset.bg === 'color'));
    setTip('背景已清除，恢复默认纯色');
  }

  /* ---------- 场景布置方式（重排所有物体） ---------- */
  function arrangeScene(mode) {
    snapshot();
    const objs = [...objects.values()].filter(o => o.group.visible);
    const movable = objs.filter(o => o.id !== 'stand');
    const stand = objects.get('stand');
    if (stand) { stand.group.position.set(0, 0, 0); stand.group.scale.setScalar(1); }
    const y = mode === 'center' ? 1.1 : 0.9;
    if (mode === 'center') {
      movable.forEach((o, i) => {
        if (o.id === 'product') { o.group.position.set(0, 0.4, 0); o.group.scale.setScalar(1.35); }
        else { o.group.position.set((i - 1) * 3.2, y, -1.5); o.group.scale.setScalar(0.7); }
      });
    } else if (mode === 'triangle') {
      const pts = [[0, 0.9, 1.5], [-3, 0.9, -1.5], [3, 0.9, -1.5]];
      movable.forEach((o, i) => { const p = pts[i % 3]; o.group.position.set(...p); o.group.scale.setScalar(1); });
    } else if (mode === 'symmetry') {
      movable.forEach((o, i) => {
        if (o.id === 'product') o.group.position.set(0, 0.4, 0);
        else { const side = i % 2 === 0 ? -1 : 1; const rank = Math.floor(i / 2) + 1; o.group.position.set(side * rank * 2.4, y, 0.5 - rank); o.group.scale.setScalar(1); }
      });
    } else { // scatter
      movable.forEach(o => {
        if (o.id === 'product') o.group.position.set(0, 0.4, 0);
        else o.group.position.set((Math.random() - 0.5) * 9, y + Math.random() * 0.6, (Math.random() - 0.5) * 6 - 1);
      });
    }
    movable.forEach(o => selectionBox.setFromObject(o.group));
    document.querySelectorAll('[data-arrange]').forEach(x => x.classList.toggle('active', x.dataset.arrange === mode));
    updateLights(); evaluate();
    setTip('已按「' + { center: '居中特写', triangle: '三角构图', symmetry: '对称陈列', scatter: '散点布置' }[mode] + '」重新布置场景');
  }

  function clearObjects() {
    snapshot();
    objects.forEach(o => { o.group.visible = false; deletedIds.add(o.id); });
    selectionBox.visible = false;
    selectObject('key');
    renderObjList();
    setTip('已清空全部布景物体（可用撤销恢复，或重新添加/上传）');
  }

  /* ---------------- 视角 / 重置 / 截图 ---------------- */
  let viewTween = null;
  const VIEW_POS = { perspective: [8, 6, 10], front: [0, 4.5, 13], top: [0.01, 15, 0.01] };
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('active', x === b));
    viewTween = { from: camera.position.clone(), to: new THREE.Vector3(...VIEW_POS[b.dataset.view]), t: 0 };
  }));

  function resetScene() {
    snapshot();
    deletedIds.clear();
    // 移除用户后来添加的物体
    [...objects.keys()].forEach(id => {
      if (!defaultObjIds.has(id)) {
        const o = objects.get(id);
        scene.remove(o.group); draggables.splice(draggables.indexOf(o.group), 1); objects.delete(id);
      }
    });
    // 恢复默认物体的变换与可见性
    objects.forEach(o => {
      const d = defaultObjStates[o.id];
      if (d) {
        o.group.position.fromArray(d.pos); o.group.rotation.set(...d.rot); o.group.scale.fromArray(d.scale);
        o.color = d.color; o.name = d.name;
      }
      o.group.visible = true;
    });
    applyPreset('flat');
    setMaterial('metal');
    state.scene = null;
    document.querySelectorAll('.scene-preset').forEach(b => b.classList.remove('active'));
    // 背景恢复
    bgTexture = null; bgGradientCanvas = null;
    scene.background = new THREE.Color(0x080d18);
    backdrop.material.map = null; backdrop.material.color.setHex(0x0e1626); backdrop.material.needsUpdate = true;
    const ca = document.getElementById('bgColorA'), cb = document.getElementById('bgColorB');
    if (ca) ca.value = '#080d18'; if (cb) cb.value = '#1a2a4a';
    document.querySelectorAll('[data-bg]').forEach(x => x.classList.toggle('active', x.dataset.bg === 'color'));
    document.querySelectorAll('[data-arrange]').forEach(x => x.classList.remove('active'));
    // 网格恢复
    grid.visible = true;
    const tg = document.getElementById('toggleGridBtn'); if (tg) tg.textContent = '⊞ 网格：开';
    viewTween = { from: camera.position.clone(), to: new THREE.Vector3(...VIEW_POS.perspective), t: 0 };
    controls.target.set(0, 1.5, 0);
    selectObject('key'); renderObjList(); syncPropInputs();
    setTip('场景已重置为初始布景');
  }

  function snapshotImage() {
    renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = '虚拟影棚布光方案_' + Date.now() + '.png';
    a.click();
    setTip('场景截图已保存');
  }

  /* ---------------- AI 布光参谋 ---------------- */
  let evalTimer = null;
  function scheduleEvaluate() { clearTimeout(evalTimer); evalTimer = setTimeout(evaluate, 120); }
  function evaluate() {
    const key = lights.key, fill = lights.fill, rim = lights.rim;
    let score = 58;
    const tips = [];
    const kp = key.group.position.clone().sub(target.position);
    const horiz = Math.hypot(kp.x, kp.z);
    const elev = Math.atan2(kp.y, horiz) * 180 / Math.PI;
    if (elev < 20) { score -= 14; tips.push('主光位置偏低，易在主体下方形成不自然阴影，建议抬高至约 45°。'); }
    else if (elev > 70) { score -= 8; tips.push('主光接近顶光，立体感偏弱，可适当降低灯位。'); }
    else if (elev >= 30 && elev <= 60) { score += 10; tips.push('主光高度角合理（约 ' + Math.round(elev) + '°），主体立体感良好。'); }
    if (state.ratio >= 1.5 && state.ratio <= 4) score += 8;
    else if (state.ratio > 5) { score -= 12; tips.push('光比偏大，暗部细节可能丢失，建议增加补光或降低主光强度。'); }
    else { score -= 6; tips.push('光比偏小，画面偏平，建议适度拉开主、补光差距以塑造体积感。'); }
    if (Math.abs(key.temp - 5500) <= 1000) score += 6;
    else { score -= 6; tips.push(`主光色温为 ${key.temp}K，偏离常用中性光（约 5500K），画面可能出现明显色偏。`); }
    if (!fill.enabled) { score -= 6; tips.push('补光未开启，阴影区域可能过暗。'); }
    if (rim.enabled) {
      score += 6;
      const rp = rim.group.position.clone().sub(target.position);
      const matLabel = MATERIALS[state.material]?.label || '当前材质';
      if ((state.material === 'glass' || state.material === 'metal') && rp.z < 0) { score += 4; tips.push('轮廓光位于主体后侧，有利于勾勒' + matLabel + '边缘。'); }
      else if ((state.material === 'glass' || state.material === 'metal') && rp.z >= 0) tips.push('拍摄' + matLabel + '时，将轮廓光移至主体后侧，边缘质感会更突出。');
    } else { score -= 6; tips.push('建议开启轮廓光，尤其在表现玻璃与金属材质的边缘时效果明显。'); }
    // 器材维度：对照本场景推荐设备（影室灯/柔光箱/滤光片/灰卡）
    const gearPresent = t => [...objects.values()].some(o => o.type === 'equip' && o.equipType === t && o.group.visible);
    const sceneRec = SCENES[state.scene]?.gear || [];
    if (sceneRec.length) {
      const missing = sceneRec.filter(g => !gearPresent(g));
      if (!missing.length) { score += 4; tips.push('已配备本场景推荐器材（' + sceneRec.map(g => EQUIP_META[g].name).join('、') + '），布光还原度更高。'); }
      else { score -= Math.min(6, missing.length * 2); tips.push('建议从「实训室器材库」补充：' + missing.map(g => EQUIP_META[g].name).join('、') + '，以还原真实实训室设备。'); }
    }
    score = Math.max(35, Math.min(98, Math.round(score)));
    const advice = document.getElementById('aiAdvice');
    if (advice) {
      const sec = (title, arr, color) => arr.length
        ? `<div style="margin-bottom:7px"><b style="color:${color}">${title}</b><br>${arr.slice(0,3).map(t => '• ' + t).join('<br>')}</div>` : '';
      const posTips = tips.filter(t => /光位|灯位|主光|补光|轮廓|阴影|顶光|高度角/.test(t));
      const parTips = tips.filter(t => /光比|色温|强度/.test(t));
      const gearTips = tips.filter(t => /器材|柔光箱|灰卡|滤光片|反光板|影室灯/.test(t));
      advice.innerHTML = (posTips.length || parTips.length || gearTips.length)
        ? sec('灯位与造型', posTips, '#67e8f9') + sec('光比 / 色温', parTips, '#fbbf24') + sec('器材配置', gearTips, '#fb923c') +
          '<div style="margin-top:4px"><b style="color:#c084fc">布光助手质询：</b>请说明当前灯位是为了突出材质的哪一项特征？若客户要求更柔和的调性，你会如何调整？下一课时到真实实训室，你会先核对参数单里的哪一项？</div>'
        : '当前各项参数较为均衡。请进一步思考：如何在预算约束下用最少的灯具获得理想的质感表现？';
    }
    const fillEl = document.getElementById('scoreFill'), valEl = document.getElementById('scoreVal');
    if (fillEl) fillEl.style.width = score + '%';
    if (valEl) valEl.textContent = score;
    state.score = score; state.tips = tips;
  }

  /* ---------------- UI 绑定 ---------------- */
  function syncSlidersFromSelection() {
    const l = isLight(state.selected) ? lights[state.selected] : lights.key;
    const inten = document.getElementById('intensity'), temp = document.getElementById('temp'), ratio = document.getElementById('ratio');
    if (inten) { inten.value = Math.round(l.intensity * 100); document.getElementById('intensityVal').textContent = Math.round(l.intensity * 100) + '%'; }
    if (temp) { temp.value = l.temp; document.getElementById('tempVal').textContent = l.temp + 'K'; }
    if (ratio) { ratio.value = Math.round(state.ratio * 10); document.getElementById('ratioVal').textContent = state.ratio.toFixed(1) + ' : 1'; }
  }
  function syncSwitches() { document.querySelectorAll('[data-toggle]').forEach(cb => { cb.checked = lights[cb.dataset.toggle].enabled; }); }
  function updateModeButtons() { document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === state.mode)); }

  document.querySelectorAll('.light-item').forEach(el => el.addEventListener('click', e => { if (!e.target.closest('.switch')) selectObject(el.dataset.light); }));
  document.querySelectorAll('[data-toggle]').forEach(cb => cb.addEventListener('change', () => { lights[cb.dataset.toggle].enabled = cb.checked; updateLights(); evaluate(); }));
  document.getElementById('intensity')?.addEventListener('input', e => {
    const l = isLight(state.selected) ? lights[state.selected] : lights.key;
    l.intensity = e.target.value / 100; document.getElementById('intensityVal').textContent = e.target.value + '%'; updateLights(); scheduleEvaluate();
  });
  document.getElementById('temp')?.addEventListener('input', e => {
    const l = isLight(state.selected) ? lights[state.selected] : lights.key;
    l.temp = parseInt(e.target.value, 10); document.getElementById('tempVal').textContent = l.temp + 'K'; updateLights(); scheduleEvaluate();
  });
  document.getElementById('ratio')?.addEventListener('input', e => {
    state.ratio = e.target.value / 10; document.getElementById('ratioVal').textContent = state.ratio.toFixed(1) + ' : 1'; updateLights(); scheduleEvaluate();
  });
  document.querySelectorAll('.preset').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  document.querySelectorAll('.material').forEach(b => b.addEventListener('click', () => setMaterial(b.dataset.material)));

  // 变换模式
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
    state.mode = b.dataset.mode; updateModeButtons();
    const obj = currentObject();
    setTip(obj ? `已切换为${modeLabel()}模式 · 拖拽「${obj.name}」即可${modeLabel()}` : `已切换为${modeLabel()}模式 · 请先选中布景物体`);
  }));
  // 添加几何体
  document.querySelectorAll('[data-shape]').forEach(b => b.addEventListener('click', () => addObject(b.dataset.shape)));
  // 物体属性输入
  function bindNum(id, apply) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      const obj = currentObject();
      if (!obj) { setTip('请先选中一个布景物体'); return; }
      snapshot(); apply(obj, parseFloat(el.value) || 0);
      selectionBox.setFromObject(obj.group); updateLights(); evaluate();
    });
  }
  bindNum('posX', (o, v) => o.group.position.x = THREE.MathUtils.clamp(v, -8, 8));
  bindNum('posY', (o, v) => o.group.position.y = THREE.MathUtils.clamp(v, 0, 8));
  bindNum('posZ', (o, v) => o.group.position.z = THREE.MathUtils.clamp(v, -8, 8));
  bindNum('rotY', (o, v) => o.group.rotation.y = THREE.MathUtils.degToRad(v));
  bindNum('scaleVal', (o, v) => o.group.scale.setScalar(THREE.MathUtils.clamp(v, 0.15, 5)));
  document.getElementById('objColor')?.addEventListener('input', e => { const o = currentObject(); if (o) { o.color = e.target.value; applyColorToObject(o); } });
  document.getElementById('objName')?.addEventListener('change', e => { const o = currentObject(); if (o) { o.name = e.target.value.trim() || o.name; renderObjList(); syncPropInputs(); } });
  document.getElementById('duplicateObjBtn')?.addEventListener('click', duplicateSelected);
  document.getElementById('deleteObjBtn')?.addEventListener('click', deleteSelected);
  document.getElementById('hideObjBtn')?.addEventListener('click', hideSelected);
  document.getElementById('undoBtn')?.addEventListener('click', undo);
  document.getElementById('resetView')?.addEventListener('click', resetScene);
  document.getElementById('snapshotBtn')?.addEventListener('click', snapshotImage);

  // 上传按钮
  document.getElementById('uploadModelBtn')?.addEventListener('click', () => document.getElementById('modelFile')?.click());
  document.getElementById('uploadTexBtn')?.addEventListener('click', () => document.getElementById('texFile')?.click());
  document.getElementById('uploadBgBtn')?.addEventListener('click', () => { setBackground('image'); });
  document.getElementById('uploadBgBtnTop')?.addEventListener('click', () => document.getElementById('bgFile')?.click());
  document.getElementById('uploadPosterBtn')?.addEventListener('click', () => document.getElementById('posterFile')?.click());

  // 场景背景与布置
  document.querySelectorAll('[data-bg]').forEach(b => b.addEventListener('click', () => setBackground(b.dataset.bg)));
  document.getElementById('bgColorA')?.addEventListener('input', () => {
    if (document.querySelector('[data-bg].active')?.dataset.bg !== 'gradient') setBackground('color');
    else setBackground('gradient');
  });
  document.getElementById('bgColorB')?.addEventListener('input', () => setBackground('gradient'));
  document.getElementById('clearBgBtn')?.addEventListener('click', clearBackground);
  document.querySelectorAll('[data-arrange]').forEach(b => b.addEventListener('click', () => arrangeScene(b.dataset.arrange)));
  document.getElementById('clearObjectsBtn')?.addEventListener('click', clearObjects);
  document.getElementById('restoreSceneBtn')?.addEventListener('click', resetScene);
  document.getElementById('toggleGridBtn')?.addEventListener('click', e => {
    grid.visible = !grid.visible;
    e.currentTarget.textContent = grid.visible ? '⊞ 网格：开' : '⊞ 网格：关';
    setTip(grid.visible ? '参考网格已显示' : '参考网格已隐藏');
  });
  document.getElementById('modelFile')?.addEventListener('change', e => { if (e.target.files[0]) uploadModel(e.target.files[0]); e.target.value = ''; });
  document.getElementById('texFile')?.addEventListener('change', e => { if (e.target.files[0]) uploadTexture(e.target.files[0]); e.target.value = ''; });
  document.getElementById('bgFile')?.addEventListener('change', e => { if (e.target.files[0]) uploadBackground(e.target.files[0]); e.target.value = ''; });
  document.getElementById('posterFile')?.addEventListener('change', e => { if (e.target.files[0]) uploadPoster(e.target.files[0]); e.target.value = ''; });
  /* ---- 照片转 3D 事件 ---- */
  const p3Input=document.getElementById('photo3dFile');
  document.getElementById('photo3dBtn')?.addEventListener('click',openPhoto3D);
  document.querySelectorAll('[data-p3close]').forEach(el=>el.addEventListener('click',closePhoto3D));
  const p3Drop=document.getElementById('p3Drop');
  p3Drop?.addEventListener('click',()=>p3Input?.click());
  ['dragenter','dragover'].forEach(ev=>p3Drop?.addEventListener(ev,e=>{ e.preventDefault(); p3Drop.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev=>p3Drop?.addEventListener(ev,e=>{ e.preventDefault(); p3Drop.classList.remove('drag'); }));
  p3Drop?.addEventListener('drop',e=>{ const f=e.dataTransfer?.files?.[0]; if(f&&f.type.startsWith('image/')) handlePhoto3DFile(f); else setTip('请拖入图片文件'); });
  p3Input?.addEventListener('change',e=>{ const f=e.target.files?.[0]; if(f) handlePhoto3DFile(f); e.target.value=''; });
  async function handlePhoto3DFile(f){
    const tip=document.getElementById('p3Tip');
    try{
      if(tip)tip.textContent='正在读取照片…';
      const img=await p3LoadImage(f);
      p3Prepare(img); P3.ready=true;
      document.getElementById('p3AddBtn')?.removeAttribute('disabled');
      document.getElementById('p3DropInner')?.setAttribute('hidden','');
      p3RenderPreview();
      if(tip)tip.textContent=`已载入 ${P3.w}×${P3.h} 照片 · 选择模式后点「加入影棚」`;
    }catch(err){ if(tip)tip.textContent='照片读取失败，请换一张重试'; }
  }
  document.querySelectorAll('[data-p3mode]').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('[data-p3mode]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); P3.mode=b.dataset.p3mode;
    const row=document.getElementById('p3ThreshRow'); if(row) row.style.display=(P3.mode==='cutout')?'':'none';
    p3RenderPreview();
  }));
  document.getElementById('p3Depth')?.addEventListener('input',e=>{
    const o=document.getElementById('p3DepthVal'); if(o)o.textContent=(e.target.value/100).toFixed(2);
  });
  document.getElementById('p3Thresh')?.addEventListener('input',e=>{
    const o=document.getElementById('p3ThreshVal'); if(o)o.textContent=e.target.value; p3RenderPreview();
  });
  document.getElementById('p3Side')?.addEventListener('input',()=>{});
  document.getElementById('p3AddBtn')?.addEventListener('click',p3AddToScene);


  /* ---------------- 标准布光图 + 参数单导出 ---------------- */
  const modal = document.getElementById('reportModal');
  const reportBody = document.getElementById('reportBody');
  let reportText = '';

  // 绘制俯视标准布光图：相机、主体、三灯位、实训室器材与参数标注
  function drawLightingDiagram(canvas) {
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W * 0.5, cy = H * 0.47, S = 21;
    const px = x => cx + x * S, py = z => cy + z * S;

    c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#0d3b8f'; c.fillRect(0, 0, W, 44);
    c.fillStyle = '#fff'; c.font = 'bold 17px "PingFang SC", sans-serif'; c.textAlign = 'left';
    c.fillText('标准布光图 · 俯视示意', 16, 28);
    c.font = '11px sans-serif'; c.textAlign = 'right'; c.fillStyle = '#bcd6f5';
    c.fillText('LIGHTING PLAN · ' + (SCENES[state.scene]?.label || '自由布光'), W - 14, 27);

    c.strokeStyle = '#cbd5e1'; c.lineWidth = 1.5; c.setLineDash([6, 5]);
    c.beginPath(); c.arc(cx, cy, 6.4 * S, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#f1f5f9'; c.lineWidth = 1;
    for (let i = -6; i <= 6; i++) {
      c.beginPath(); c.moveTo(px(i), py(-6)); c.lineTo(px(i), py(6)); c.stroke();
      c.beginPath(); c.moveTo(px(-6), py(i)); c.lineTo(px(6), py(i)); c.stroke();
    }

    c.fillStyle = '#1e293b'; c.beginPath(); c.arc(cx, cy, 20, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText('主体', cx, cy + 4);

    const cmY = cy + 5.2 * S;
    c.fillStyle = '#0f172a'; c.fillRect(cx - 26, cmY - 8, 52, 18);
    c.fillStyle = '#fff'; c.font = '11px sans-serif'; c.fillText('相机 CAM', cx, cmY + 5);
    c.strokeStyle = '#94a3b8'; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(cx, cy + 22); c.lineTo(cx, cmY - 10); c.stroke(); c.setLineDash([]);

    const lampDefs = [
      { k: 'key', tag: 'K1', color: '#f59e0b' },
      { k: 'fill', tag: 'F2', color: '#38bdf8' },
      { k: 'rim', tag: 'R3', color: '#a855f7' },
    ];
    lampDefs.forEach(d => {
      const l = lights[d.k];
      const X = px(THREE.MathUtils.clamp(l.group.position.x, -6.2, 6.2));
      const Y = py(THREE.MathUtils.clamp(l.group.position.z, -6.2, 6.2));
      c.strokeStyle = l.enabled ? d.color : '#cbd5e1'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(X, Y); c.lineTo(cx, cy); c.stroke();
      const ang = Math.atan2(cy - Y, cx - X);
      c.fillStyle = l.enabled ? d.color : '#cbd5e1';
      c.beginPath();
      c.moveTo(cx - Math.cos(ang) * 22, cy - Math.sin(ang) * 22);
      c.lineTo(cx - Math.cos(ang - 0.4) * 12, cy - Math.sin(ang - 0.4) * 12);
      c.lineTo(cx - Math.cos(ang + 0.4) * 12, cy - Math.sin(ang + 0.4) * 12);
      c.fill();
      c.fillStyle = l.enabled ? d.color : '#e2e8f0'; c.strokeStyle = l.enabled ? d.color : '#94a3b8'; c.lineWidth = 2;
      c.beginPath(); c.arc(X, Y, 13, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = l.enabled ? '#fff' : '#64748b'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center';
      c.fillText(d.tag, X, Y + 4);
      c.fillStyle = l.enabled ? '#1e293b' : '#94a3b8'; c.font = '10px sans-serif';
      c.fillText(l.enabled ? Math.round(l.intensity * 100) + '% · ' + l.temp + 'K' : '关闭', X, Y + 28);
    });

    [...objects.values()].filter(o => o.type === 'equip' && o.group.visible).forEach(o => {
      const X = px(THREE.MathUtils.clamp(o.group.position.x, -6.2, 6.2));
      const Y = py(THREE.MathUtils.clamp(o.group.position.z, -6.2, 6.2));
      c.fillStyle = '#0ea5e9'; c.fillRect(X - 6, Y - 6, 12, 12);
      c.fillStyle = '#0369a1'; c.font = '9px sans-serif'; c.textAlign = 'center';
      c.fillText((EQUIP_META[o.equipType]?.name || '器材').slice(0, 4), X, Y + 19);
    });

    c.fillStyle = '#64748b'; c.font = '10px sans-serif'; c.textAlign = 'left';
    c.fillText('图例：K1 主光 / F2 补光 / R3 轮廓光 · 蓝块为实训室器材', 16, H - 38);
    c.fillStyle = '#f8fafc'; c.fillRect(0, H - 30, W, 30);
    c.strokeStyle = '#e2e8f0'; c.beginPath(); c.moveTo(0, H - 30); c.lineTo(W, H - 30); c.stroke();
    c.fillStyle = '#334155'; c.font = '11px sans-serif'; c.textAlign = 'left';
    c.fillText('场景：' + (SCENES[state.scene]?.label || '自由布光') + '   预设：' + (PRESETS[state.preset]?.label || '自定义') +
      '   光比：' + state.ratio.toFixed(1) + ':1   色温：' + lights.key.temp + 'K   材质：' + (MATERIALS[state.material]?.label || '自定义') +
      '   评分：' + (state.score || '--'), 14, H - 11);
    c.textAlign = 'right'; c.fillStyle = '#0d3b8f';
    c.fillText('曝光参考 f/8 · 1/125s · ISO100 · 50mm', W - 14, H - 11);
  }

  function buildReport() {
    const p = v => `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)})`;
    const rows = Object.values(lights).map(l => `<tr><td>${LIGHT_META[l.key].name}</td><td>${l.enabled ? p(l.group.position) : '已关闭'}</td><td>${Math.round(l.intensity * 100)}% · ${l.temp}K</td></tr>`).join('');
    const objRows = [...objects.values()].filter(o => o.group.visible).map(o => `<tr><td>${o.name}</td><td>${p(o.group.position)}</td><td>${o.type === 'product' ? (MATERIALS[state.material]?.label || '自定义') : '自定义布景'}</td></tr>`).join('');
    const gearList = [...objects.values()].filter(o => o.type === 'equip' && o.group.visible).map(o => o.name);
    reportText = [
      'AIGC辅助的商业广告创意与拍摄制作虚拟仿真实验',
      '标准布光图 / 布光参数单 / 拍摄作业单',
      '============================================',
      `拍摄场景：${SCENES[state.scene]?.label || '自由布光'}`,
      `拍摄对象材质：${MATERIALS[state.material]?.label || '自定义'}`,
      `布光预设：${PRESETS[state.preset]?.label || '自定义'}`,
      `光比（主:补）：${state.ratio.toFixed(1)} : 1`,
      `布光助手评分：${state.score || '--'} / 100`,
      `实训室器材：${gearList.length ? gearList.join('、') : '未添加（可从器材库补充）'}`,
      '', '灯具参数（场景坐标）：',
      ...Object.values(lights).map(l => `  ${LIGHT_META[l.key].name}：${l.enabled ? `位置 ${p(l.group.position)}，强度 ${Math.round(l.intensity * 100)}%，色温 ${l.temp}K` : '已关闭'}`),
      '', '布景物体（场景坐标）：',
      ...[...objects.values()].filter(o => o.group.visible).map(o => `  ${o.name}：位置 ${p(o.group.position)}，缩放 ${o.group.scale.x.toFixed(2)}`),
      '', '标准布光图：见随单俯视图（K1 主光 / F2 补光 / R3 轮廓光 / 蓝块为实训室器材）',
      '', '参考曝光参数（模拟）：光圈 f/8 · 快门 1/125s · ISO 100 · 焦距 50mm',
      '', '布光助手建议：', ...(state.tips || []).map(t => '  - ' + t),
      '', '质询追问：请说明灯位选择依据与材质表现取舍理由。',
      '', '【下一课时】请将本参数单打印或抄录下来，在摄影摄像实训室按此灯位、光比、色温与器材清单完成实拍验证。',
      '说明：本参数单由浏览器端虚拟仿真实验生成，供摄影摄像实训室实拍验证参考。',
    ].join('\n');
    const equipRows = [...objects.values()].filter(o => o.type === 'equip' && o.group.visible)
      .map(o => `<tr><td>${o.name}</td><td>${p(o.group.position)}</td><td>实训室还原设备</td></tr>`).join('');
    if (reportBody) reportBody.innerHTML = `
      <div class="report-diagram-wrap">
        <div class="rd-title">标准布光图 · 俯视示意 / LIGHTING PLAN</div>
        <canvas id="reportDiagram" width="640" height="420" aria-label="标准布光俯视图：标注相机、主体、三盏灯位与实训室器材"></canvas>
        <div class="rd-actions no-print"><button class="tool-btn" id="downloadDiagram">⬇ 下载布光图 PNG</button></div>
      </div>
      <h4>项目信息</h4>
      <table class="report-table">
        <tr><td>项目名称</td><td>AIGC辅助的商业广告创意与拍摄制作虚拟仿真实验</td></tr>
        <tr><td>对应步骤</td><td>步骤 9—13 · 虚拟影棚布光与参数输出</td></tr>
        <tr><td>拍摄场景</td><td>${SCENES[state.scene]?.label || '自由布光'}</td></tr>
        <tr><td>拍摄对象材质</td><td>${MATERIALS[state.material]?.label || '自定义'}</td></tr>
        <tr><td>布光预设</td><td>${PRESETS[state.preset]?.label || '自定义'}</td></tr>
        <tr><td>光比（主:补）</td><td>${state.ratio.toFixed(1)} : 1</td></tr>
        <tr><td>布光助手评分</td><td>${state.score || '--'} / 100</td></tr>
      </table>
      <h4>灯具布置（场景坐标）</h4>
      <table class="report-table"><tr><td>灯具</td><td>位置</td><td>强度 / 色温</td></tr>${rows}</table>
      <h4>实训室器材清单（1:1 还原）</h4>
      <table class="report-table"><tr><td>器材</td><td>位置</td><td>说明</td></tr>${equipRows || '<tr><td colspan="3">未添加器材 · 可从「实训室器材库」补充</td></tr>'}</table>
      <h4>布景物体（可移至实训室还原）</h4>
      <table class="report-table"><tr><td>物体</td><td>位置</td><td>类型</td></tr>${objRows}</table>
      <h4>参考曝光参数（模拟）</h4>
      <table class="report-table"><tr><td>光圈 / 快门</td><td>f/8 · 1/125s</td></tr><tr><td>ISO / 焦距</td><td>100 · 50mm</td></tr></table>
      <div class="report-note">${state.tips?.length ? state.tips.map(t => '• ' + t).join('<br>') : '• 各项参数较均衡，请说明取舍理由。'}<br><br><b>质询追问：</b>请说明你选择当前灯位是为了突出材质的哪一项特征？<br><br><b style="color:#0d3b8f">下一课时：</b>请打印或抄录本参数单，在摄影摄像实训室按此灯位、光比、色温与器材清单完成实拍验证。</div>`;
    drawLightingDiagram(document.getElementById('reportDiagram'));
    modal?.classList.add('open'); modal?.setAttribute('aria-hidden', 'false');
  }
  // 商业拍摄场景 / 实训室器材库
  document.querySelectorAll('.scene-preset').forEach(b => b.addEventListener('click', () => applyScene(b.dataset.scene)));
  document.querySelectorAll('.equip-btn').forEach(b => b.addEventListener('click', () => addEquipment(b.dataset.equip)));
  document.getElementById('exportTopBtn')?.addEventListener('click', buildReport);
  document.getElementById('diagramBtn')?.addEventListener('click', () => {
    const cv = document.createElement('canvas'); cv.width = 640; cv.height = 420;
    drawLightingDiagram(cv);
    const a = document.createElement('a'); a.href = cv.toDataURL('image/png');
    a.download = '标准布光图_' + Date.now() + '.png'; a.click();
    setTip('标准布光图已下载，可随参数单打印');
  });

  document.getElementById('exportBtn')?.addEventListener('click', buildReport);
  modal?.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }));
  document.getElementById('downloadReport')?.addEventListener('click', () => {
    const blob = new Blob(['\ufeff' + reportText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = '布光参数单_' + (SCENES[state.scene]?.label || PRESETS[state.preset]?.label || '自定义') + '.txt';
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  document.getElementById('printReport')?.addEventListener('click', () => window.print());
  document.getElementById('copyReport')?.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(reportText); ok = true; } catch (e) { ok = false; }
    if (!ok) {
      const ta = document.createElement('textarea'); ta.value = reportText;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta);
      ta.select(); try { ok = document.execCommand('copy'); } catch (e) { ok = false; } ta.remove();
    }
    setTip(ok ? '参数单文本已复制，可直接粘贴抄录' : '复制失败，请手动选取文本抄录');
  });
  // 弹窗内动态生成的「下载布光图」按钮（事件委托）
  modal?.addEventListener('click', e => {
    if (!e.target.closest('#downloadDiagram')) return;
    const cv = document.getElementById('reportDiagram');
    if (!cv) return;
    const a = document.createElement('a'); a.href = cv.toDataURL('image/png');
    a.download = '标准布光图_' + (SCENES[state.scene]?.label || '方案') + '.png'; a.click();
    setTip('标准布光图已下载');
  });

  /* ---------------- 尺寸 / 渲染循环 ---------------- */
  function resize() {
    const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (viewTween) {
      viewTween.t = Math.min(viewTween.t + 0.045, 1);
      const e = 1 - Math.pow(1 - viewTween.t, 3);
      camera.position.lerpVectors(viewTween.from, viewTween.to, e);
      if (viewTween.t >= 1) viewTween = null;
    }
    Object.values(lights).forEach(l => l.group.lookAt(target.position));
    if (state.selected !== 'key' && !isLight(state.selected)) {
      const obj = objects.get(state.selected);
      if (obj && obj.group.visible) selectionBox.setFromObject(obj.group);
    }
    const sel = isLight(state.selected) ? lights[state.selected] : null;
    if (sel) sel.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
    controls.update();
    renderer.render(scene, camera);
  }

  updateLights(); renderObjList(); syncPropInputs(); syncSlidersFromSelection(); updateModeButtons(); evaluate(); animate();
  if (loading) loading.classList.add('hide');
}

/* ---------- 色温(K) → RGB ---------- */
function kelvinToRGB(kelvin) {
  const temp = kelvin / 100;
  let r, g, b;
  if (temp <= 66) { r = 255; g = 99.4708025861 * Math.log(temp) - 161.1195681661; }
  else { r = 329.698727446 * Math.pow(temp - 60, -0.1332047592); g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492); }
  if (temp >= 66) b = 255;
  else if (temp <= 19) b = 0;
  else b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  const c = v => Math.max(0, Math.min(255, Math.round(v))) / 255;
  return new THREE.Color(c(r), c(g), c(b));
}
