// main.js — selezione + avvio minigiochi (BG2)

const BASE_W = 320;
const BASE_H = 180;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// === Asset paths ===
const sheriffBaseFramesPaths = [
  "assets/sheriff/sheriff_base.png",
  "assets/sheriff/sheriff_wave1.png",
  "assets/sheriff/sheriff_wave2.png"
];

const uniformPaths = [
  "assets/sheriff/uniform_0.png",
  "assets/sheriff/uniform_1.png",
  "assets/sheriff/uniform_2.png",
  "assets/sheriff/uniform_3.png",
];

const sheriffBaseCrouchPath = "assets/sheriff/sheriff_base_crouch.png";

const uniformCrouchPaths = [
  "assets/sheriff/uniform_0_crouch.png",
  "assets/sheriff/uniform_1_crouch.png",
  "assets/sheriff/uniform_2_crouch.png",
  "assets/sheriff/uniform_3_crouch.png",
];

const gunStandPath = "assets/sheriff/gun.png";
const gunCrouchPath = "assets/sheriff/gun_crouch.png";

const enemyBasePath = "assets/enemy/enemy_base.png";
const enemyCrouchPath = "assets/enemy/enemy_crouch.png";



const bgPaths = [
  "assets/backgrounds/bg_0.png",
  "assets/backgrounds/bg_1.png",
  "assets/backgrounds/bg_2.png",
];

const bg2ClockPaths = [
  "assets/bg2/clock_full.png",
  "assets/bg2/clock_75.png",
  "assets/bg2/clock_50.png",
  "assets/bg2/clock_25.png",
  "assets/bg2/clock_empty.png"
];

// ✅ Metti qui i nomi *esatti* dei tuoi nuovi sprite
// (Crea la cartella assets/bg2/ e mettici dentro i PNG)
const bg2WaspPath = "assets/bg2/bullet.png";
const bg2HeartFullPath  = "assets/bg2/heart_full.png";
const bg2HeartHalfPath  = "assets/bg2/heart_half.png";
const bg2HeartEmptyPath = "assets/bg2/heart_empty.png";
const bg2DigitsPath = "assets/bg2/digits.png";
const reloadIconPath = "assets/bg3/reload.png"; 

let bg2DigitsImg = null;



// === Stato selezione ===
let currentUniform = 0;
let currentBackground = 0;
let bg2ClockImgs = [];

let jumpAnim = null; // { startTime, duration }
let waveAnim = null;

// === Stato gioco ===
const GameState = {
  SELECT: "select",
  MODE_SELECT: "mode_select",
  BG2: "bg2",
  BG3: "bg3"
};


let gameState = GameState.SELECT;

// Input condiviso
const keysDown = new Set();

// === Caricamento immagini ===
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Errore caricando: " + src));
    img.src = src;
  });
}

let sheriffBaseFrames = [];
let enemyBaseImg = null;
let enemyCrouchImg = null;

let reloadIconImg = null;


let uniformImgs = [];
let bgImgs = [];

let bg2WaspImg = null;
let bg2HeartFullImg = null;
let bg2HeartHalfImg = null;
let bg2HeartEmptyImg = null;
let sheriffBaseCrouchImg = null;
let uniformCrouchImgs = [];

let gunStandImg = null;
let gunCrouchImg = null;


const DESIGN_W = 1280;
const DESIGN_H = 720;

const stage = document.querySelector(".stage");
const uiOverlay = document.querySelector(".ui");

function applyIntegerScale() {
  const vv = window.visualViewport;
  const viewW = vv ? vv.width : window.innerWidth;
  const viewH = vv ? vv.height : window.innerHeight;

  const scaleX = Math.floor((viewW * 0.95) / DESIGN_W);
  const scaleY = Math.floor((viewH * 0.90) / DESIGN_H);
  const scale = Math.max(1, Math.min(scaleX, scaleY));

  stage.style.width = `${DESIGN_W * scale}px`;
  stage.style.height = `${DESIGN_H * scale}px`;

  canvas.style.width = `${DESIGN_W * scale}px`;
  canvas.style.height = `${DESIGN_H * scale}px`;

  uiOverlay.style.transform = `scale(${scale})`;
  uiOverlay.style.transformOrigin = "top left";
}

function wrapIndex(i, len) {
  return (i % len + len) % len;
}

