/* =========================================================================
   VOIR // 3D INTERACTIVE MONOCHROME NOIR BLIND BOX
   ========================================================================= */

// 1. 盲盒与迷幻文案数据源（完全隐去世俗谜底）
const BOX_REGISTRY = [
  {
    id: 1,
    name: "TRACK 01 // OVERDRIVE·失真纪元",
    code: "FREQ-01-OVERDRIVE",
    title: "UNRESTRICTED FREQUENCY // 无限音场通行黑卡",
    clues: [
      "[ CLUE 01 // FREQUENCY ]：监测到无损高阶声轨，内部封存着无数段未经压缩的午夜失眠。",
      "[ CLUE 02 // SUBSTANCE ]：没有物理重量，但足以买断未来漫长黑夜里所有被音墙包围的特权。",
      "[ CLUE 03 // ECHO ]：一圈永不休止的虚拟纯黑密纹，允许你无限制潜入世界最深处的混响。"
    ],
    manifest: "给耳朵以永恒的避难所。\n在所有被现实切碎的时刻，你拥有随时沉入最高精度声波的绝对自由。\n纯黑密纹已经为你永久通电，所有被锁住的旋律与 B-Side，从此全部对你解除禁制。\n// 去听吧，直到失真。"
  },
  {
    id: 2,
    name: "TRACK 02 // VINYL·纯黑回声",
    code: "MATTER-02-BITTERSWEET",
    title: "CRYOGENIC DARK MATTER // 极低温黑体共振块",
    clues: [
      "[ CLUE 01 // FREQUENCY ]：极度深黑的多孔致密晶格结构，内部带有冰点固化的轻盈脆响。",
      "[ CLUE 02 // SUBSTANCE ]：极硬的暗色外壳撞击声清脆，包裹着某种酸甜而失重的核心。",
      "[ CLUE 03 // ECHO ]：在牙齿咬碎轰鸣的瞬间，苦涩与剧烈多巴胺会同时在神经末梢失控。"
    ],
    manifest: "深空黑曜石般的质感，在接触温度的瞬间崩解。\n先是纯正深黑的微苦，紧接着是果实炸裂开的酸甜回甘。\n当大脑需要从低频疲惫中苏醒时，咬碎它——\n这是属于你的即时多巴胺充能阵列。"
  },
  {
    id: 3,
    name: "TRACK 03 // FEEDBACK·异界频率",
    code: "NODE-03-SIGNAL",
    title: "ANOMALOUS CUSHION NODE // 异界情绪缓震节点",
    clues: [
      "[ CLUE 01 // FREQUENCY ]：具有记忆反弹特性的微缩软体，内部嵌入了一枚微弱的电磁线圈。",
      "[ CLUE 02 // SUBSTANCE ]：重量轻若无物，专为抵御坠落、焦虑与无处安放的手指而设计。",
      "[ CLUE 03 // ECHO ]：靠近设备感应区，它会向你传递一段只属于你的加密短波。"
    ],
    manifest: "一个可以捏在手心、随身携带的微型重力避风港。\n它是柔软的缓冲介质，也是一枚隐秘的近场信标。\n当你的设备贴近它的核心，那串只对你生效的私密波长就会被即刻读取。\n情绪颠簸时，捏紧它；它替你吸收所有余震。"
  },
  {
    id: 4,
    name: "TRACK 04 // NOISE WALL·音墙余烬",
    code: "FLUID-04-NOISEWALL",
    title: "CALORIC CURRENT RELIEF // 高能流体缓释凭证",
    clues: [
      "[ CLUE 01 // FREQUENCY ]：封存着高密度可流动介质，内部伴随着微型晶体与流体的持续碰撞。",
      "[ CLUE 02 // SUBSTANCE ]：具备打破低气压的即时热量传导率，能将干涸神经末梢拉回常温。",
      "[ CLUE 03 // ECHO ]：在任何坐标的暴风雨天，只要通电呼叫，就能召唤一剂填补空虚的流体热潮。"
    ],
    manifest: "在所有被冷空气与噪音淹没的时刻，按下召唤键。\n它是为你定制的液体缓释剂，不论是沸腾的微苦温热，还是碎冰撞击的极寒甜度。\n凭此信标向我发射信号——无论何时何地，即刻承兑、跨越距离送达你的手中。\n// 频率常开，终身有效。"
  }
];

