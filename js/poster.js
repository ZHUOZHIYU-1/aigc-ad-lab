/* ============================================================
   AIGC 商业海报工坊 · 指令驱动多版式引擎 v5
   ------------------------------------------------------------
   · 无限字数指令，按「字段标签边界」完整提取文案（不被逗号截断）
   · 7 维识别：场景 / 风格 / 构图 / 字体 / 配色 / 氛围 / 元素
   · 8 种结构不同的版式渲染器，价格 / 按钮 / 卖点全部可视化
   ============================================================ */

/* ---------------- 配色板 ---------------- */
const PALETTES = {
  tech:     { name:'科技蓝', bg:['#050b1e','#0b1c3f','#123a72'], accent:'#3ddcff', accent2:'#6d8bff', text:'#ffffff', sub:'#a8c8ff', surface:'rgba(255,255,255,.06)', line:'rgba(61,220,255,.35)', dark:true },
  luxury:   { name:'奢华黑金', bg:['#0a0a09','#181511','#2a2318'], accent:'#e3c17a', accent2:'#f6e6ba', text:'#fff6e0', sub:'#cbb079', surface:'rgba(227,193,122,.08)', line:'rgba(227,193,122,.4)', dark:true },
  fresh:    { name:'清新自然', bg:['#fbfcf6','#eef4e6','#dfead2'], accent:'#4c7a3d', accent2:'#8fb473', text:'#263a2a', sub:'#62805d', surface:'rgba(76,122,61,.07)', line:'rgba(76,122,61,.28)', dark:false },
  energy:   { name:'活力橙', bg:['#fff3e8','#ffdfc4','#ffc79b'], accent:'#e5480c', accent2:'#ff8a3d', text:'#4a1c05', sub:'#a4471a', surface:'rgba(229,72,12,.08)', line:'rgba(229,72,12,.3)', dark:false },
  minimal:  { name:'极简黑白', bg:['#fcfcfa','#f3f3ef','#e8e8e2'], accent:'#1a1a1a', accent2:'#5a5a5a', text:'#111111', sub:'#6b6b6b', surface:'rgba(0,0,0,.04)', line:'rgba(0,0,0,.18)', dark:false },
  dream:    { name:'梦幻紫', bg:['#f6f0ff','#e9ddff','#d8c6ff'], accent:'#6d3bd1', accent2:'#b07ce8', text:'#2f1d52', sub:'#7555a8', surface:'rgba(109,59,209,.08)', line:'rgba(109,59,209,.3)', dark:false },
  retro:    { name:'复古怀旧', bg:['#efe3c8','#e3d0ad','#d1b98f'], accent:'#8b3a2e', accent2:'#c46b4a', text:'#3a2a1c', sub:'#7a5a3c', surface:'rgba(139,58,46,.08)', line:'rgba(139,58,46,.3)', dark:false },
  guochao:  { name:'中国红', bg:['#fdf3ef','#f8ddd4','#f0c4b5'], accent:'#b21c16', accent2:'#d94532', text:'#4a100c', sub:'#9c3a2c', surface:'rgba(178,28,22,.08)', line:'rgba(178,28,22,.3)', dark:false },
  ink:      { name:'水墨', bg:['#f5f2e9','#ebe5d7','#ded6c4'], accent:'#2b2b2b', accent2:'#6b6b6b', text:'#1f1f1f', sub:'#5a5a5a', surface:'rgba(0,0,0,.04)', line:'rgba(0,0,0,.16)', dark:false },
  candy:    { name:'甜美粉', bg:['#fff5f8','#ffe3ec','#ffc9dc'], accent:'#d62e6a', accent2:'#f279a4', text:'#5a2338', sub:'#a04a6c', surface:'rgba(214,46,106,.08)', line:'rgba(214,46,106,.28)', dark:false },
};

const LAYOUTS = {
  portrait:  { w:1080, h:1440 },
  square:    { w:1080, h:1080 },
  landscape: { w:1600, h:900 },
};

const SCENE_KB = {
  wedding:  ['婚礼','婚庆','喜帖','请柬','结婚','新人','囍','婚宴','婚纱','喜糖'],
  food:     ['美食','餐饮','蛋糕','咖啡','奶茶','甜品','食品','餐厅','菜单','面包','冰淇淋','火锅','月饼','抹茶','甜点','饮品'],
  sale:     ['促销','打折','折扣','特惠','秒杀','双11','双十一','618','满减','低价','优惠','清仓','狂欢','限时','钜惠'],
  tech:     ['科技','数码','智能','电子','芯片','机器人','发布会','新品发布','AI','数字','创新'],
  music:    ['音乐','演唱会','音乐节','专辑','乐队','歌手','live','Live','电音'],
  movie:    ['电影','影讯','上映','首映','导演','主演','影院','大片'],
  travel:   ['旅行','旅游','景区','度假','风景','机票','酒店','出游','景点','露营'],
  recruit:  ['招聘','招募','求职','岗位','校招','社招','加入我们','人才'],
  art:      ['展览','艺术','画展','博物馆','艺术节','展讯','画廊','非遗'],
  fashion:  ['时尚','服饰','服装','穿搭','潮流','时装','鞋','包'],
  beauty:   ['美妆','护肤','化妆品','口红','香水','面膜','彩妆','精华'],
  auto:     ['汽车','新车','车展','车型','越野','电动车'],
  game:     ['游戏','电竞','网游','手游','对战','赛事'],
  edu:      ['教育','培训','课程','开学','讲座','招生','毕业','学校','学习'],
  realestate:['房产','楼盘','开盘','买房','地产','别墅','公寓'],
 公益:      ['公益','环保','倡导','低碳','植树','保护','慈善','志愿服务'],
};

const STYLE_KB = {
  luxury:   { p:'luxury', kw:['奢华','黑金','高端','尊贵','典藏','豪华','轻奢','臻选','奢侈','贵气'] },
  fresh:    { p:'fresh',  kw:['清新','自然','日系','森系','抹茶','治愈','文艺','绿色','氧气','田园'] },
  tech:     { p:'tech',   kw:['科技感','科技','未来','赛博','金属','极客','智能','蓝色','数字'] },
  energy:   { p:'energy', kw:['活力','运动','热情','燃','爆炸','橙色','激情','劲爆'] },
  minimal:  { p:'minimal',kw:['极简','简约','性冷淡','留白','黑白','高级','克制','干净'] },
  dream:    { p:'dream',  kw:['梦幻','浪漫','紫','少女','星空','唯美','仙气'] },
  retro:    { p:'retro',  kw:['复古','怀旧','民国','港风','胶片','做旧','老上海','年代感'] },
  guochao:  { p:'guochao',kw:['国潮','中国风','中式','古典','喜庆','红火','传统','新年'] },
  ink:      { p:'ink',    kw:['水墨','书法','禅意','古风','墨色','宣纸','写意'] },
  candy:    { p:'candy',  kw:['甜美','可爱','糖果','粉色','萌','少女心','俏皮'] },
};

const COMP_KB = {
  magazine:  ['杂志','封面','刊物','期刊','杂志风'],
  bold:      ['大字报','撞色','促销风','爆炸','醒目','冲击力','视觉冲击'],
  minimal:   ['极简','留白','简约','性冷淡'],
  ticket:    ['票','券','门票','车票','登机牌','入场券'],
  split:     ['左右','分栏','对开','左图右文','左文右图'],
  center:    ['居中','对称','仪式','庄重','经典'],
  editorial: ['网格','内页','排版','多栏','画册','杂志内页'],
  poster:    ['招贴','海报','宣传画'],
};

const SCENE_DEFAULT = {
  wedding:    { comp:'center',    font:'hand',  elems:['date','seal'] },
  food:       { comp:'magazine',  font:'serif', elems:['price','badge'] },
  sale:       { comp:'bold',      font:'bold',  elems:['price','badge','barcode'] },
  tech:       { comp:'split',     font:'bold',  elems:['barcode','date'] },
  music:      { comp:'ticket',    font:'bold',  elems:['date','barcode'] },
  movie:      { comp:'poster',    font:'serif', elems:['date','credit','badge'] },
  travel:     { comp:'editorial', font:'serif', elems:['date','badge'] },
  recruit:    { comp:'split',     font:'bold',  elems:['qr','contact'] },
  art:        { comp:'minimal',   font:'serif', elems:['date','seal'] },
  fashion:    { comp:'magazine',  font:'serif', elems:['barcode','price'] },
  beauty:     { comp:'center',    font:'serif', elems:['badge','price'] },
  auto:       { comp:'poster',    font:'bold',  elems:['price','date'] },
  game:       { comp:'bold',      font:'bold',  elems:['date','barcode'] },
  edu:        { comp:'editorial', font:'serif', elems:['date','qr'] },
  realestate: { comp:'bold',      font:'serif', elems:['price','contact'] },
 公益:        { comp:'poster',    font:'bold',  elems:['qr','contact'] },
};

const COLOR_KB = {
  '中国红':'#c1272d','红色':'#d92b2b','大红':'#e02626','金色':'#d4af37','黑金':'#1a1710',
  '科技蓝':'#2563eb','蓝色':'#2563eb','深蓝':'#1e3a8a','青色':'#06b6d4','绿色':'#4d8b3a',
  '抹茶绿':'#7a9c4b','森绿':'#2f6b3a','粉色':'#ec4899','樱花粉':'#f7a8c4','紫色':'#8b5cf6',
  '橙色':'#f97316','橘色':'#fb923c','黄色':'#eab308','黑色':'#1a1a1a','白色':'#f5f5f0',
  '米白':'#f7f3ea','灰色':'#9ca3af','卡其':'#b89a6e','墨色':'#2b2b2b','香槟':'#e8d5a8',
};

const FEATURE_WORDS = ['抹茶','慕斯','蛋糕','奶油','覆盆子','车厘子','草莓','蓝莓','芒果','提拉米苏','咖啡','巧克力','香草','柠檬','蜜桃','玫瑰','茉莉','开心果','椰子','燕麦','酸奶','芝士','布丁','泡芙','丝滑','浓郁','醇香','低糖','新鲜','手作'];