// Animazioni selezione
function triggerWave() {
  waveAnim = { frames: [0,1,2,1,0,1,2,1,0], index: 0, lastTime: performance.now() };
}
function triggerJump() {
  jumpAnim = { startTime: performance.now(), duration: 350 };
}

// === Input ===
window.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) {
    e.preventDefault();
  }
  keysDown.add(e.key);

  if (gameState === GameState.SELECT) {
    if (e.key === "Enter" && !e.repeat) {
      try { enterBg2(); } catch (err) { console.error(err); }
      return;
    }

    switch (e.key) {
      case "ArrowLeft":
        currentUniform = wrapIndex(currentUniform - 1, uniformImgs.length);
        triggerJump(); triggerWave();
        break;
      case "ArrowRight":
        currentUniform = wrapIndex(currentUniform + 1, uniformImgs.length);
        triggerJump(); triggerWave();
        break;
      case "ArrowUp":
        currentBackground = wrapIndex(currentBackground - 1, bgImgs.length);
        break;
      case "ArrowDown":
        currentBackground = wrapIndex(currentBackground + 1, bgImgs.length);
        break;
    }
  }
});

canvas.addEventListener("pointerdown", (e) => {
  if (gameState !== GameState.BG3) return;
  if (!bg3Game) return;

  e.preventDefault();
  bg3Game.shootPlayer();
});


window.addEventListener("keyup", (e) => keysDown.delete(e.key));

// Click UI — solo in SELECT
document.getElementById("uniform_prev").addEventListener("click", () => {
  if (gameState !== GameState.SELECT) return;
  currentUniform = wrapIndex(currentUniform - 1, uniformImgs.length);
  triggerJump(); triggerWave();
});
document.getElementById("uniform_next").addEventListener("click", () => {
  if (gameState !== GameState.SELECT) return;
  currentUniform = wrapIndex(currentUniform + 1, uniformImgs.length);
  triggerJump(); triggerWave();
});
document.getElementById("bg_prev").addEventListener("click", () => {
  if (gameState !== GameState.SELECT) return;
  currentBackground = wrapIndex(currentBackground - 1, bgImgs.length);
});
document.getElementById("bg_next").addEventListener("click", () => {
  if (gameState !== GameState.SELECT) return;
  currentBackground = wrapIndex(currentBackground + 1, bgImgs.length);
});

const startBtn = document.getElementById("start_button");

let starting = false;

function syncSelectUI() {
  if (gameState !== GameState.SELECT) {
    startBtn.style.display = "none";
    startBtn.disabled = true;
    return;
  }

  // Sempre visibile in SELECT
  startBtn.style.display = "";
  startBtn.disabled = starting;
}


function setStartEnabled(enabled) {
  startBtn.disabled = !enabled;
  startBtn.style.pointerEvents = enabled ? "" : "none";
}

startBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();

  if (gameState !== GameState.SELECT) return;
  if (starting) return;

  starting = true;
  syncSelectUI();

  try {
    gameState = GameState.MODE_SELECT;

document.getElementById("mode_select").style.display = "";
startBtn.style.display = "none";

  } catch (err) {
    console.error(err);
    starting = false;
    syncSelectUI();
    alert("Errore avvio gioco, guarda la console.");
  }
});




// === Render SELECT ===
function drawStartScreen() {
  const bg = bgImgs[currentBackground];
  ctx.clearRect(0, 0, BASE_W, BASE_H);
  ctx.drawImage(bg, 0, 0);

  const sheriffX = Math.floor((BASE_W - 48) / 2);
  const sheriffY = BASE_H - 48 - 10;

  let yOffset = 0;
  if (jumpAnim) {
    const t = (performance.now() - jumpAnim.startTime) / jumpAnim.duration;
    if (t >= 1) jumpAnim = null;
    else yOffset = -Math.sin(t * Math.PI) * 10;
  }

  let frameIndex = 0;
  if (waveAnim) {
    const now = performance.now();
    if (now - waveAnim.lastTime > 100) {
      waveAnim.index++;
      waveAnim.lastTime = now;
      if (waveAnim.index >= waveAnim.frames.length) waveAnim = null;
    }
    if (waveAnim) frameIndex = waveAnim.frames[waveAnim.index];
  }

  ctx.drawImage(sheriffBaseFrames[frameIndex], sheriffX, sheriffY + yOffset);
  ctx.drawImage(uniformImgs[currentUniform], sheriffX, sheriffY + yOffset);

  ctx.font = "10px system-ui";
  ctx.fillStyle = "rgba(255,255,255,.85)";
}