// 2. 状态机与全局变量
const STORAGE_KEY = "VOIR_LOCKED_MANIFEST_AUTH";
let currentStep = 'INTRO'; // 'INTRO' | 'STAVE' | 'FOCUS_BOX' | 'UNBOXED'
let selectedBoxIndex = null;
let shakeCount = 0;
let lastShakeTime = 0;
let isLocked = false;

// 3. Three.js 场景对象
let scene, camera, renderer;
let waveMesh, staveLinesGroup, boxesGroup, cardMesh;
let raycaster, mouse;
let audioContext, analyser, audioSource, dataArray;
let isAudioActive = false;

// DOM 元素
const audioEl = document.getElementById('audio-player');
const screenIntro = document.getElementById('screen-intro');
const screenBoxUi = document.getElementById('screen-box-ui');
const screenManifest = document.getElementById('screen-manifest');
const systemStatus = document.getElementById('system-status');
const btnEnter = document.getElementById('btn-enter');
const btnCancel = document.getElementById('btn-cancel');
const btnUnlock = document.getElementById('btn-unlock');

window.addEventListener('DOMContentLoaded', () => {
  initThree();
  checkLocalStorageLock();
  bindEvents();
  animate();
});

// 检查本地持久化锁定
function checkLocalStorageLock() {
  const savedRecord = localStorage.getItem(STORAGE_KEY);
  if (savedRecord) {
    const data = JSON.parse(savedRecord);
    isLocked = true;
    showPermanentManifest(data);
  }
}

// 初始化 Three.js 引擎
function initThree() {
  const canvas = document.getElementById('webgl-canvas');
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080808, 0.035);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 18);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 灯光设计：冷白轮廓光 + 极暗环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
  mainLight.position.set(10, 20, 15);
  scene.add(mainLight);

  const rimLight = new THREE.PointLight(0xffffff, 2, 50);
  rimLight.position.set(-15, -10, -10);
  scene.add(rimLight);

  createWaveVisualizer();
  createStaveAndBoxes();
  create3DCardMesh();
}

// 创建第 1 幕：3D 音频丝带波
function createWaveVisualizer() {
  const geometry = new THREE.PlaneGeometry(30, 6, 64, 16);
  const material = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    wireframe: true,
    roughness: 0.2,
    metalness: 0.8
  });
  waveMesh = new THREE.Mesh(geometry, material);
  waveMesh.rotation.x = -Math.PI / 4;
  waveMesh.position.set(0, 0, 0);
  scene.add(waveMesh);
}

// 创建第 3 幕：五线谱星轨 + 4个黑曜石几何盲盒
function createStaveAndBoxes() {
  staveLinesGroup = new THREE.Group();
  boxesGroup = new THREE.Group();

  // 构建 5 条流线型五线谱轨道
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.6 });
  for (let i = -2; i <= 2; i++) {
    const points = [];
    for (let x = -20; x <= 20; x += 1) {
      points.push(new THREE.Vector3(x, i * 0.8 + Math.sin(x * 0.3) * 0.5, Math.cos(x * 0.2) * 2));
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeo, lineMaterial);
    staveLinesGroup.add(line);
  }
  staveLinesGroup.position.set(0, 0, -5);
  staveLinesGroup.visible = false;
  scene.add(staveLinesGroup);

  // 4 个黑曜石几何盲盒
  const boxGeometry = new THREE.BoxGeometry(1.8, 2.2, 1.8);
  const boxMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.9,
    roughness: 0.15,
    wireframe: false
  });

  const positions = [
    { x: -6, y: 1.2, z: -4 },
    { x: -2, y: -0.8, z: -3 },
    { x: 2.2, y: 1.5, z: -4 },
    { x: 6.2, y: -0.5, z: -5 }
  ];

  positions.forEach((pos, idx) => {
    const box = new THREE.Mesh(boxGeometry, boxMaterial.clone());
    box.position.set(pos.x, pos.y, pos.z);
    box.userData = { id: idx + 1, basePos: { ...pos }, originalScale: 1 };
    
    // 线框描边
    const edgeGeo = new THREE.EdgesGeometry(boxGeometry);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    const wireframe = new THREE.LineSegments(edgeGeo, edgeMat);
    box.add(wireframe);

    boxesGroup.add(box);
  });

  boxesGroup.visible = false;
  scene.add(boxesGroup);
}