// 光影 / 材质 / 背景 / 构图锚点 知识库
const LIGHT_KB = {
  soft:  ['柔光','柔和','自然光','散射','暖光','黄昏','暖调'],
  hard:  ['硬光','强烈','硬朗','锐利','直射','高反差','戏剧'],
  rim:   ['逆光','轮廓光','侧逆光','背光','光晕'],
  side:  ['侧光','伦勃朗','45度','三角光'],
  neon:  ['霓虹','赛博','夜景','荧光','发光','镭射'],
  studio:['棚拍','影棚','影室','专业布光','柔光箱'],
};
const TEXTURE_KB = {
  matte:  ['磨砂','哑光','雾面','绒面'],
  glossy: ['亮面','镜面','高光','釉面','光泽'],
  metal:  ['金属','拉丝','拉丝金','不锈钢','镀铬','铝'],
  glass:  ['玻璃','透明','水晶','亚克力'],
  paper:  ['纸质','纸纹','卡纸','牛皮纸','宣纸'],
  fabric: ['布纹','亚麻','丝绸','绸缎','织物'],
  nature: ['木纹','原木','大理石','石纹','水泥','肌理'],
};
const BG_KB = {
  color:  ['纯色','单色','实色'],
  gradient:['渐变','渐变色','晕染'],
  texture:['肌理','纹理','颗粒','磨砂背景'],
  scene:  ['简约场景','场景','实景','空间','背景场景','棚内'],
  lowsat: ['低饱和','莫兰迪','雾面','灰调','柔和底色','高级灰'],
};
const ANCHOR_KB = {
  LT:'左上', RT:'右上', LB:'左下', RB:'右下',
  LC:'左侧', RC:'右侧', CT:'顶部', CB:'底部',
  GOLDEN:'黄金分割', DIAG:'对角', CENTER:'居中',
};
// 指令中的落点词 → 锚点
const ANCHOR_WORDS = [
  ['LT', /左上|左上方|左上角|upper.?left/i],
  ['RT', /右上|右上方|右上角|upper.?right/i],
  ['LB', /左下|左下方|左下角|lower.?left/i],
  ['RB', /右下|右下方|右下角|lower.?right/i],
  ['LC', /左侧|靠左|画面左边|左边|left.?side/i],
  ['RC', /右侧|靠右|画面右边|右边|right.?side/i],
  ['CT', /顶部|靠上|画面上方|上方|top/i],
  ['CB', /底部|靠下|画面下方|下方|bottom/i],
  ['GOLDEN', /黄金分割|三分|golden/i],
  ['DIAG', /对角|对角线|斜向|diagonal/i],
  ['CENTER', /居中|正中|画面中央|中心|center/i],
];

const INSPIRATIONS = [
  { scene:'food',  style:'fresh',  prompt:'日系清新美食海报，杂志封面排版，柔和自然光，标题「一口清新」，副标题：自然之味 纯净每一刻，品牌：VERDANT，价格：¥38，按钮：即刻品尝' },
  { scene:'sale',  style:'energy', prompt:'活力橙促销大字报，撞色冲击，标题「限时狂欢」，副标题：全场低至五折 错过再等一年，品牌：VOLT，价格：99，按钮：马上抢购' },
  { scene:'wedding', style:'guochao', prompt:'中式婚礼请柬，手写书法，居中对称，标题「喜结良缘」，副标题：谨定于良辰吉日 敬邀亲友共鉴，品牌：囍，日期：2026.05.20，按钮：敬请光临' },
  { scene:'tech', style:'tech', prompt:'科技感蓝色发布会海报，左右分栏，标题「重新定义」，副标题：AIGC 赋能智能创作新体验，品牌：NEXA，价格：¥2999，日期：2026.09.18，按钮：立即探索' },
  { scene:'art', style:'ink', prompt:'水墨极简艺术展海报，留白，标题「墨韵」，副标题：一场东方美学的当代回响，品牌：ART MUSEUM，日期：2026.10.01，按钮：预约观展' },
  { scene:'music', style:'dream', prompt:'票券风格音乐节海报，标题「星河共振」，副标题：当音符遇见璀璨星海，品牌：LUMINA FEST，价格：¥280，日期：2026.08.15，按钮：立即购票' },
];

