/*
  bg2.js
  Minigioco BG_2: raccogli più vespe possibili in 30s con un retino.

  Compatibile con <script src="..."> (no ES modules).
  Espone una factory su window.BG2.
*/
const Bg2Phase = {
  INTRO: "intro",
  PLAYING: "playing",
  ENDED: "ended",
};
(function () {
  "use strict";

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function circleHit(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    const r = ar + br;
    return (dx * dx + dy * dy) <= (r * r);
  }
  function circleRectHit(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) <= cr * cr;
}

  

  function create(cfg) {
    const BASE_W = cfg.BASE_W;
    const BASE_H = cfg.BASE_H;
    const keysDown = cfg.keysDown; // Set

    const state = {
      running: false,
      ended: false,
      durationMs: 30000,
      spawnEveryMs: 220,       // frequenza spawn (regolala)
      lastSpawn: 0,
      health: 100,             // vita
      startTime: 0,
      endTime: 0,

      score: 0,
      groundY: 170,
      player: {
        x: BASE_W / 2,
        y: BASE_H - 58,
        w: 48,
        h: 48,
        speed: 140,
        hitbox: { ox: 11, oy: 3, w: 26, h: 45 }

        
      },
      bullets: []
    };

    function spawnBullet() {
  state.bullets.push({
    x: rand(10, BASE_W - 10),
    y: -10,
    r: 2,               // ✅ HITBOX giusta per parte piena 4px
    vx: 0,
    vy: rand(90, 150),
    stuck: false
  });
}


    function start() {
      state.running = true;
      state.ended = false;
      state.startTime = performance.now();
      state.endTime = 0;

      state.lastSpawn = performance.now();
      state.bullets = [];
      state.health = 100;
      state.score = 0; // opzionale
      state.score = 0;
      state.player.x = BASE_W / 2;
    }

    function update(dt) {
      if (!state.running) return;

      const now = performance.now();
      const elapsed = now - state.startTime;
      const remaining = Math.max(0, state.durationMs - elapsed);

      if (remaining <= 0) {
  state.endTime = state.startTime + state.durationMs; // fine esatta
  state.ended = true;
  state.running = false;
  return;
}


      // Movimento player
      let dir = 0;
      if (keysDown.has("a") || keysDown.has("A") || keysDown.has("ArrowLeft")) dir -= 1;
      if (keysDown.has("d") || keysDown.has("D") || keysDown.has("ArrowRight")) dir += 1;

      state.player.x += dir * state.player.speed * dt;
      state.player.x = clamp(state.player.x, 0, BASE_W - state.player.w);


            // Spawn proiettili
      if (now - state.lastSpawn >= state.spawnEveryMs) {
        state.lastSpawn = now;
        spawnBullet();
      }

        // Update proiettili + collisione
        const alive = [];
       for (const b of state.bullets) {

  if (!b.stuck) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // se tocca il terreno fisso
    if (b.y + b.r >= state.groundY) {
      b.y = state.groundY - b.r;
      b.vx = 0;
      b.vy = 0;
      b.stuck = true;
    }
  }

  // danno SOLO se in volo
  if (!b.stuck) {
    const hb = state.player.hitbox;
const rx = state.player.x + hb.ox;
const ry = state.player.y + hb.oy;
const rw = hb.w;
const rh = hb.h;

if (circleRectHit(b.x, b.y, b.r, rx, ry, rw, rh)) {
  state.health -= 10;
  continue;
}

  }

  alive.push(b);
}


        state.bullets = alive;
        // evita accumulo infinito
const MAX_BULLETS = 120;
if (state.bullets.length > MAX_BULLETS) {
  state.bullets.splice(0, state.bullets.length - MAX_BULLETS);
}


        // Se muore → fine partita (sconfitta)
        if (state.health <= 0) {
  state.health = 0;
  state.endTime = performance.now(); // freeze ora
  state.ended = true;
  state.running = false;
  return;
}

  
    }
  function getRemainingSec() {
  if (!state.running && !state.ended) return Math.ceil(state.durationMs / 1000);

  const now = state.running ? performance.now() : (state.endTime || performance.now());
  const elapsed = now - state.startTime;
  const remainingMs = Math.max(0, state.durationMs - elapsed);
  return Math.ceil(remainingMs / 1000);
}


    function draw(ctx, assets) {
      // assets: { bg, sheriffBase, uniform, waspImg }
      ctx.clearRect(0, 0, BASE_W, BASE_H);
      if (assets && assets.bg) ctx.drawImage(assets.bg, 0, 0);

      // player
      const px = Math.floor(state.player.x);
      const py = Math.floor(state.player.y);
      if (assets && assets.sheriffBase) ctx.drawImage(assets.sheriffBase, px, py);
      if (assets && assets.uniform) ctx.drawImage(assets.uniform, px, py);

            // proiettili
      if (assets && assets.waspImg) {
        const img = assets.waspImg; // puoi riusare questo asset come "bullet.png" se vuoi
        for (const b of state.bullets) {
          ctx.drawImage(img, Math.floor(b.x - img.width / 2), Math.floor(b.y - img.height / 2));
        }
      } else {
        for (const b of state.bullets) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(230,230,230,.95)";
          ctx.fill();
        }
      }

function drawHearts() {
  const full = assets && assets.heartFull;
  const half = assets && assets.heartHalf;
  const empty = assets && assets.heartEmpty;
  if (!full || !half || !empty) return;

  const maxHearts = 5;
  const hp = clamp(state.health, 0, 100);

  const gap = 2;
  const w = full.width;

  const totalWidth = maxHearts * w + (maxHearts - 1) * gap;

  const marginRight = 5;  // “specchio” del timer che sta a x=5
  const startX = BASE_W - marginRight - totalWidth;

  const timerY = 9;       // uguale a drawTimerHud()
  const startY = timerY;

  for (let i = 0; i < maxHearts; i++) {
    const heartHp = hp - i * 20;

    let img = empty;
    if (heartHp >= 20) img = full;
    else if (heartHp >= 10) img = half;

    ctx.drawImage(img, startX + i * (w + gap), startY);
  }
}

drawHearts();
function drawTimerHud() {
  const clocks = assets && assets.clockImgs;
  if (!clocks || clocks.length !== 5) return;

  const digits = assets && assets.digitsImg;
  if (!digits) return;

  const total = state.durationMs / 1000;
  const remaining = getRemainingSec();
  const ratio = remaining / total;

  let index = 0;
  if (ratio > 0.75) index = 0;
  else if (ratio > 0.5) index = 1;
  else if (ratio > 0.25) index = 2;
  else if (ratio > 0) index = 3;
  else index = 4;

  const clock = clocks[index];
  if (!clock) return;

  // posizione HUD (cambia qui se vuoi)
  const x = 5;
  const y = 9;

  // disegna orologio
  ctx.drawImage(clock, x, y);

  // disegna numero pixel (2 cifre) usando digits.png (5x9)
  const digitWidth = 5;
  const digitHeight = 9;
  const gap = 1;

  const text = String(remaining).padStart(2, "0");

  // posizione numero accanto all'orologio, centrata verticalmente
  const tx = x + clock.width + 3;
  const ty = y + Math.floor((clock.height - digitHeight) / 2);

  for (let i = 0; i < text.length; i++) {
    const d = text.charCodeAt(i) - 48; // '0' -> 0
    ctx.drawImage(
      digits,
      d * digitWidth, 0,
      digitWidth, digitHeight,
      tx + i * (digitWidth + gap), ty,
      digitWidth, digitHeight
    );
  }
}


drawTimerHud();


    }

    return {
      start,

      update,
      draw,
      get ended() { return state.ended; },
      get running() { return state.running; },
      get score() { return state.score; },
      get remainingSec() { return getRemainingSec(); },
      get health() { return state.health; },

    };
  }

  window.BG2 = { create };
})();