// 创建第 5 幕：3D 解密悬浮卡片
function create3DCardMesh() {
  const cardGeo = new THREE.BoxGeometry(4, 6, 0.05);
  const cardMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.8,
    roughness: 0.2
  });
  cardMesh = new THREE.Mesh(cardGeo, cardMat);
  cardMesh.position.set(0, 0, 5);
  cardMesh.visible = false;
  scene.add(cardMesh);
}

// 音频初始化
function setupAudio() {
  if (isAudioActive) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 64;
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  audioSource = audioContext.createMediaElementSource(audioEl);
  audioSource.connect(analyser);
  analyser.connect(audioContext.destination);

  audioEl.play().catch(() => {});
  isAudioActive = true;
}

// 事件绑定
function bindEvents() {
  // 点击启动
  btnEnter.addEventListener('click', () => {
    setupAudio();
    systemStatus.innerText = "STATUS: RESONATING";
    
    gsap.to(screenIntro, {
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
        screenIntro.classList.remove('active');
        transitionToStave();
      }
    });
  });

  // 视口调整
  window.addEventListener('resize', onWindowResize);

  // 鼠标 / 触摸选盒点击
  window.addEventListener('pointerdown', onPointerDown);

  // 桌面端鼠标拖拽摇晃
  let isDragging = false;
  let startX = 0;
  window.addEventListener('mousedown', (e) => { isDragging = true; startX = e.clientX; });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging || currentStep !== 'FOCUS_BOX') return;
    if (Math.abs(e.clientX - startX) > 40) {
      triggerShake();
      startX = e.clientX;
    }
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  // 手机端陀螺仪摇晃检测
  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', (e) => {
      if (currentStep !== 'FOCUS_BOX') return;
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const speed = Math.abs(acc.x + acc.y + acc.z);
      if (speed > 25) {
        triggerShake();
      }
    });
  }

  // 抉择按键
  btnCancel.addEventListener('click', resetToStave);
  btnUnlock.addEventListener('click', executeUnbox);
}

// 从音波过渡到五线谱星轨
function transitionToStave() {
  currentStep = 'STAVE';
  systemStatus.innerText = "STATUS: SELECT_TRACK";

  gsap.to(waveMesh.position, { y: -20, duration: 1.2, ease: "power3.in" });
  staveLinesGroup.visible = true;
  boxesGroup.visible = true;

  gsap.from(boxesGroup.position, { z: -30, duration: 1.5, ease: "power3.out" });
  gsap.to(camera.position, { z: 12, duration: 1.5 });
}

// 点击拾取盲盒
function onPointerDown(e) {
  if (currentStep !== 'STAVE') return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(boxesGroup.children);

  if (intersects.length > 0) {
    const targetBox = intersects[0].object;
    focusOnBox(targetBox);
  }
}

// 聚焦选中盲盒
function focusOnBox(box) {
  currentStep = 'FOCUS_BOX';
  selectedBoxIndex = box.userData.id - 1;
  const boxData = BOX_REGISTRY[selectedBoxIndex];

  systemStatus.innerText = `LOCKED: TRACK 0${boxData.id}`;
  document.getElementById('track-indicator').innerText = boxData.name;

  // 相机推进聚焦
  gsap.to(camera.position, {
    x: box.position.x,
    y: box.position.y,
    z: box.position.z + 4.5,
    duration: 1.2,
    ease: "power2.inOut"
  });

  screenBoxUi.classList.add('active');
  resetShakeState();
}

// 摇晃状态机
function triggerShake() {
  const now = Date.now();
  if (now - lastShakeTime < 300) return; // 防抖
  lastShakeTime = now;

  shakeCount++;
  const activeBox = boxesGroup.children[selectedBoxIndex];

  // 物理抖动动效
  gsap.to(activeBox.rotation, {
    x: (Math.random() - 0.5) * 0.8,
    y: (Math.random() - 0.5) * 0.8,
    z: (Math.random() - 0.5) * 0.8,
    duration: 0.1,
    yoyo: true,
    repeat: 3,
    onComplete: () => {
      gsap.to(activeBox.rotation, { x: 0, y: 0, z: 0, duration: 0.2 });
    }
  });

  // 更新进度与线索
  const fillPercent = Math.min((shakeCount / 3) * 100, 100);
  document.getElementById('shake-fill').style.width = `${fillPercent}%`;

  const boxData = BOX_REGISTRY[selectedBoxIndex];
  if (shakeCount >= 1) revealClue(1, boxData.clues[0]);
  if (shakeCount >= 2) revealClue(2, boxData.clues[1]);
  if (shakeCount >= 3) {
    revealClue(3, boxData.clues[2]);
    document.getElementById('shake-prompt').style.display = 'none';
    document.getElementById('decision-group').classList.add('show');
  }
}