export function initPoster() {
  const preview = document.getElementById('posterCanvas');
  if (!preview) return;
  const ctx = preview.getContext('2d');
  if (!ctx) return;

  const state = {
    image:null, theme:'fresh', layout:'portrait',
    title:'一口清新', subtitle:'自然之味 纯净每一刻', brand:'VERDANT',
    cta:'即刻品尝', tag:'FRESH SELECTION · 2026', price:'38', date:'2026.05.20',
    decor:{ glow:true, grid:true, card:true, badge:true },
    smartColor:true, extracted:null, genSalt:0,
    scene:null, style:null, comp:null, font:null, mood:null, elems:[], colorHex:null,
  };

  const $ = id => document.getElementById(id);
  const fileInput=$('productImage'), dropZone=$('dropZone'), promptInput=$('posterPrompt');
  const genBtn=$('genPosterBtn'), downloadBtn=$('downloadPosterBtn');
  const thumb=$('productThumb'), fileName=$('productFileName'), smartToggle=$('smartColorToggle');

  /* ===== 颜色工具 ===== */
  function hslToHex(h,s,l){h=((h%360)+360)%360;s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(((h/60)%2)-1)),m=l-c/2;let r=0,g=0,b=0;if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];const to=v=>Math.round((v+m)*255).toString(16).padStart(2,'0');return '#'+to(r)+to(g)+to(b);}
  function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0;const l=(max+min)/2;if(max!==min){const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);if(max===r)h=(g-b)/d+(g<b?6:0);else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}return[h*360,s,l];}
  function hexToRgba(hex,a){const h=hex.replace('#','');const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}
  function relLum(hex){const h=hex.replace('#','');const n=parseInt(h,16);return(0.299*((n>>16)&255)+0.587*((n>>8)&255)+0.114*(n&255))/255;}
  function shade(hex,amt){const h=hex.replace('#','');const n=parseInt(h,16);const r=Math.max(0,Math.min(255,((n>>16)&255)+amt)),g=Math.max(0,Math.min(255,((n>>8)&255)+amt)),b=Math.max(0,Math.min(255,(n&255)+amt));return '#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');}

  /* ===== 指令解析 ===== */
  function countHits(text, words){return words.reduce((a,w)=>a+(text.toLowerCase().includes(String(w).toLowerCase())?1:0),0);}
  function bestMatch(text, kb, keyField){
    let best=null,bestScore=0;
    Object.entries(kb).forEach(([k,v])=>{const words=keyField?v[keyField]:v;const s=countHits(text,words);if(s>bestScore){bestScore=s;best=k;}});
    return { key:best, score:bestScore };
  }

  // 按「字段标签边界」提取文案：每个字段值到下一个标签为止，逗号不再截断
  const FIELD_TAGS = [
    ['subtitle', /副标题|副题|副文案|导语/g],
    ['title',    /主标题|大标题|标题|主题/g],
    ['brand',    /品牌|LOGO|logo|Logo|署名|出品/g],
    ['price',    /价格|售价|定价|现价|仅售|特价|价位/g],
    ['cta',      /按钮文案|按钮|行动号召|CTA|cta|引导语/g],
    ['date',     /日期|时间|展期|档期/g],
    ['tag',      /角标|标签|眉题/g],
    ['promo',    /卖点|亮点|促销语|口号/g],
  ];
  function grabFields(text){
    const t=text||'', hits=[];
    FIELD_TAGS.forEach(([key,re])=>{re.lastIndex=0;let m;while((m=re.exec(t))!==null)hits.push({key,start:m.index,end:m.index+m[0].length});});
    hits.sort((a,b)=>a.start-b.start);
    const clean=[];
    hits.forEach(h=>{
      if(clean.length){const p=clean[clean.length-1];if(h.start<p.end){if((h.end-h.start)>(p.end-p.start))clean[clean.length-1]=h;return;}}
      clean.push(h);
    });
    const out={};
    clean.forEach((h,i)=>{
      const next=clean[i+1];
      let val=t.slice(h.end, next?next.start:t.length).trim();
      // 引号内容优先：完整提取「』""''《》【】［］内的文字
      const q=val.match(/[「『"''《【［]([^」』"''》】］]{1,40})[」』"''》】］]/);
      if(q){val=q[1].trim();}
      else{
        // 无成对引号：去前导标点，去尾部描述词与标点（保留中间逗号，副标题不再被截断）
        val=val.replace(/^[\s：:，,。．.、""''「」『』【】［］《》（）()\-—]*/,'');
        val=val.replace(/(?:，|,)?\s*(?:并?加|配|附带|使用)?\s*(?:产品实拍图|产品图|实拍图|配图|图片)\s*$/,'');
        val=val.replace(/[\s，,；;。、：:""'']+$/,'').trim();
      }
      if(val)out[h.key]=val;
    });
    return out;
  }

  function parseInstruction(text){
    const t=text||'';
    const f=grabFields(t);
    const scene=bestMatch(t,SCENE_KB).key;
    const style=bestMatch(t,STYLE_KB,'kw').key;
    const comp=bestMatch(t,COMP_KB).key;
    let font=null;
    if(/手写|书法|毛笔|行书|楷体|字迹|签名|墨迹/.test(t))font='hand';
    else if(/圆体|可爱|卡通|萌|俏皮/.test(t))font='round';
    else if(/宋体|衬线|复古|古典|serif/i.test(t))font='serif';
    else if(/粗体|黑体|力量|现代|bold/i.test(t))font='bold';
    // 明确颜色词（指令优先于智能取色）
    let colorHex=null,colorName=null;
    for(const [name,hex] of Object.entries(COLOR_KB)){if(t.includes(name)){colorHex=hex;colorName=name;break;}}
    // 背景色指定：严格遵循用户要求。支持"背景：米白""纯白底色""红色背景"，
    // 以及"浅米白色干净柔光背景"这类「颜色词在前 + 修饰语 + 背景」的表达
    let bgHex=null,bgName=null,bgType=null;
    const colorPool={...COLOR_KB,
      '纯白':'#fbfcfa','白色':'#fbfcfa','白':'#fbfcfa','米白':'#f7f3ea','米色':'#f5efe3','奶油':'#fbf3e2','奶油白':'#fbf6ea',
      '象牙白':'#f8f4e9','珍珠白':'#f7f5f0','浅灰':'#eef0f2','灰白':'#eceff1','雾灰':'#e8e9ea','深灰':'#2a2d33','黑':'#141414',
      '浅蓝':'#e8f2fb','淡蓝':'#eaf3fa','雾霾蓝':'#dfe9f0','浅粉':'#fdeef3','淡粉':'#fdeef3','粉白':'#fceef2','藕粉':'#f3e4e3',
      '浅绿':'#eaf3e6','淡绿':'#eef5ea','豆绿':'#dfe9d6','抹茶绿':'#e4ebd8','杏色':'#f6e3d0','杏白':'#f9ede0','卡其':'#e6d9c2',
      '香槟':'#f4ead6','裸色':'#efe0d5','燕麦':'#efe7d8','浅紫':'#f0ebfa','淡紫':'#f2eefa','浅黄':'#fbf3d9'};
    // 浅色修饰词存在时，限定在浅色子池内匹配（避免"淡粉"被饱和"粉色#ec4899"截胡）
    const lightNames=['浅粉','淡粉','粉白','樱花粉','浅蓝','淡蓝','雾霾蓝','浅绿','淡绿','豆绿','抹茶绿','浅紫','淡紫','浅黄','奶油','奶油白','米白','米色','象牙白','珍珠白','浅灰','灰白','雾灰','藕粉','杏白','裸色','燕麦','杏色','香槟','白'];
    const lightPool={};lightNames.forEach(n=>{if(colorPool[n])lightPool[n]=colorPool[n];});
    const wantsLight=/浅|淡|柔|明亮|通透|低饱和|干净|奶油|米白|素雅/.test(t);
    const pool=wantsLight?lightPool:colorPool;
    const names=Object.keys(pool).sort((a,b)=>b.length-a.length);
    // ① 背景/底色在前："背景：米白" "底色纯白"
    const bgSeg=t.match(/(?:背景色|背景|底色|底)\s*[：:为]?\s*([\u4e00-\u9fa5A-Za-z0-9]{2,10})/);
    const rev=t.match(/([\u4e00-\u9fa5]{2,12}?)(?:色)?(?:[\u4e00-\u9fa5]{0,8}?)(?:背景|底色|底)/);
    if(bgSeg){for(const name of names){if(bgSeg[1].includes(name)){bgHex=pool[name];bgName=name;break;}}}
    // ② 颜色词在前、背景在后，中间可夹修饰语（最多 8 字）："浅米白色干净柔光背景"
    if(!bgHex&&rev){for(const name of names){if(rev[0].includes(name)){bgHex=pool[name];bgName=name;break;}}}
    // ③ 修饰语兜底："干净柔光背景""浅色背景""低饱和背景" → 浅米白/浅灰基底（绝不深色满铺）
    if(!bgHex&&/背景|底色/.test(t)){
      if(/干净|柔光|柔和|自然|明亮|通透|浅|淡|低饱和|米白|奶油/.test(t)){bgHex='#f7f4ed';bgName='浅米白';}
      else if(/深色|暗色|黑/.test(t)){bgHex='#1c1c1e';bgName='深色';}
    }
    for(const [k,words] of Object.entries(BG_KB)){if(words.some(w=>t.includes(w))){bgType=k;break;}}
    // 光影 / 材质
    const light=bestMatch(t,LIGHT_KB).key;
    const texture=bestMatch(t,TEXTURE_KB).key;
    // 构图锚点（用户明确指定落点时记录，未指定则自由生成）
    let anchor=null;
    for(const [a,re] of ANCHOR_WORDS){if(re.test(t)){anchor=a;break;}}
    // 氛围
    let mood=null;
    if(/柔和|温暖|温馨|治愈|柔光|自然光/.test(t))mood='柔和';
    else if(/强烈|冲击|震撼|炸裂|硬朗/.test(t))mood='强烈';
    else if(/高级|质感|精致|轻奢/.test(t))mood='高级';
    // 元素
    const elems=[];
    if(/印章|盖章|中式|古风/.test(t))elems.push('seal');
    if(/条形码|条码/.test(t))elems.push('barcode');
    if(/二维码|扫码/.test(t))elems.push('qr');
    if(f.price||/价格|¥|￥|元|折扣|折/.test(t))elems.push('price');
    if(f.date||/日期|时间|202\d/.test(t))elems.push('date');
    if(/签名|手写/.test(t))elems.push('signature');
    if(f.cta)elems.push('button');
    if(f.promo||/卖点|亮点/.test(t))elems.push('promo');

    // 标题兜底：任意位置的引号
    if(!f.title){const q=t.match(/[「『"''《【［]([^」』"''》】］]{2,30})[」』"''》】］]/);if(q)f.title=q[1].trim();}
    // 价格提取数字
    let price=null;
    if(f.price){const m=f.price.replace(/[¥￥]/g,'').match(/[\d.]+/);price=m?m[0]:f.price;}
    else {const m=t.match(/[¥￥]\s*([\d.]+)/);if(m)price=m[1];}

    const def=scene?SCENE_DEFAULT[scene]:null;
    const copy={};
    if(f.title)copy.title=f.title;if(f.subtitle)copy.subtitle=f.subtitle;
    if(f.brand)copy.brand=f.brand;if(f.cta)copy.cta=f.cta;if(f.tag)copy.tag=f.tag;
    if(price)copy.price=price;if(f.date)copy.date=f.date;if(f.promo)copy.promo=f.promo;

    return {
      scene, style, comp:comp||(def&&def.comp)||'magazine',
      font:font||(def&&def.font)||'serif', mood,
      colorHex, colorName, bgHex, bgName, bgType, light, texture, anchor,
      elems:elems.length?elems:(def?def.elems:['badge']),
      copy,
      paletteKey:style?STYLE_KB[style].p:(scene==='wedding'||scene==='art'?'guochao':scene==='food'?'fresh':'tech'),
      scores:{ scene, style, comp },
    };
  }

  function extractFeatures(text){
    const f=FEATURE_WORDS.filter(w=>(text||'').includes(w));const merged=[];
    f.forEach(w=>{const l=merged[merged.length-1];if(l&&text.includes(l+w))merged[merged.length-1]=l+w;else merged.push(w);});
    return merged.slice(0,5);
  }

  /* ===== 图片取色 ===== */
  function extractHue(img){
    const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d',{willReadFrequently:true});
    x.drawImage(img,0,0,64,64);let d;try{d=x.getImageData(0,0,64,64).data;}catch(e){return null;}
    const b={};for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],bl=d[i+2],a=d[i+3];if(a<128)continue;const[h,s,l]=rgbToHsl(r,g,bl);if(s<.18||l<.12||l>.92)continue;const k=Math.round(h/20)*20;b[k]=(b[k]||0)+s*(1-Math.abs(l-.5));}
    const e=Object.entries(b).sort((a,b)=>b[1]-a[1]);return e.length?Number(e[0][0]):null;
  }
  function updatePalettePreview(h){
    const box=$('palettePreview');if(!box)return;
    const dark=relLum(hslToHex(h,.65,.45))<.5;
    const cols=[hslToHex(h,.3,dark?.12:.95),hslToHex(h,.34,dark?.2:.86),hslToHex(h,.6,dark?.5:.48),hslToHex(h+20,.5,dark?.62:.62)];
    box.innerHTML=cols.map(c=>`<span style="display:block;background:${c}"></span>`).join('')+'<em>已按产品主色生成专属配色</em>';
    box.classList.add('ready');
  }

  /* ===== 设计规格 ===== */
  let spec=null;
  function buildSpec(){
    const s=spec||parseInstruction(promptInput?.value||'');
    let pal={...(PALETTES[s.paletteKey]||PALETTES.fresh)};
    if(s.colorHex){pal.accent=s.colorHex;pal.accent2=shade(s.colorHex,40);pal.text=relLum(s.colorHex)<.5?'#fff':'#1a1a1a';pal.sub=shade(s.colorHex,50);pal.dark=relLum(s.colorHex)<.5;pal.line=hexToRgba(s.colorHex,.35);pal.surface=hexToRgba(s.colorHex,.08);}
    // 智能取色：仅当指令未明确指定颜色词、也未指定强色系风格时生效
    // 强色系风格（活力橙/科技蓝/黑金/梦幻紫/中国红等）体现用户明确意图，优先保留
    const STRONG_STYLES=['energy','tech','luxury','dream','guochao','candy','retro'];
    const styleDecides=!(!s.style||STRONG_STYLES.indexOf(s.style)<0);
    if(state.smartColor&&state.extracted!=null&&!s.colorHex&&!styleDecides){
      const h=state.extracted;
      // 规则：产品主色只作「点缀」，背景恒为高明度浅色晕染，绝不把深色主色铺满画布
      pal.accent=hslToHex(h,.62,.44);pal.accent2=hslToHex(h+22,.55,.64);
      pal.bg=[hslToHex(h,.24,.99),hslToHex(h,.30,.955),hslToHex(h,.34,.90)];
      pal.sub=hslToHex(h,.34,.36);pal.text=hslToHex(h,.4,.14);
      pal.dark=false; // 智能取色一律浅底深字
      pal.line=hexToRgba(pal.accent,.28);pal.surface=hexToRgba(pal.accent,.07);
    }
    // 规则：用户要浅背景 / 指令含浅色氛围词时，绝不自动铺深色满画布。
    // 深色配色板强制转「浅底版本」：底色改为低饱和浅色，强调色仍保留原风格色。
    const rawText=promptInput?.value||'';
    const wantLight=s.bgHex?relLum(s.bgHex)>=.5:/浅|淡|干净|柔光|柔和|自然光|明亮|通透|低饱和|米白|奶油|留白/.test(rawText);
    const explicitDark=s.bgHex?relLum(s.bgHex)<.5:/深色背景|暗色|黑色背景|纯黑/.test(rawText);
    if(!explicitDark&&wantLight&&pal.dark){
      const ah=s.colorHex?null:state.extracted;
      const baseH=ah!=null?ah:(s.style==='tech'?205:s.style==='luxury'?42:s.style==='dream'?270:40);
      pal.bg=[hslToHex(baseH,.22,.99),hslToHex(baseH,.26,.955),hslToHex(baseH,.30,.90)];
      pal.text=hslToHex(baseH,.4,.14);pal.sub=hslToHex(baseH,.28,.38);
      pal.dark=false;pal.line=hexToRgba(pal.accent,.28);pal.surface=hexToRgba(pal.accent,.06);
    }
    const base={title:state.title,subtitle:state.subtitle,brand:state.brand,cta:state.cta,tag:state.tag,price:state.price,date:state.date};
    return {...s,pal,copy:{...base,...s.copy},img:state.image,decor:state.decor,features:extractFeatures(promptInput?.value||'')};
  }

  /* ===== 绘制工具 ===== */
  function rr(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();return c;}
  function cover(c,img,x,y,w,h){const ir=img.width/img.height,fr=w/h;let sw,sh,sx,sy;if(ir>fr){sh=img.height;sw=sh*fr;sx=(img.width-sw)/2;sy=0;}else{sw=img.width;sh=sw/fr;sx=0;sy=(img.height-sh)/2;}c.drawImage(img,sx,sy,sw,sh,x,y,w,h);}
  function wrap(c,text,maxW){const out=[];String(text).split('\n').forEach(p=>{const tk=p.match(/[A-Za-z0-9'’.\-—]+|\s+|./g)||[];let line='';tk.forEach(w=>{if(c.measureText(line+w).width>maxW&&line.trim()){out.push(line.trimEnd());line=w.trimStart();}else line+=w;});out.push(line.trimEnd());});return out;}
  function fontFor(sp,weight,size){
    const fam=sp.font==='hand'?"'STXingkai','Xingkai SC','KaiTi','STKaiti','楷体',cursive":
      sp.font==='serif'?"Georgia,'Songti SC','STSong','SimSun',serif":
      sp.font==='round'?"'PingFang SC','Microsoft YaHei','Hiragino Sans GB',sans-serif":
      "-apple-system,'PingFang SC','Microsoft YaHei',sans-serif";
    return `${weight} ${size}px ${fam}`;
  }
  function tracked(c,text,x,y,tracking,align='left'){const ch=[...text],ws=ch.map(k=>c.measureText(k).width),tot=ws.reduce((a,b)=>a+b,0)+tracking*Math.max(0,ch.length-1);let cx=align==='center'?x-tot/2:align==='right'?x-tot:x;c.textAlign='left';ch.forEach((k,i)=>{c.fillText(k,cx,y);cx+=ws[i]+tracking;});return tot;}
  function bgFill(c,W,H,pal){const g=c.createLinearGradient(0,0,W*.85,H);g.addColorStop(0,pal.bg[0]);g.addColorStop(.55,pal.bg[1]);g.addColorStop(1,pal.bg[2]);c.fillStyle=g;c.fillRect(0,0,W,H);}
  function glow(c,W,H,pal,on){if(!on)return;const g=c.createRadialGradient(W*.5,H*.32,0,W*.5,H*.32,W*.78);g.addColorStop(0,hexToRgba(pal.accent,pal.dark?.28:.12));g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,W,H);}
  function grain(c,W,H,pal,on){if(!on)return;c.save();c.globalAlpha=.5;c.strokeStyle=pal.line;c.lineWidth=1;for(let x=0;x<W;x+=48){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}for(let y=0;y<H;y+=48){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}c.restore();}
  function shadow(c,on,blur=30,oy=14){if(on){c.shadowColor='rgba(0,0,0,.35)';c.shadowBlur=blur;c.shadowOffsetY=oy;}else{c.shadowColor='transparent';c.shadowBlur=0;c.shadowOffsetY=0;}}

  function drawButton(c,x,y,w,h,text,pal,sp,sc){
    c.save();shadow(c,true,22*sc,10*sc);c.fillStyle=pal.accent;rr(c,x,y,w,h,h/2);c.fill();shadow(c,false);
    c.fillStyle=relLum(pal.accent)>.6?'#141414':'#fff';c.font=fontFor(sp,700,Math.min(34*sc,h*.46));c.textAlign='center';c.textBaseline='middle';
    c.fillText(text,x+w/2,y+h/2+2*sc);c.restore();
  }
  function drawPrice(c,x,y,price,pal,sc,compact){
    const txt='¥'+String(price).replace(/[¥￥]/g,'');
    c.save();const fs=(compact?52:74)*sc;c.font=`800 ${fs}px -apple-system,'PingFang SC',sans-serif`;
    const tw=c.measureText(txt).width,w=tw+54*sc,h=fs+34*sc;
    shadow(c,true,18*sc,8*sc);c.fillStyle=pal.accent;rr(c,x,y,w,h,h/2);c.fill();shadow(c,false);
    c.strokeStyle=hexToRgba('#ffffff',.5);c.lineWidth=2*sc;rr(c,x+5*sc,y+5*sc,w-10*sc,h-10*sc,(h-10*sc)/2);c.stroke();
    c.fillStyle=relLum(pal.accent)>.6?'#141414':'#fff';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,x+w/2,y+h/2+2*sc);c.restore();
    return w;
  }
  function drawSticker(c,x,y,r,text,pal,sc){
    c.save();c.translate(x,y);c.fillStyle=pal.accent2;c.beginPath();for(let i=0;i<20;i++){const a=Math.PI*2*i/20,rr2=i%2?r*.86:r;const px=Math.cos(a)*rr2,py=Math.sin(a)*rr2;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();
    c.fillStyle=relLum(pal.accent2)>.6?'#141414':'#fff';c.font=fontFor({font:'bold'},800,22*sc);c.textAlign='center';c.textBaseline='middle';wrap(c,text,r*1.4).slice(0,2).forEach((l,i)=>c.fillText(l,0,(i-.5)*26*sc));c.restore();
  }
  function drawBarcode(c,x,y,w,h,color){c.save();c.fillStyle=color;let px=x;while(px<x+w){const bw=(Math.sin(px*12.9898)*.5+.5)*5+1;c.fillRect(px,y,bw,h);px+=bw+2+(Math.sin(px*7.7)*.5+.5)*3;}c.restore();}
  function drawQR(c,x,y,size,color){c.save();c.fillStyle=color;const n=9,u=size/n;let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};for(let i=0;i<n;i++)for(let j=0;j<n;j++){const fg=(i<3&&j<3)||(i<3&&j>=n-3)||(i>=n-3&&j<3);if(fg){const ring=(i===1&&j<3)||(i<3&&j===1)||(i===n-2&&j>=n-3)||(i>=n-3&&j===n-2)||(j===1&&i>=n-3)||(j===n-2&&i<3);if(ring||(i===0||i===2)&&(j===0||j===2)||(i===n-1||i===n-3)&&(j===n-1||j===n-3))c.fillRect(x+j*u,y+i*u,u,u);}else if(rnd()>.5)c.fillRect(x+j*u,y+i*u,u,u);}c.restore();}
  function drawSeal(c,x,y,size,color){c.save();c.translate(x,y);c.strokeStyle=color;c.lineWidth=size*.08;c.strokeRect(-size/2,-size/2,size,size);c.fillStyle=color;c.font=`700 ${size*.4}px 'STKaiti','KaiTi',serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('囍',0,-size*.09);c.fillText('囍',0,size*.17);c.restore();}
  function product(c,img,x,y,w,h,pal,sc,radius){
    c.save();shadow(c,true,34*sc,18*sc);c.fillStyle=pal.dark?'rgba(255,255,255,.04)':'rgba(255,255,255,.55)';rr(c,x,y,w,h,radius||18*sc);c.fill();shadow(c,false);
    c.save();rr(c,x,y,w,h,radius||18*sc);c.clip();if(img)cover(c,img,x,y,w,h);else{c.fillStyle=hexToRgba(pal.accent,.12);c.fillRect(x,y,w,h);}c.restore();
    c.strokeStyle=pal.line;c.lineWidth=2*sc;rr(c,x,y,w,h,radius||18*sc);c.stroke();c.restore();
  }
  function fitTitle(c,text,maxW,maxLines,start,weight,sp){
    let ts=start,ls=[];for(let i=0;i<8;i++){c.font=fontFor(sp,weight,ts);ls=wrap(c,text,maxW);if(ls.length<=maxLines)break;ts*=.88;}
    return {ts,ls};
  }

  /* ================= 生成式布局引擎 v6 =================
     布局不再取自固定模板：指令文本 + 换版序号 → 哈希 → 布局基因，
     骨架、留白、对齐、标题位置、图片形状、分割、装饰、边框等全部
     由基因决定。相同指令可复现，不同指令长相不同，点「换一版」重掷。 */
  function hashSeed(str){
    let h=2166136261>>>0;
    for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function mulberry32(a){
    return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  }
  function composeGenome(sp,salt){
    const key=[sp.scene,sp.comp,sp.style,sp.font,sp.mood,sp.light,sp.texture,sp.anchor,sp.copy.title,sp.copy.subtitle,sp.copy.brand,salt].join('|');
    const rnd=mulberry32(hashSeed(key));
    const R=(a,b)=>a+(b-a)*rnd(),P=a=>a[Math.floor(rnd()*a.length)],I=(a,b)=>Math.floor(R(a,b+1));

    // ---- 产品锚点：用户指定优先，否则自由落在四角/两侧/黄金分割/对角 ----
    // 默认不再落在中轴线（CT/CB/CENTER 仅当用户明确指定），避免"锁在垂直中线"
    const anchor=sp.anchor||P(['LT','RT','LB','RB','LC','RC','GOLDEN','GOLDEN','DIAG','DIAG','LB','RT']);
    // ---- 背景方案：用户明确指定底色/类型时严格遵循，否则自由 ----
    const bgType=sp.bgType||P(['solid','gradient','texture','lowsat','scene']);
    // ---- 光影/材质来自指令 ----
    const light=sp.light||P([null,'soft','hard','rim','studio']);
    const texture=sp.texture||P([null,'matte','glossy','metal','glass','paper','nature']);

    return {
      mode:'freeform', salt, anchor, bgType, light, texture,
      bgHex:sp.bgHex||null, bgName:sp.bgName||null,
      pad:R(.055,.10),
      // 产品尺度与形态（绝不锁定居中方框）
      prodW:R(.34,.56), prodH:R(.30,.52),
      imgShape:P(['rect','round','arch','circle','organic','none']),
      imgRot:R(-.16,.16),
      imgFloat:R(.15,.5),
      // 文字区排版（由锚点规划器二次修正）
      titleAlign:P(['left','left','center','right']),
      titleScale:R(.86,1.32),
      titleTrack:R(0,7),
      titleMaxLines:I(1,3),
      textSlant:P([0,0,0,-.035,.035]),
      bodyLines:I(1,3),
      // 错落排版：副标题/价格相对标题横向错位，避免所有元素锁在一条垂直线
      subOffset:P([0,0,.06,-.06,.10]),
      priceOffset:P([0,.08,-.06]),
      tagOffset:P([0,.05,-.05]),
      priceSide:P(['left','right']),
      buttonWidth:R(.42,.68),
      // 背景装饰
      bgAngle:R(-.55,.55),
      bgAt:R(.30,.70),
      decorKind:P(['dots','lines','arcs','orbs','grid','none']),
      decorAmt:R(.3,.95),
      vignette:rnd()>.5,
      frame:P(['none','none','full','corner']),
      grain:rnd()>.55,
      subMax:I(12,26),
    };
  }

  /* ---- 构规划器：由产品锚点推导「产品矩形 + 文字区 + 品牌/价格槽位」----
     文字永远落在产品的对侧或留白区，绝不遮挡产品主体。 */
  function planComposition(g,W,H){
    const P=g.pad*W, cx=W/2, cy=H/2;
    const pw=W*g.prodW, ph=H*g.prodH;
    let px,py, textX,textY,textW,textH,align;
    const A=g.anchor;
    if(A==='CENTER'){
      // 产品居中（用户明确要求），但文字错落到侧边/角落留白，不再全宽居中堆在正下方
      px=cx-pw/2; py=cy-ph*.62;
      const left=(g.salt%2)===0;
      textW=W*.40; textX=left?P:W-P-textW; textY=py+ph+H*.04; textH=H-(textY)-P; align='left';
    } else if(A==='LT'){
      px=P; py=P*1.3; textW=W*.46; textX=W-P-textW; textY=P*1.5; textH=H*.72; align='left';
    } else if(A==='RT'){
      px=W-P-pw; py=P*1.3; textX=P; textW=W*.46; textY=P*1.5; textH=H*.72; align='left';
    } else if(A==='LB'){
      px=P; py=H-P-ph; textX=W-P-W*.46; textW=W*.46; textY=P*1.6; textH=H*.66; align='left';
    } else if(A==='RB'){
      px=W-P-pw; py=H-P-ph; textX=P; textW=W*.46; textY=P*1.6; textH=H*.66; align='left';
    } else if(A==='LC'){
      px=P; py=cy-ph/2; textX=W-P-W*.42; textW=W*.42; textY=cy-H*.25; textH=H*.5; align='left';
    } else if(A==='RC'){
      px=W-P-pw; py=cy-ph/2; textX=P; textW=W*.42; textY=cy-H*.25; textH=H*.5; align='left';
    } else if(A==='CT'){
      // 产品顶部居中 → 文字错落到左下/右下留白，避免锁在中轴
      px=cx-pw/2; py=P*1.1;
      const left=(g.salt%2)===0; textW=W*.42; textX=left?P:W-P-textW; textY=H*.52; textH=H*.40; align='left';
    } else if(A==='CB'){
      // 产品底部居中 → 文字错落到左上/右上留白
      px=cx-pw/2; py=H-P-ph;
      const left=(g.salt%2)===0; textW=W*.42; textX=left?P:W-P-textW; textY=P*1.4; textH=H*.40; align='left';
    } else if(A==='GOLDEN'){
      const gx=P+(W-2*P-pw)*.382, gy=P+(H-2*P-ph)*.382;
      px=gx; py=gy;
      const right=px>W*.42;
      textW=W*.44; textX=right?P:W-P-textW; textY=gy<H*.4?H*.56:P*1.6; textH=H*.34; align='left';
    } else { // DIAG 对角：产品偏一侧，文字在对角（由 salt 奇偶确定性决定）
      const flip=(g.salt%2)===0;
      if(flip){px=W-P-pw;py=P*1.2;textX=P;textY=H*.62;}
      else{px=P;py=H-P-ph;textX=W-P-W*.44;textY=P*1.6;}
      textW=W*.44;textH=H*.4;align='left';
    }
    // 约束在产品不越界
    px=Math.max(P*0.6,Math.min(px,W-P*0.6-pw));
    py=Math.max(P*0.6,Math.min(py,H-P*0.6-ph));
    // 文字右缘不越界
    textX=Math.max(P*0.5,Math.min(textX,W-P*0.5-textW));
    return {P,prod:{x:px,y:py,w:pw,h:ph},text:{x:textX,y:textY,w:textW,h:textH,align},anchor:A};
  }
  function paintImg(c,img,x,y,w,h,pal){
    if(img){cover(c,img,x,y,w,h);return;}
    const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,hexToRgba(pal.accent,.30));g.addColorStop(1,hexToRgba(pal.accent2,.12));c.fillStyle=g;c.fillRect(x,y,w,h);
  }
  function drawImg(c,img,x,y,w,h,g,pal,sc){
    const s=g.imgShape;
    c.save();
    if(s==='circle'){const r=Math.min(w,h)/2;c.beginPath();c.arc(x+w/2,y+h/2,r,0,Math.PI*2);c.clip();shadow(c,true,30*sc,14*sc);paintImg(c,img,x+w/2-r,y+h/2-r,2*r,2*r,pal);}
    else if(s==='arch'){const r=w/2;c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+r);c.arc(x+r,y+r,r,Math.PI,0);c.lineTo(x+w,y+h);c.closePath();c.clip();shadow(c,true,30*sc,14*sc);paintImg(c,img,x,y,w,h,pal);}
    else if(s==='rot'){c.translate(x+w/2,y+h/2);c.rotate(g.imgRot);shadow(c,true,34*sc,16*sc);rr(c,-w/2,-h/2,w,h,18*sc);c.clip();paintImg(c,img,-w/2,-h/2,w,h,pal);}
    else{const rad=s==='round'?24*sc:6*sc;shadow(c,true,30*sc,14*sc);rr(c,x,y,w,h,rad);c.clip();paintImg(c,img,x,y,w,h,pal);}
    shadow(c,false);c.restore();
    c.save();c.strokeStyle=pal.line;c.lineWidth=2*sc;
    if(s==='circle'){const r=Math.min(w,h)/2;c.beginPath();c.arc(x+w/2,y+h/2,r,0,Math.PI*2);c.stroke();}
    else if(s==='arch'){const r=w/2;c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+r);c.arc(x+r,y+r,r,Math.PI,0);c.lineTo(x+w,y+h);c.closePath();c.stroke();}
    else{rr(c,s==='rot'?-w/2:x,s==='rot'?-h/2:y,w,h,s==='round'?24*sc:6*sc);c.stroke();}
    c.restore();
  }
  function drawSplit(c,W,H,sc,pal,g){
    c.save();c.fillStyle=hexToRgba(pal.accent,.13);c.beginPath();
    if(g.bgAngle>=0){c.moveTo(0,0);c.lineTo(W*g.bgAt,0);c.lineTo(W*g.bgAt+W*g.bgAngle,H);c.lineTo(0,H);}
    else{c.moveTo(W,0);c.lineTo(W*g.bgAt,0);c.lineTo(W*g.bgAt+W*g.bgAngle,H);c.lineTo(W,H);}
    c.closePath();c.fill();
    if(g.accentSide==='top'||g.accentSide==='bottom'){c.fillStyle=hexToRgba(pal.accent,.85);c.fillRect(0,g.accentSide==='top'?0:H-H*.055,W,H*.055);}
    c.restore();
  }
  function drawDecor(c,W,H,sc,pal,g){
    c.save();c.globalAlpha=.5*g.decorAmt;c.strokeStyle=pal.line;c.fillStyle=pal.accent;c.lineWidth=Math.max(1,1.5*sc);
    if(g.decorKind==='dots'){for(let i=0;i<28;i++){const x=(i*97)%W,y=(i*173)%H,r=(i%4+1)*1.4*sc;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}}
    else if(g.decorKind==='lines'){for(let i=0;i<9;i++){const y=H*(i+1)/10;c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}}
    else if(g.decorKind==='arcs'){for(let i=0;i<4;i++){c.beginPath();c.arc(W*.82,H*.26,(60+i*46)*sc,-1.2,1.2);c.stroke();}}
    else if(g.decorKind==='grid'){for(let x=0;x<W;x+=64*sc){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}for(let y=0;y<H;y+=64*sc){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}}
    c.restore();
  }
  function drawFrame(c,W,H,sc,pal,g){
    if(g.frame==='none')return;
    c.save();c.strokeStyle=pal.line;c.lineWidth=1.5*sc;
    if(g.frame==='full'){const p=g.pad*W*.55;c.strokeRect(p,p,W-2*p,H-2*p);}
    else{const L=g.pad*W*.6,len=W*.08;[[L,L,1,1],[W-L,L,-1,1],[L,H-L,1,-1],[W-L,H-L,-1,-1]].forEach(v=>{c.beginPath();c.moveTo(v[0]+v[2]*len,v[1]);c.lineTo(v[0],v[1]);c.lineTo(v[0],v[1]+v[3]*len);c.stroke();});}
    c.restore();
  }
  function drawFooter(c,e,g,x,y,maxW){
    const {W,H,sc,sp,pal,cp}=e,P=g.pad*W,avail=maxW||(W-2*P);
    const bw=Math.max(200*sc,Math.min(avail,W*g.buttonWidth));
    const pw=cp.price?Math.max(150*sc,(String(cp.price).length*40+70)*sc):0;
    const gap=14*sc;
    if(cp.price&&g.priceSide==='left'){
      drawPrice(c,x,y,cp.price,pal,sc,true);
      if(cp.cta)drawButton(c,x+pw+gap,y,Math.max(160*sc,x+avail-pw-gap),76*sc,cp.cta,pal,sp,sc);
    }else{
      if(cp.cta)drawButton(c,x,y,bw,76*sc,cp.cta,pal,sp,sc);
      if(cp.price){const px=Math.min(x+avail-pw,x+bw+gap);drawPrice(c,px,y,cp.price,pal,sc,true);}
    }
    if(sp.elems.includes('barcode')&&!maxW)drawBarcode(c,W-P-150*sc,H-64*sc,150*sc,28*sc,pal.sub);
  }

  /* ============ 6 种参数化骨架（无模板，全部由布局基因驱动） ============ */
  const RENDERERS={};

  // 通用标题：对齐 / 字距 / 字号 / 行数全部读基因
  function titleBlock(c,e,g,x,y,maxW,align,weight,startSize){
    const {sc,sp,pal,cp}=e;
    const size=Math.min(startSize*g.titleScale,maxW/Math.max(2,[...String(cp.title)].length)*1.9);
    const {ts,ls}=fitTitle(c,cp.title,maxW,g.titleMaxLines,size,weight,sp);
    c.font=fontFor(sp,weight,ts);c.fillStyle=pal.text;c.textBaseline='top';
    ls.forEach((l,i)=>tracked(c,l,x,y+i*ts*1.06,g.titleTrack,align));
    return {h:ls.length*ts*1.06,ts,ls};
  }
  function subtitleBlock(c,e,g,x,y,maxW,align,size,maxLines){
    const {sc,sp,pal,cp}=e;c.font=fontFor(sp,500,size*sc);c.fillStyle=pal.sub;c.textBaseline='top';
    const lines=wrap(c,String(cp.subtitle||''),maxW).slice(0,maxLines||2);
    lines.forEach((l,i)=>{if(g.titleTrack>0.6)tracked(c,l,x,y+i*size*1.35*sc,g.titleTrack*.5,align);else{c.textAlign=align;c.fillText(l,x,y+i*size*1.35*sc);}});
    c.textAlign='left';return lines.length*size*1.35*sc;
  }

  // 骨架 A：纵向流排（品牌 / 主图 / 标题 / 副标题 / 页脚）
  RENDERERS.flow=(c,e,g)=>{
    const {W,H,sc,sp,pal,img,cp}=e,P=g.pad*W,cx=W/2,al=g.titleAlign;
    bgFill(c,W,H,pal);drawSplit(c,W,H,sc,pal,g);glow(c,W,H,pal,sp.decor.glow);
    c.fillStyle=pal.accent;c.textBaseline='middle';c.font=fontFor(sp,700,Math.min(80*sc,W*.078));
    c.textAlign=al;c.fillText(String(cp.brand).toUpperCase(),al==='center'?cx:al==='right'?W-P:P,H*.075);
    if(cp.date){c.textAlign=al==='right'?'left':'right';c.fillStyle=pal.sub;c.font=fontFor(sp,600,20*sc);c.fillText(cp.date,al==='right'?P:W-P,H*.075);}
    const iw=(W-2*P)*g.imgW,ih=Math.min(iw*(img?img.height/img.width:1.1),H*.40),ix=al==='center'?cx-iw/2:al==='right'?W-P-iw:P,iy=H*g.imgTop;
    drawImg(c,img,ix,iy,iw,ih,g,pal,sc);
    if(sp.decor.badge&&cp.tag&&g.imgShape!=='circle')drawSticker(c,ix+iw-8*sc,iy-6*sc,48*sc,cp.tag.split('·')[0].trim(),pal,sc);
    const ty=iy+ih+H*.035;
    const t=titleBlock(c,e,g,al==='center'?cx:al==='right'?W-P:P,ty,W-2*P,al,800,108*sc);
    subtitleBlock(c,e,g,al==='center'?cx:al==='right'?W-P:P,ty+t.h+16*sc,W-2*P,al,28,2);
    drawFooter(c,e,g,P,H*.9);
    drawDecor(c,W,H,sc,pal,g);drawFrame(c,W,H,sc,pal,g);
  };

  // 骨架 B：分栏构成（文字栏 / 图片栏，左右由基因翻转）
  RENDERERS.columns=(c,e,g)=>{
    const {W,H,sc,sp,pal,img,cp}=e,P=g.pad*W,sx=W*g.splitX,flip=g.diagFlip;
    bgFill(c,W,H,pal);
    const tx=flip?W-sx:0,iwx=flip?0:sx;
    c.fillStyle=pal.surface;c.fillRect(tx,0,flip?sx:W-sx,H);
    c.save();c.beginPath();c.rect(iwx,0,flip?sx:W-sx,H);c.clip();paintImg(c,img,iwx,0,flip?sx:W-sx,H,pal);c.restore();
    c.strokeStyle=pal.accent;c.lineWidth=3*sc;c.beginPath();c.moveTo(sx,0);c.lineTo(sx,H);c.stroke();
    const lx=flip?W-sx+P:P,lw=sx-2*P;
    c.fillStyle=pal.accent;c.textBaseline='top';c.textAlign='left';c.font=fontFor(sp,700,24*sc);c.fillText(String(cp.brand).toUpperCase(),lx,H*.1);
    const t=titleBlock(c,e,g,lx,H*.21,lw,'left',800,90*sc);
    subtitleBlock(c,e,g,lx,H*.21+t.h+20*sc,lw,'left',26,3);
    if(cp.price){c.fillStyle=pal.accent;c.textAlign='left';c.font=fontFor(sp,800,44*sc);c.fillText('¥'+cp.price,lx,H*.72);}
    if(cp.cta)drawButton(c,lx,H*.8,Math.min(lw,W*g.buttonWidth),76*sc,cp.cta,pal,sp,sc);
    if(sp.elems.includes('barcode'))drawBarcode(c,iwx+30*sc,H*.9,Math.min(170*sc,(flip?sx:W-sx)-60*sc),36*sc,pal.dark?'rgba(255,255,255,.85)':pal.text);
    drawDecor(c,W,H,sc,pal,g);drawFrame(c,W,H,sc,pal,g);
  };

  // 骨架 C：中心聚焦（环形图 / 居中标题 / 仪式感）
  RENDERERS.focus=(c,e,g)=>{
    const {W,H,sc,sp,pal,img,cp}=e,cx=W/2;
    bgFill(c,W,H,pal);glow(c,W,H,pal,sp.decor.glow);
    c.strokeStyle=pal.line;c.lineWidth=2*sc;c.beginPath();c.arc(cx,H*.3,W*.36,Math.PI*1.12,Math.PI*1.88);c.stroke();
    c.fillStyle=pal.accent;c.textAlign='center';c.textBaseline='middle';c.font=fontFor(sp,600,22*sc);tracked(c,String(cp.brand).toUpperCase(),cx,H*.1,7*sc,'center');
    const R=Math.min(W*.28,H*.21);
    c.save();c.beginPath();c.arc(cx,H*.34,R,0,Math.PI*2);c.clip();paintImg(c,img,cx-R,H*.34-R,2*R,2*R,pal);c.restore();
    c.strokeStyle=pal.accent;c.lineWidth=3*sc;c.beginPath();c.arc(cx,H*.34,R+12*sc,0,Math.PI*2);c.stroke();
    c.lineWidth=1.5*sc;c.beginPath();c.arc(cx,H*.34,R+24*sc,0,Math.PI*2);c.stroke();
    if(sp.elems.includes('seal'))drawSeal(c,cx+R*.72,H*.34-R*.72,70*sc,pal.accent);
    const t=titleBlock(c,e,g,cx,H*.63,W*.84,'center',800,92*sc);
    const dy=H*.63+t.h+20*sc;c.strokeStyle=pal.accent;c.lineWidth=2*sc;c.beginPath();c.moveTo(cx-110*sc,dy);c.lineTo(cx+110*sc,dy);c.stroke();
    subtitleBlock(c,e,g,cx,dy+16*sc,W*.84,'center',24,1);
    if(cp.price)drawPrice(c,cx-72*sc,H*.88,cp.price,pal,sc,true);
    if(sp.elems.includes('date')){c.fillStyle=pal.text;c.textAlign='center';c.font=fontFor(sp,700,26*sc);tracked(c,cp.date||'',cx,H*.96,4*sc,'center');}
    drawDecor(c,W,H,sc,pal,g);drawFrame(c,W,H,sc,pal,g);
  };

  // 骨架 D：叠层冲击（巨字 / 倾斜产品卡 / 撞色底栏）
  RENDERERS.overlay=(c,e,g)=>{
    const {W,H,sc,sp,pal,img,cp}=e,P=g.pad*W;
    bgFill(c,W,H,pal);drawSplit(c,W,H,sc,pal,g);glow(c,W,H,pal,sp.decor.glow);
    c.textBaseline='top';c.textAlign='left';
    const t=titleBlock(c,e,g,P,H*g.titleTop,W-2*P,g.titleAlign,900,138*sc);
    subtitleBlock(c,e,g,P,H*g.titleTop+t.h+8*sc,W*.72,'left',30,2);
    if(img){const iw=W*.6,ih=iw*(img.height/img.width)||iw,ix=W*.34,iy=H*.37;c.save();c.translate(ix+iw/2,iy+ih/2);c.rotate(g.imgRot);shadow(c,true,46*sc,24*sc);rr(c,-iw/2,-ih/2,iw,ih,20*sc);c.clip();cover(c,img,-iw/2,-ih/2,iw,ih);shadow(c,false);c.restore();}
    else{const ig={...g,imgShape:'rot'};drawImg(c,null,W*.34,H*.42,W*.5,H*.3,ig,pal,sc);}
    if(cp.promo){c.fillStyle=pal.accent;c.font=fontFor(sp,800,40*sc);c.textAlign='left';c.fillText(cp.promo.slice(0,12),P,H*.69);}
    c.fillStyle=pal.accent;c.fillRect(0,H*.86,W,H*.14);
    c.fillStyle=relLum(pal.accent)>.6?pal.bg[0]:'#fff';c.textAlign='left';c.textBaseline='middle';c.font=fontFor(sp,700,38*sc);c.fillText(cp.cta||'',P,H*.93);
    c.textAlign='right';c.font=fontFor(sp,600,26*sc);c.fillText(String(cp.brand).toUpperCase(),W-P,H*.93);
    if(sp.elems.includes('barcode'))drawBarcode(c,W-P-160*sc,H*.975,160*sc,24*sc,relLum(pal.accent)>.6?pal.bg[0]:'rgba(255,255,255,.7)');
    drawDecor(c,W,H,sc,pal,g);drawFrame(c,W,H,sc,pal,g);
  };

  // 骨架 E：对角构成（斜切色块 / 对角图片与标题）
  RENDERERS.diagonal=(c,e,g)=>{
    const {W,H,sc,sp,pal,img,cp}=e,P=g.pad*W,flip=g.diagFlip;
    bgFill(c,W,H,pal);
    c.save();c.fillStyle=hexToRgba(pal.accent,.15);c.beginPath();
    if(flip){c.moveTo(W*.34,0);c.lineTo(W,0);c.lineTo(W,H*.52);c.lineTo(0,H*.94);c.lineTo(0,H*.6);}
    else{c.moveTo(W*.66,0);c.lineTo(W,H*.4);c.lineTo(W,H);c.lineTo(0,H);c.lineTo(0,H*.72);}
    c.closePath();c.fill();c.restore();glow(c,W,H,pal,sp.decor.glow);
    const iw=W*.58,ih=Math.min(iw*(img?img.height/img.width:1),H*.44),ix=flip?W-P-iw:P,iy=H*.34;
    drawImg(c,img,ix,iy,iw,ih,{...g,imgShape:g.imgShape==='rot'?'round':g.imgShape},pal,sc);
    const tx=flip?P:W-P,al=flip?'left':'right';
    c.fillStyle=pal.accent;c.textBaseline='top';c.textAlign=al;c.font=fontFor(sp,700,23*sc);c.fillText(String(cp.brand).toUpperCase(),tx,H*.11);
    const t=titleBlock(c,e,g,tx,H*.16,W*.9,al,800,96*sc);
    subtitleBlock(c,e,g,tx,H*.16+t.h+14*sc,W*.42,al,25,2);
    if(cp.price&&g.priceSide==='left')drawPrice(c,flip?P:W-P-140*sc,H*.8,cp.price,pal,sc,true);
    if(cp.cta){const bw=W*.4;drawButton(c,flip?P:W-P-bw,H*.86,bw,74*sc,cp.cta,pal,sp,sc);}
    drawDecor(c,W,H,sc,pal,g);drawFrame(c,W,H,sc,pal,g);
  };

  // 骨架 F：网格内页（顶栏 / 竖排标题 / 图文混排）
  RENDERERS.gridline=(c,e,g)=>{
    const {W,H,sc,sp,pal,img,cp}=e,P=g.pad*W;
    bgFill(c,W,H,pal);grain(c,W,H,pal,sp.decor.grid);
    c.fillStyle=pal.accent;c.fillRect(0,0,W,H*.085);
    c.fillStyle=relLum(pal.accent)>.6?pal.bg[0]:'#fff';c.textAlign='left';c.textBaseline='middle';c.font=fontFor(sp,700,25*sc);c.fillText(String(cp.brand).toUpperCase(),P,H*.043);
    c.textAlign='right';c.font=fontFor(sp,500,18*sc);c.fillText(String(cp.tag||'FEATURE').toUpperCase(),W-P,H*.043);
    const ix=W*.4,iy=H*.14,iw=W*.57,ih=H*.48;
    drawImg(c,img,ix,iy,iw,ih,{...g,imgShape:'rect'},pal,sc,6*sc);
    c.save();c.translate(P+38*sc,H*.15);c.fillStyle=pal.text;c.font=fontFor(sp,800,68*sc);c.textAlign='left';c.textBaseline='top';
    [...String(cp.title).replace(/\n/g,'')].slice(0,6).forEach((ch,i)=>c.fillText(ch,0,i*78*sc));c.restore();
    c.fillStyle=pal.sub;c.font=fontFor(sp,400,18*sc);c.textAlign='left';c.textBaseline='top';
    const para=String(cp.subtitle)+'。从创意到呈现，以系统化方法还原完整流程，让每一次尝试都有据可依。';
    wrap(c,para,W*.33).slice(0,10).forEach((l,i)=>c.fillText(l,P,H*.52+i*31*sc));
    if(cp.cta){c.fillStyle=pal.accent;c.font=fontFor(sp,700,23*sc);c.textAlign='left';c.fillText(cp.cta,P,H*.88);}
    if(cp.price){c.fillStyle=pal.text;c.font=fontFor(sp,800,33*sc);c.textAlign='left';c.fillText('¥'+cp.price,P+W*.34,H*.88);}
    if(sp.elems.includes('qr'))drawQR(c,W-P-86*sc,H*.82,86*sc,pal.text);
    drawDecor(c,W,H,sc,pal,g);
  };

  /* ============ 自由构图渲染器（默认，彻底不套模板） ============
     背景 / 产品落点 / 文字区 / 装饰全部由构图规划 + 基因决定。 */
  function drawBg(c,W,H,sc,sp,pal,g){
    const bgType=g.bgType,h=state.extracted;
    // 用户明确指定底色 → 严格遵循
    if(g.bgHex){
      c.fillStyle=g.bgHex;c.fillRect(0,0,W,H);
      if(bgType==='gradient'){
        const dk=relLum(g.bgHex)<.5;
        const gr=c.createLinearGradient(0,0,W,H);gr.addColorStop(0,shade(g.bgHex,dk?18:-8));gr.addColorStop(1,shade(g.bgHex,dk?-12:8));c.fillStyle=gr;c.fillRect(0,0,W,H);
      }
    } else if(bgType==='solid'){
      // 禁止单一满铺纯色：即便"纯色"也做浅色微渐变，保持干净而不死板
      const gr=c.createLinearGradient(0,0,W,H);
      gr.addColorStop(0,pal.bg[0]);gr.addColorStop(.6,pal.bg[1]);gr.addColorStop(1,pal.bg[2]);
      c.fillStyle=gr;c.fillRect(0,0,W,H);
      c.fillStyle=hexToRgba(pal.accent,.04);c.fillRect(0,0,W,H);
    } else if(bgType==='scene'){
      // 简约场景：地平线 + 柔光渐变
      bgFill(c,W,H,pal);
      const hy=H*(.62+g.bgAt*.12);
      const sg=c.createLinearGradient(0,hy,0,H);sg.addColorStop(0,hexToRgba(pal.accent,.14));sg.addColorStop(1,hexToRgba(pal.accent,.02));c.fillStyle=sg;c.fillRect(0,hy,W,H-hy);
      c.strokeStyle=hexToRgba(pal.accent,.22);c.lineWidth=2*sc;c.beginPath();c.moveTo(0,hy);c.lineTo(W,hy);c.stroke();
    } else if(bgType==='lowsat'){
      const base=h!=null?hslToHex(h,.12,.9):'#e9e7e2';
      c.fillStyle=base;c.fillRect(0,0,W,H);
      const gr=c.createLinearGradient(0,0,W,H);gr.addColorStop(0,'rgba(255,255,255,.35)');gr.addColorStop(1,hexToRgba(pal.accent,.05));c.fillStyle=gr;c.fillRect(0,0,W,H);
    } else if(bgType==='texture'||g.grain){
      bgFill(c,W,H,pal);grain(c,W,H,pal,true);
    } else {
      bgFill(c,W,H,pal);
    }
    // 光影气质叠加
    if(g.light==='neon'){glow(c,W,H,{...pal,accent:'#a855f7',dark:true},true);}
    else if(g.light==='rim'){const gr=c.createRadialGradient(W*.7,H*.2,0,W*.7,H*.2,W*.9);gr.addColorStop(0,hexToRgba(pal.accent2,.28));gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(0,0,W,H);}
    else if(g.light==='studio'){const gr=c.createRadialGradient(W*.5,H*.34,0,W*.5,H*.34,W*.7);gr.addColorStop(0,hexToRgba(pal.accent,pal.dark?.24:.12));gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(0,0,W,H);}
    // 斜切色块 / 光带
    if(g.decorAmt>.5){c.save();c.fillStyle=hexToRgba(pal.accent,bgType==='solid'?.05:.09);c.beginPath();
      c.moveTo(0,H*(.2+g.bgAt*.4));c.lineTo(W,g.bgAngle>0?H*g.bgAt:0);c.lineTo(W,H);c.lineTo(0,H);c.closePath();c.fill();c.restore();}
    // 暗角
    if(g.vignette){const vg=c.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.85);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.22)');c.fillStyle=vg;c.fillRect(0,0,W,H);}
  }

  // 材质质感叠层（作用于产品卡）
  function textureOverlay(c,r,pal,g,sc){
    if(g.texture==='glass'){c.save();rr(c,r.x,r.y,r.w,r.h,20*sc);c.clip();const gr=c.createLinearGradient(r.x,r.y,r.x+r.w,r.y);gr.addColorStop(0,'rgba(255,255,255,.34)');gr.addColorStop(.4,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,.16)');c.fillStyle=gr;c.fillRect(r.x,r.y,r.w,r.h);c.restore();}
    else if(g.texture==='metal'){c.save();rr(c,r.x,r.y,r.w,r.h,20*sc);c.clip();for(let i=0;i<r.w;i+=7*sc){c.fillStyle=i%(14*sc)<7*sc?'rgba(255,255,255,.05)':'rgba(0,0,0,.03)';c.fillRect(r.x+i,r.y,7*sc,r.h);}c.restore();}
    else if(g.texture==='matte'){c.save();c.globalAlpha=.10;c.fillStyle=pal.bg[2];c.fillRect(r.x,r.y,r.w,r.h);c.restore();}
    else if(g.texture==='paper'){grain(c,r.w,r.h,pal,true);}
    else if(g.texture==='glossy'){c.save();rr(c,r.x,r.y,r.w,r.h,20*sc);c.clip();c.fillStyle='rgba(255,255,255,.12)';c.beginPath();c.ellipse(r.x+r.w*.3,r.y+r.h*.2,r.w*.4,r.h*.16,-.5,0,Math.PI*2);c.fill();c.restore();}
  }

  RENDERERS.freeform=(c,e,g)=>{
    const {W,H,sc,sp,pal,img,cp}=e;
    const L=planComposition(g,W,H),prod=L.prod,tz=L.text,P=L.P;
    drawBg(c,W,H,sc,sp,pal,g);

    // 产品：自由落点 + 形状 + 悬浮阴影，绝不锁在居中方框
    const shape=g.imgShape;
    c.save();
    if(shape==='circle'||shape==='organic'){
      const R=Math.min(prod.w,prod.h)/2;const ox=prod.x+prod.w/2,oy=prod.y+prod.h/2;
      c.beginPath();c.arc(ox,oy,R,0,Math.PI*2);c.clip();
      shadow(c,true,40*sc,20*sc);paintImg(c,img,ox-R,oy-R,2*R,2*R,pal);shadow(c,false);
    } else if(shape==='none'&&img){
      c.save();c.translate(prod.x+prod.w/2,prod.y+prod.h/2);c.rotate(g.imgRot);
      shadow(c,true,42*sc,22*sc);cover(c,img,-prod.w/2,-prod.h/2,prod.w,prod.h);shadow(c,false);c.restore();
    } else {
      const rad=shape==='arch'?prod.w/2:shape==='round'?26*sc:6*sc;
      c.save();c.translate(prod.x+prod.w/2+g.imgRot*prod.h*.5,prod.y+prod.h/2);c.rotate(g.imgRot);
      if(shape==='arch'){c.beginPath();c.moveTo(-prod.w/2,prod.h/2);c.lineTo(-prod.w/2,-prod.w/2+rad);c.arc(0,-prod.w/2+rad,rad,Math.PI,0);c.lineTo(prod.w/2,prod.h/2);c.closePath();c.clip();}
      else{rr(c,-prod.w/2,-prod.h/2,prod.w,prod.h,rad);c.clip();}
      shadow(c,true,40*sc,22*sc);paintImg(c,img,-prod.w/2,-prod.h/2,prod.w,prod.h,pal);shadow(c,false);
      c.restore();
    }
    c.restore();
    // 材质叠层（矩形卡时）
    if(['rect','round','arch','none'].includes(shape)&&img){
      const rr2={...prod};if(shape!=='none')textureOverlay(c,rr2,pal,g,sc);
    }
    // 产品描边光（轮廓光）
    if(g.light==='rim'&&shape!=='none'){
      c.save();c.strokeStyle=hexToRgba(pal.accent2,.7);c.lineWidth=3*sc;shadow(c,true,24*sc,0);
      if(shape==='circle'||shape==='organic'){const R=Math.min(prod.w,prod.h)/2;c.beginPath();c.arc(prod.x+prod.w/2,prod.y+prod.h/2,R,0,Math.PI*2);c.stroke();}
      else{rr(c,prod.x,prod.y,prod.w,prod.h,shape==='round'?26*sc:6*sc);c.stroke();}
      shadow(c,false);c.restore();
    }

    // 品牌（放在文案区的水平对侧角落，避开按钮与文案）—— 用背景对比色保证任何底色下可见
    const textOnLeft=(tz.x+tz.w/2)<W/2;
    const brandLeft=!textOnLeft;                       // 品牌落在文案对侧
    const brandX=brandLeft?P:W-P;
    c.save();c.globalAlpha=.85;c.fillStyle=pal.text;c.textBaseline='middle';c.textAlign=brandLeft?'left':'right';
    c.font=fontFor(sp,700,Math.min(72*sc,W*.072));
    // 垂直位置选远离文案区的一端，避免与按钮/标题同高度
    const brandY=(tz.y<H*.35)?H-P*0.8:P*0.9;
    c.fillText(String(cp.brand).toUpperCase(),brandX,brandY);
    if(cp.date){c.fillStyle=pal.sub;c.font=fontFor(sp,500,18*sc);c.textAlign=brandLeft?'left':'right';c.fillText(cp.date||'',brandX,brandY+34*sc);}
    c.restore();

    // 文案区（对侧留白），支持斜排 / 侧边竖排 / 横向错落
    c.save();c.translate(tz.x,tz.y);c.rotate(g.textSlant);
    const tw=tz.w,al=tz.align;
    const baseX=al==='center'?tw/2:al==='right'?tw:0;   // 标题主对齐基准
    const ox=v=>v*tw;                                    // 错落偏移（相对文案区宽度）
    let ty=0;
    // 角标（横向错位，不与标题锁在同一垂直线）
    if(cp.tag){c.fillStyle=pal.accent;c.font=fontFor(sp,600,17*sc);c.textAlign=al;c.textBaseline='top';tracked(c,String(cp.tag).toUpperCase(),baseX+ox(g.tagOffset||0),ty,3*sc,al);ty+=38*sc;}
    // 标题（视觉锚点，保持主对齐）
    const t=titleBlock(c,e,g,baseX,ty,tw,al,800,110*sc);ty+=t.h+14*sc;
    // 副标题（相对标题横向错位，形成错落层次）
    ty+=subtitleBlock(c,e,g,baseX+ox(g.subOffset||0),ty,tw-Math.abs(ox(g.subOffset||0)),al,27,g.bodyLines)+18*sc;
    // 卖点
    if(cp.promo){c.fillStyle=pal.accent;c.font=fontFor(sp,700,26*sc);c.textAlign=al;c.textBaseline='top';c.fillText(String(cp.promo).slice(0,14),baseX+ox(g.subOffset||0),ty);ty+=40*sc;}
    // 价格 / 按钮：同排时左右分列，绝不重叠
    const footY=Math.max(ty+10*sc,tz.h-90*sc);
    const hasPrice=!!cp.price, hasCta=!!cp.cta;
    if(hasPrice&&hasCta){
      const pw=Math.max(150*sc,String(cp.price).length*40*sc+70);
      const gap=16*sc;
      const bw=Math.max(150*sc,tw-pw-gap);
      const priceLeft=g.priceSide==='left';
      const px=priceLeft?0:tw-pw;
      const bx=priceLeft?pw+gap:0;
      drawPrice(c,px,footY,cp.price,pal,sc,true);
      drawButton(c,bx,footY,bw,74*sc,cp.cta,pal,sp,sc);
    } else if(hasPrice){
      drawPrice(c,al==='right'?tw-160*sc:al==='center'?tw/2-80*sc:0,footY,cp.price,pal,sc,true);
    } else if(hasCta){
      const bw=Math.max(210*sc,Math.min(tw,W*g.buttonWidth));
      const bx=al==='center'?tw/2-bw/2:al==='right'?tw-bw:0;
      drawButton(c,bx,footY,bw,74*sc,cp.cta,pal,sp,sc);
    }
    c.restore();

    // 印章 / 条码（产品对角空白）
    const sealRight=(prod.x+prod.w/2)<W/2;   // 产品偏左则印章放右
    if(sp.elems.includes('seal'))drawSeal(c,sealRight?W-P-46*sc:P*1.3,prod.y<H/2?H-P-46*sc:P*1.4,60*sc,pal.accent);
    if(sp.elems.includes('barcode'))drawBarcode(c,P,H-P-26*sc,150*sc,24*sc,pal.dark?'rgba(255,255,255,.7)':pal.sub);
    if(sp.elems.includes('qr'))drawQR(c,W-P-72*sc,H-P-72*sc,72*sc,pal.text);
    // 装饰与边框
    drawDecor(c,W,H,sc,pal,g);drawFrame(c,W,H,sc,pal,g);
  };

  /* ===== 主渲染 ===== */
  const SKELETON_NAMES={flow:'纵向流排',columns:'分栏构成',focus:'中心聚焦',overlay:'叠层冲击',diagonal:'对角构成',gridline:'网格内页'};
  function render(){
    const lay=LAYOUTS[state.layout]||LAYOUTS.portrait,W=lay.w,H=lay.h;preview.width=W;preview.height=H;
    const sc=W/1080;const sp=buildSpec();
    const genome=composeGenome(sp,state.genSalt);sp.genome=genome;
    // 文字对比色依据「实际背景」明暗决定，而非配色板——保证任何底色下都清晰可读
    let bgBase;
    if(genome.bgHex) bgBase=genome.bgHex;                       // 用户指定底色优先
    else if(genome.bgType==='lowsat') bgBase=hslToHex(state.extracted!=null?state.extracted:40,.12,.92);
    else bgBase=sp.pal.bg[1];                                   // 默认取中间色（浅底版本已保证浅色）
    const bgDark=relLum(bgBase)<.5;
    sp.pal.text=bgDark?'#ffffff':'#18181b';
    sp.pal.sub=bgDark?'rgba(255,255,255,.78)':'#4b5563';
    sp.pal.dark=bgDark;
    sp.pal.line=bgDark?'rgba(255,255,255,.26)':'rgba(0,0,0,.16)';
    ctx.clearRect(0,0,W,H);
    RENDERERS.freeform(ctx,{W,H,sc,sp,pal:sp.pal,img:sp.img,cp:sp.copy},genome);
    updateRecognized(sp);
    const sz=$('posterSizeLabel');if(sz)sz.textContent=`${W} × ${H}`;
  }

  function updateRecognized(sp){
    const box=$('recognizedBox');if(!box)return;
    const sceneName=sceneLabel(sp.scene);
    const g=sp.genome||{anchor:'CENTER',salt:0};
    const anchorName=ANCHOR_KB[g.anchor]||g.anchor;
    const bgName=g.bgName||({solid:'纯色',gradient:'渐变',texture:'肌理',scene:'简约场景',lowsat:'低饱和'}[g.bgType]||'自主适配');
    const lightName={soft:'柔光',hard:'硬光',rim:'轮廓光',side:'侧光',neon:'霓虹光',studio:'影棚光'}[g.light];
    const texName={matte:'磨砂',glossy:'亮面',metal:'金属',glass:'玻璃',paper:'纸质',fabric:'织物',nature:'自然肌理'}[g.texture];
    const fontName={hand:'手写书法',serif:'衬线宋体',round:'圆润可爱',bold:'粗黑现代'}[sp.font]||sp.font;
    const tags=[`<span class="rec-label">AI 自由生成</span>`,`<span class="rec-tag">场景 · ${sceneName}</span>`,`<span class="rec-tag rec-gen">产品落点 · ${anchorName}</span>`,`<span class="rec-tag">底色 · ${bgName}</span>`,`<span class="rec-tag">字体 · ${fontName}</span>`];
    if(lightName)tags.push(`<span class="rec-tag">光影 · ${lightName}</span>`);
    if(texName)tags.push(`<span class="rec-tag">材质 · ${texName}</span>`);
    if(g.bgName)tags.push(`<span class="rec-tag">指定色 · ${g.bgName}</span>`);
    if(sp.copy.price)tags.push(`<span class="rec-tag">价格 · ¥${sp.copy.price}</span>`);
    if(sp.copy.cta)tags.push(`<span class="rec-tag">按钮 · ${sp.copy.cta}</span>`);
    box.innerHTML=tags.join('');
  }
  function sceneLabel(k){return{wedding:'婚礼请柬',food:'美食餐饮',sale:'促销折扣',tech:'科技发布',music:'音乐演出',movie:'电影影讯',travel:'旅行出游',recruit:'招聘招募',art:'艺术展览',fashion:'时尚服饰',beauty:'美妆护肤',auto:'汽车',game:'游戏电竞',edu:'教育培训',realestate:'房产',公益:'公益倡导'}[k]||(k||'通用设计');}

  /* ===== 应用指令到文案控件 ===== */
  function applySpec(s){
    spec=s;const cp=s.copy;const set=(id,v)=>{const el=$(id);if(el&&v)el.value=v;};
    if(cp.title)set('posterTitle',cp.title);if(cp.subtitle)set('posterSubtitle',cp.subtitle);
    if(cp.brand)set('posterBrand',cp.brand);if(cp.cta)set('posterCta',cp.cta);if(cp.tag)set('posterTag',cp.tag);
    if(cp.price){state.price=cp.price;set('posterPrice',cp.price);}else{state.price='';const pe=$('posterPrice');if(pe)pe.value='';}if(cp.date)state.date=cp.date;
    state.title=cp.title||state.title;state.subtitle=cp.subtitle||state.subtitle;state.brand=cp.brand||state.brand;
    state.cta=cp.cta||state.cta;state.tag=cp.tag||state.tag;
    document.querySelectorAll('.theme-card').forEach(b=>b.classList.toggle('active',b.dataset.theme===s.paletteKey));
  }

  /* ===== 事件绑定 ===== */
  let _lastCount=-1;
  function updateCount(){
    const el=$('promptCount');if(!el||!promptInput)return;
    const n=promptInput.value.length;
    if(n!==_lastCount){_lastCount=n;el.textContent=`已输入 ${n} 字 · 不限字数`;}
  }
  // 覆盖所有输入方式：键盘、粘贴、剪切、中文输入法、拖拽、自动填充
  ['input','change','keyup','paste','cut','compositionend','drop','focus','blur'].forEach(ev=>promptInput?.addEventListener(ev,()=>setTimeout(updateCount,0)));
  updateCount();
  // 轮询兜底：兼容浏览器「恢复表单」/扩展自动填充等不派发事件的情况
  const countTimer=setInterval(updateCount,400);
  window.addEventListener('pageshow',updateCount);
  window.addEventListener('load',updateCount);

  function loadImage(file){
    if(!file||!file.type.startsWith('image/'))return;
    const rd=new FileReader();rd.onload=e=>{const img=new Image();img.onload=()=>{
      state.image=img;if(thumb){thumb.src=e.target.result;thumb.style.display='block';}
      const ph=$('productPlaceholder');if(ph)ph.style.display='none';if(fileName)fileName.textContent=file.name;
      if(state.smartColor){state.extracted=extractHue(img);if(state.extracted!=null)updatePalettePreview(state.extracted);}
      render();toast('产品图已载入 · 配色已智能调和');
    };img.src=e.target.result;};rd.readAsDataURL(file);
  }
  fileInput?.addEventListener('change',e=>{if(e.target.files[0])loadImage(e.target.files[0]);});
  if(dropZone){['dragenter','dragover'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.add('drag');}));['dragleave','drop'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.remove('drag');}));dropZone.addEventListener('drop',e=>{if(e.dataTransfer.files[0])loadImage(e.dataTransfer.files[0]);});dropZone.addEventListener('click',()=>fileInput?.click());}
  smartToggle?.addEventListener('change',e=>{state.smartColor=e.target.checked;if(!state.smartColor){state.extracted=null;const box=$('palettePreview');if(box){box.innerHTML='<span></span><span></span><span></span><span></span><em>上传图片后自动生成专属配色</em>';box.classList.remove('ready');}}else if(state.image){state.extracted=extractHue(state.image);if(state.extracted!=null)updatePalettePreview(state.extracted);}render();});

  function doGenerate(bump){
    const txt=promptInput?.value||'';const s=parseInstruction(txt);applySpec(s);
    if(bump)state.genSalt++;
    render();preview?.classList.add('flash');setTimeout(()=>preview?.classList.remove('flash'),500);
    const g=state.genSalt;
    toast(`已自由生成 · ${sceneLabel(s.scene)} · 第 ${g+1} 版`);
  }
  genBtn?.addEventListener('click',()=>doGenerate(true));
  $('regenPosterBtn')?.addEventListener('click',()=>{
    state.genSalt++;render();preview?.classList.add('flash');setTimeout(()=>preview?.classList.remove('flash'),500);
    toast(`换一版 · 第 ${state.genSalt+1} 版`);
  });
  promptInput?.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))genBtn?.click();});
  document.querySelectorAll('.prompt-chip').forEach(chip=>chip.addEventListener('click',()=>{promptInput.value=chip.dataset.prompt;updateCount();doGenerate(false);}));
  $('inspireBtn')?.addEventListener('click',()=>{
    const ins=INSPIRATIONS[Math.floor(Math.random()*INSPIRATIONS.length)];
    if(promptInput){promptInput.value=ins.prompt;updateCount();}applySpec(parseInstruction(ins.prompt));state.genSalt=0;
    render();preview?.classList.add('flash');setTimeout(()=>preview?.classList.remove('flash'),500);
    toast(`灵感已生成 · ${sceneLabel(ins.scene)}`);
  });

  document.querySelectorAll('.theme-card').forEach(b=>b.addEventListener('click',()=>{
    state.theme=b.dataset.theme;if(spec){spec.paletteKey=b.dataset.theme;spec.style=null;spec.colorHex=null;}
    document.querySelectorAll('.theme-card').forEach(x=>x.classList.toggle('active',x===b));render();
  }));
  document.querySelectorAll('.layout-btn').forEach(b=>b.addEventListener('click',()=>{state.layout=b.dataset.layout;document.querySelectorAll('.layout-btn').forEach(x=>x.classList.toggle('active',x===b));render();}));
  document.querySelectorAll('.decor-toggle').forEach(cb=>cb.addEventListener('change',()=>{state.decor[cb.dataset.decor]=cb.checked;render();}));
  ['posterTitle','posterSubtitle','posterBrand','posterCta','posterTag','posterPrice'].forEach(id=>{
    $(id)?.addEventListener('input',e=>{const m={posterTitle:'title',posterSubtitle:'subtitle',posterBrand:'brand',posterCta:'cta',posterTag:'tag'};if(id==='posterPrice'){state.price=e.target.value;}else state[m[id]]=e.target.value;render();});
  });
  downloadBtn?.addEventListener('click',()=>{render();const a=document.createElement('a');a.href=preview.toDataURL('image/png');a.download=`商业海报_${sceneLabel(spec?.scene||'通用')}_${Date.now()}.png`;a.click();toast('高清海报已下载（PNG）');});

  function toast(msg){let el=$('siteToast');if(!el){el=document.createElement('div');el.id='siteToast';el.style.cssText='position:fixed;left:50%;bottom:32px;transform:translateX(-50%) translateY(20px);background:#0f2a5a;color:#fff;padding:10px 20px;border-radius:100px;font-size:.85rem;box-shadow:0 10px 30px rgba(0,0,0,.25);z-index:300;opacity:0;transition:.3s;pointer-events:none';document.body.appendChild(el);}el.textContent=msg;requestAnimationFrame(()=>{el.style.opacity='1';el.style.transform='translateX(-50%) translateY(0)';});clearTimeout(el._t);el._t=setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(-50%) translateY(20px)';},2400);}

  // 初始：按默认提示词解析，确保首屏就是「指令驱动」的结果
  applySpec(parseInstruction(promptInput?.value||''));
  render();
}