// === BG2 integration ===
let bg2Game = null;
let bg2Phase = Bg2Phase.INTRO;
let bg3Game = null;


const bg2UI = document.getElementById("bg2_ui");
const bg2Intro = document.getElementById("bg2_intro");
const bg2IntroCta = document.getElementById("bg2_intro_cta");
const bg2End = document.getElementById("bg2_end");
const bg2Replay = document.getElementById("bg2_replay");

const modeSelect = document.getElementById("mode_select");
const modeBg2 = document.getElementById("mode_bg2");
const modeBg3 = document.getElementById("mode_bg3");

modeBg2.addEventListener("pointerdown", () => {
  modeSelect.style.display = "none";
  enterBg2();
});

modeBg3.addEventListener("pointerdown", () => {
  modeSelect.style.display = "none";
  enterBg3();
});


bg2IntroCta.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (gameState === GameState.BG2) startBg2Play();
  if (gameState === GameState.BG3) startBg3Play();
});


window.addEventListener("keydown", (e) => {
  if (bg2Phase !== Bg2Phase.INTRO) return;
  if (e.key !== "Enter" || e.repeat) return;

  if (gameState === GameState.BG2) startBg2Play();
  if (gameState === GameState.BG3) startBg3Play();
});

bg2Replay.addEventListener("pointerdown", (e) => {
  e.preventDefault();

  // ✅ ora vale sia per BG2 che per BG3
  if (gameState !== GameState.BG2 && gameState !== GameState.BG3) return;

  exitToSelect();
});



function enterBg2() {
  gameState = GameState.BG2;
  starting = false;

  if (uiOverlay) uiOverlay.style.display = "none";

  // mostra overlay BG2
  bg2UI.style.display = "";
  bg2Phase = Bg2Phase.INTRO;
  bg2Intro.style.display = "";
  bg2End.style.display = "none";
  bg2IntroCta.style.display = "";



  // crea gioco se serve
  if (!window.BG2 || typeof window.BG2.create !== "function") {
    console.error("BG2 non disponibile.");
    exitToSelect();
    return;
  }
 bg2Game = window.BG2.create({ BASE_W, BASE_H, keysDown });

}
function startBg2Play() {
  if (gameState !== GameState.BG2) return;
  if (bg2Phase !== Bg2Phase.INTRO) return;

  bg2Phase = Bg2Phase.PLAYING;
  bg2Intro.style.display = "none";
  bg2IntroCta.style.display = "none";

  bg2Game.start(); // ora parte davvero il timer
}




function exitToSelect() {
  gameState = GameState.SELECT;

  if (modeSelect) modeSelect.style.display = "none";
  if (startBtn) startBtn.style.display = "";
  if (uiOverlay) uiOverlay.style.display = "";
  if (bg2UI) bg2UI.style.display = "none";
  if (bg2Intro) bg2Intro.style.display = "none";
if (bg2End) bg2End.style.display = "none";


  bg2Phase = Bg2Phase.INTRO;

  starting = false;
  keysDown.clear();
  syncSelectUI();
}
function enterBg3() {
  gameState = GameState.BG3;

  // nascondi la UI di selezione
  if (uiOverlay) uiOverlay.style.display = "none";

  // ✅ RIUSA la UI di BG2
  bg2UI.style.display = "";
  bg2Phase = Bg2Phase.INTRO;

  // cambia testo intro per BG3
  const introText = document.getElementById("bg2_intro_text");
  if (introText) {
    introText.textContent =
      "DUELLO!\n\nClick sinistro: spara\nSpace: accovacciati per schivare";
  }

  bg2Intro.style.display = "";
  bg2IntroCta.style.display = "";
  bg2End.style.display = "none";

  // crea BG3
  if (!window.BG3 || typeof window.BG3.create !== "function") {
    console.error("BG3 non disponibile.");
    exitToSelect();
    return;
  }

  bg3Game = window.BG3.create({ BASE_W, BASE_H, keysDown });
}
function startBg3Play() {
  if (gameState !== GameState.BG3) return;
  if (bg2Phase !== Bg2Phase.INTRO) return;

  bg2Phase = Bg2Phase.PLAYING;
  bg2Intro.style.display = "none";
  bg2IntroCta.style.display = "none";

  bg3Game.start();
}