function revealClue(index, text) {
  const clueEl = document.getElementById(`clue-${index}`);
  if (!clueEl.classList.contains('show')) {
    clueEl.innerText = text;
    clueEl.classList.add('show');
  }
}

function resetShakeState() {
  shakeCount = 0;
  document.getElementById('shake-fill').style.width = '0%';
  document.getElementById('shake-prompt').style.display = 'flex';
  document.getElementById('decision-group').classList.remove('show');
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`clue-${i}`);
    el.innerText = '';
    el.classList.remove('show');
  }
}

// 封存并返回五线谱
function resetToStave() {
  currentStep = 'STAVE';
  screenBoxUi.classList.remove('active');
  systemStatus.innerText = "STATUS: SELECT_TRACK";

  gsap.to(camera.position, { x: 0, y: 0, z: 12, duration: 1 });
}

// 执行终极解密与破壳
function executeUnbox() {
  currentStep = 'UNBOXED';
  screenBoxUi.classList.remove('active');
  systemStatus.innerText = "STATUS: DECRYPTED_FOREVER";

  const targetBox = boxesGroup.children[selectedBoxIndex];
  const boxData = BOX_REGISTRY[selectedBoxIndex];

  // 爆破解构动效
  gsap.to(targetBox.scale, {
    x: 2.5, y: 2.5, z: 2.5,
    duration: 0.3,
    ease: "power2.out",
    onComplete: () => {
      targetBox.visible = false;
      boxesGroup.visible = false;
      staveLinesGroup.visible = false;
      
      // 永久写入本地 LocalStorage
      const record = {
        boxId: boxData.id,
        code: boxData.code,
        title: boxData.title,
        manifest: boxData.manifest,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      
      // 展示终极信笺
      showPermanentManifest(record);
    }
  });
}

// 展示永久印记页面
function showPermanentManifest(data) {
  currentStep = 'UNBOXED';
  systemStatus.innerText = "STATUS: PERMANENT_ARCHIVE";

  document.getElementById('manifest-code').innerText = data.code;
  document.getElementById('manifest-title').innerText = data.title;
  document.getElementById('manifest-text').innerText = data.manifest;
  document.getElementById('manifest-time').innerText = `TIMESTAMP: ${data.time}`;

  if (waveMesh) waveMesh.visible = false;
  if (boxesGroup) boxesGroup.visible = false;
  if (staveLinesGroup) staveLinesGroup.visible = false;

  cardMesh.visible = true;
  gsap.fromTo(camera.position, { z: 20 }, { z: 8, duration: 1.5, ease: "power3.out" });

  screenManifest.classList.add('active');
}

// 动画渲染循环
function animate() {
  requestAnimationFrame(animate);

  // 音频跳动关联
  if (analyser && dataArray && currentStep === 'INTRO') {
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    waveMesh.geometry.attributes.position.needsUpdate = true;
    const pos = waveMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      pos.setZ(i, Math.sin(u * 0.5 + Date.now() * 0.003) * (avg * 0.04));
    }
  }

  // 盲盒在五线谱上的漂浮动效
  if (currentStep === 'STAVE' && boxesGroup) {
    const time = Date.now() * 0.0015;
    boxesGroup.children.forEach((b, i) => {
      b.position.y = b.userData.basePos.y + Math.sin(time + i * 1.5) * 0.2;
      b.rotation.y += 0.008;
      b.rotation.x += 0.004;
    });
  }

  // 解密卡片微幅 3D 浮动自转
  if (cardMesh && cardMesh.visible) {
    const time = Date.now() * 0.001;
    cardMesh.rotation.y = Math.sin(time) * 0.15;
    cardMesh.rotation.x = Math.cos(time * 0.8) * 0.08;
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
