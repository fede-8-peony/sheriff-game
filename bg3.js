/*
  bg3.js
  Minigioco BG_3: duello finale.
  Player vs Cattivo.
*/

(function () {
  "use strict";

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function rectHit(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function create(cfg) {
    const BASE_W = cfg.BASE_W;
    const BASE_H = cfg.BASE_H;
    const keysDown = cfg.keysDown;

    const state = {
      running: false,
      ended: false,
      winner: null,

      player: {
        x: 40,
        y: BASE_H - 60,
        w: 40,
        h: 50,
        crouch: false,
        hp: 100,
          // ✅ raffica + ricarica
  shotsLeft: 2,
  reloading: false,
  reloadTimer: 0
      },

      enemy: {
        x: BASE_W - 80,
        y: BASE_H - 60,
        w: 48,
        h: 58,
        crouch: false,
        hp: 100,
        shootCooldown: 0,
        crouchTimer: 0,      // quanto resta piegato
crouchCooldown: 0 

      },

      bullets: []
    };

    function start() {
      state.running = true;
      state.ended = false;
      state.winner = null;

      state.player.hp = 100;
      state.enemy.hp = 100;
      state.bullets = [];
      state.player.shotsLeft = 2,
state.player.reloading = false;
state.player.reloadTimer = 0;

    }

   function shoot(from) {

  const muzzleXPlayer = 44;
  const muzzleXEnemy  = 4;   // specchiato
  const muzzleY = 12;

  const muzzleX = (from === state.player)
    ? muzzleXPlayer
    : muzzleXEnemy;

  state.bullets.push({
    x: from.x + muzzleX,
    y: from.y + muzzleY,
    w: 8,
    h: 4,
    vx: (from === state.player) ? 200 : -200,
    owner: (from === state.player) ? "player" : "enemy"
  });
}

function enemyTryCrouch() {
  if (state.enemy.crouch) return;
  if (state.enemy.crouchTimer > 0) return;
  if (state.enemy.crouchCooldown > 0) return;

  state.enemy.crouch = true;
  state.enemy.crouchTimer = rand(0.6, 0.90);
}





    function update(dt) {
      if (!state.running) return;

      // Accovacciata player
      state.player.crouch = keysDown.has(" ");

      // ✅ gestione ricarica
if (state.player.reloading) {
  state.player.reloadTimer -= dt;
  if (state.player.reloadTimer <= 0) {
    state.player.reloading = false;
    state.player.shotsLeft = 2;   // ricaricato
    state.player.reloadTimer = 0;
  }
}

// --- Enemy crouch timers + cooldown ---
if (state.enemy.crouchTimer > 0) {
  state.enemy.crouchTimer -= dt;
  if (state.enemy.crouchTimer <= 0) {
    state.enemy.crouchTimer = 0;
    state.enemy.crouch = false;
    state.enemy.crouchCooldown = 0.6; // resta in piedi un po'
  }
} else {
  if (state.enemy.crouchCooldown > 0) {
    state.enemy.crouchCooldown -= dt;
    if (state.enemy.crouchCooldown < 0) state.enemy.crouchCooldown = 0;
  }
}



     // AI nemico spara (ma NON quando è accovacciato)
state.enemy.shootCooldown -= dt;

if (!state.enemy.crouch && state.enemy.crouchTimer <= 0) {
  if (state.enemy.shootCooldown <= 0) {
    if (Math.random() < 0.85) shoot(state.enemy);
    state.enemy.shootCooldown = rand(0.3,0.6);
  }
} else {
  // opzionale: evita che diventi negativo infinito
  if (state.enemy.shootCooldown < 0) state.enemy.shootCooldown = 0;
}


      // Nemico schiva con probabilità
      // se un proiettile del player sta arrivando verso il nemico, prova a schivare
if (!state.enemy.crouch && state.enemy.crouchTimer <= 0) {
  for (const b of state.bullets) {
    if (b.owner !== "player") continue;
    if (b.vx <= 0) continue;

    const dx = (state.enemy.x + state.enemy.w/2) - b.x;
    if (dx > 0 && dx < 90) {
      if (Math.random() < 0.65) {
        enemyTryCrouch();
      }
      break;
    }
  }
}



      // Update proiettili
      const alive = [];
      for (const b of state.bullets) {
        b.x += b.vx * dt;

        const target =
          b.owner === "player" ? state.enemy : state.player;

        const hitbox = {
          x: target.x,
          y: target.crouch ? target.y + 20 : target.y,
          w: target.w,
          h: target.crouch ? 30 : target.h
        };

        if (rectHit(b, hitbox)) {
          target.hp -= 20;
          continue;
        }

        if (b.x > 0 && b.x < BASE_W) {
          alive.push(b);
        }
      }

      state.bullets = alive;

      if (state.player.hp <= 0) {
        state.running = false;
        state.ended = true;
        state.winner = "enemy";
      }

      if (state.enemy.hp <= 0) {
        state.running = false;
        state.ended = true;
        state.winner = "player";
      }
    }

    function draw(ctx, assets) {
  ctx.clearRect(0, 0, BASE_W, BASE_H);

  // ✅ sfondo selezionato
  if (assets && assets.bg) ctx.drawImage(assets.bg, 0, 0);

  // player 
const px = Math.floor(state.player.x);
const py = Math.floor(state.player.y);

const base = state.player.crouch ? assets.sheriffBaseCrouch : assets.sheriffBase;
const uni  = state.player.crouch ? assets.uniformCrouch : assets.uniform;
const gun  = state.player.crouch ? assets.gunCrouch : assets.gunStand;

if (base) ctx.drawImage(base, px, py);
if (uni)  ctx.drawImage(uni,  px, py);
if (gun)  ctx.drawImage(gun,  px, py);


// --- ENEMY ---
function drawFlipped48(img, x, y) {
  if (!img) return;
  ctx.save();
  // flip orizzontale attorno al bordo sinistro + 48px
  ctx.translate(Math.floor(x) + 48, Math.floor(y));
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

// --- ENEMY (specchiato su asse Y = flip orizzontale) ---
const ex = state.enemy.x;
const ey = state.enemy.y;

const enemySprite = state.enemy.crouch ? assets.enemyCrouch : assets.enemyBase;
drawFlipped48(enemySprite, ex, ey);

// pistola nemico: stessa del player, stessa posizione, ma specchiata
const enemyGun = state.enemy.crouch ? assets.gunCrouch : assets.gunStand;
drawFlipped48(enemyGun, ex, ey);


  function drawHeartsOver(entity, hp) {
  const full = assets && assets.heartFull;
  const half = assets && assets.heartHalf;
  const empty = assets && assets.heartEmpty;
  if (!full || !half || !empty) return;

  const maxHearts = 5;
  const clamped = clamp(hp, 0, 100);

  const gap = 2;
  const w = full.width;
  const totalWidth = maxHearts * w + (maxHearts - 1) * gap;

  // posizione: centrata sopra la testa
  const ex = entity.x + entity.w / 2;
  const barX = Math.floor(ex - totalWidth / 2);

  const bodyY = entity.crouch ? (entity.y + 20) : entity.y;
  const barY = Math.floor(bodyY - full.height - 4); // 4px sopra la testa

  for (let i = 0; i < maxHearts; i++) {
    const heartHp = clamped - i * 20;

    let img = empty;
    if (heartHp >= 20) img = full;
    else if (heartHp >= 10) img = half;

    ctx.drawImage(img, barX + i * (w + gap), barY);
  }
}

// ✅ chiamale per entrambi
drawHeartsOver(state.player, state.player.hp);
drawHeartsOver(state.enemy, state.enemy.hp);

// --- RELOAD ICON ---
if (state.player.reloading && assets.reloadIcon) {

  const icon = assets.reloadIcon;

  const centerX = state.player.x + state.player.w / 2;
  const y = state.player.y - icon.height - 12;

  ctx.drawImage(
    icon,
    Math.floor(centerX - icon.width / 2),
    Math.floor(y)
  );
}



  // bullets
 const img = assets && assets.bulletImg;

for (const b of state.bullets) {
  if (!img) continue;

  const w = img.width;
  const h = img.height;

  ctx.save();
ctx.translate(b.x, b.y);

// ruota di 90° per farla orizzontale

ctx.rotate(Math.PI / 2);

if (b.vx > 0) {
  ctx.rotate(Math.PI);
}

ctx.drawImage(img, -img.width/2, -img.height/2);
ctx.restore();


}

}


    return {
      start,
      update,
      draw,
      shootPlayer() {
  if (!state.running) return;

  // 🚫 non può sparare se accovacciato
  if (state.player.crouch) return;

  // 🚫 se sta ricaricando, niente colpi
  if (state.player.reloading) return;

  // 🚫 se non ha colpi, avvia ricarica
  if (state.player.shotsLeft <= 0) {
    state.player.reloading = true;
    state.player.reloadTimer = 2.0; //tempo di ricarica (secondi)
    return;
  }

  // ✅ spara
  shoot(state.player);
  state.player.shotsLeft--;

  // ✅ se finisce i colpi, avvia subito la ricarica
  if (state.player.shotsLeft <= 0) {
    state.player.reloading = true;
    state.player.reloadTimer = 2.0;
  }
},


      get ended() { return state.ended; },
      get winner() { return state.winner; }
    };
  }

  window.BG3 = { create };
})();