// === Loop ===
// === Loop ===
let lastT = performance.now();

function loop() {
  const now = performance.now();
  const dt = (now - lastT) / 1000;
  lastT = now;

  if (gameState === GameState.SELECT || gameState === GameState.MODE_SELECT) {
  drawStartScreen();
  } else if (gameState === GameState.BG2) {
    // Se BG2 non è stato creato (o c'è stato un errore), torna alla selezione
    if (!bg2Game) {
      exitToSelect();
    } else {
      bg2Game.update(dt);
      



if (bg2Game.ended && bg2Phase !== Bg2Phase.ENDED) {
  bg2Phase = Bg2Phase.ENDED;
  bg2End.style.display = "block";

}



   bg2Game.draw(ctx, {
  bg: bgImgs[currentBackground],
  sheriffBase: sheriffBaseFrames[0],
  uniform: uniformImgs[currentUniform],
  waspImg: bg2WaspImg,
  heartFull: bg2HeartFullImg,
  heartHalf: bg2HeartHalfImg,
  heartEmpty: bg2HeartEmptyImg,
  clockImgs: bg2ClockImgs,  // ← QUI
  digitsImg: bg2DigitsImg

});

    }
  } else if (gameState === GameState.BG3) {
  if (!bg3Game) {
    exitToSelect();
  } else {
    bg3Game.update(dt);

    bg3Game.draw(ctx, {
  bg: bgImgs[currentBackground],

  sheriffBase: sheriffBaseFrames[0],
  sheriffBaseCrouch: sheriffBaseCrouchImg,
  uniform: uniformImgs[currentUniform],
  uniformCrouch: uniformCrouchImgs[currentUniform],
  gunStand: gunStandImg,
  gunCrouch: gunCrouchImg,

  enemyBase: enemyBaseImg,
  enemyCrouch: enemyCrouchImg,

  reloadIcon: reloadIconImg,


  bulletImg: bg2WaspImg,

  heartFull: bg2HeartFullImg,
  heartHalf: bg2HeartHalfImg,
  heartEmpty: bg2HeartEmptyImg
});




    if (bg3Game.ended && bg2Phase !== Bg2Phase.ENDED) {
      bg2Phase = Bg2Phase.ENDED;
      bg2End.style.display = "block";
    }
  }
}


  requestAnimationFrame(loop);
}


// === Boot ===
(async function boot() {
  applyIntegerScale();
  window.addEventListener("resize", applyIntegerScale);

  sheriffBaseFrames = await Promise.all(sheriffBaseFramesPaths.map(loadImage));
  uniformImgs = await Promise.all(uniformPaths.map(loadImage));
  bgImgs = await Promise.all(bgPaths.map(loadImage));
  sheriffBaseCrouchImg = await loadImage(sheriffBaseCrouchPath);
uniformCrouchImgs = await Promise.all(uniformCrouchPaths.map(loadImage));

gunStandImg = await loadImage(gunStandPath);
gunCrouchImg = await loadImage(gunCrouchPath);

enemyBaseImg = await loadImage(enemyBasePath);
enemyCrouchImg = await loadImage(enemyCrouchPath);

reloadIconImg = await loadImage(reloadIconPath);



  // Carico sprite BG2 (se non li trova, usa i placeholder in bg2.js)
  try { bg2WaspImg = await loadImage(bg2WaspPath); } catch (e) { bg2WaspImg = null; }
  try { bg2HeartFullImg  = await loadImage(bg2HeartFullPath); } catch (e) { bg2HeartFullImg = null; }
try { bg2HeartHalfImg  = await loadImage(bg2HeartHalfPath); } catch (e) { bg2HeartHalfImg = null; }
try { bg2HeartEmptyImg = await loadImage(bg2HeartEmptyPath); } catch (e) { bg2HeartEmptyImg = null; }
try { bg2DigitsImg = await loadImage(bg2DigitsPath); } catch (e) { bg2DigitsImg = null; }

bg2ClockImgs = await Promise.all(
  bg2ClockPaths.map(src =>
    loadImage(src).catch(() => null)
  )
);



  loop();
})().catch((err) => {
  console.error(err);
  alert("Errore nel caricamento immagini. Controlla i nomi dei file e i percorsi in assets/.");
});
