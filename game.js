// ==========================
// CANVAS SETUP
// ==========================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 960;
canvas.height = 540;

// ==========================
// GAME STATE
// ==========================
let gameState = "MENU";
let keys = {};
let cameraX = 0;
let shakeTime = 0;
let shakePower = 0;

document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (audioCtx.state === "suspended") audioCtx.resume();
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ==========================
// AUDIO SYSTEM
// ==========================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = "square";
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}

// ==========================
// PARTICLE ENGINE
// ==========================
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.dx = (Math.random() - 0.5) * 8;
    this.dy = (Math.random() - 0.5) * 8;
    this.life = 40;
    this.color = color;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.life--;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - cameraX, this.y, 3, 3);
  }
}

// ==========================
// DAMAGE NUMBERS
// ==========================
class DamageNumber {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.life = 60;
  }

  update() {
    this.y -= 0.5;
    this.life--;
  }

  draw() {
    ctx.fillStyle = "yellow";
    ctx.font = "16px monospace";
    ctx.fillText(this.value, this.x - cameraX, this.y);
  }
}

// ==========================
// BULLETS
// ==========================
class Bullet {
  constructor(x, y, dir) {
    this.x = x;
    this.y = y + 14;
    this.speed = 10 * dir;
    this.size = 6;
  }

  update() {
    this.x += this.speed;
  }

  draw() {
    ctx.fillStyle = "lime";
    ctx.fillRect(this.x - cameraX, this.y, this.size, this.size);
  }
}

class EnemyBullet {
  constructor(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.size = 6;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.fillRect(this.x - cameraX, this.y, this.size, this.size);
  }
}

// ==========================
// PLAYER
// ==========================
class Player {
  constructor() {
    this.x = 200;
    this.y = 400;
    this.width = 32;
    this.height = 32;
    this.speed = 4;
    this.hp = 100;
    this.frame = 0;
    this.frameTimer = 0;
    this.shootCooldown = 0;
    this.dashCooldown = 0;
    this.facing = 1;
  }

  update() {
    let moving = false;

    if (keys["a"]) { this.x -= this.speed; this.facing = -1; moving = true; }
    if (keys["d"]) { this.x += this.speed; this.facing = 1; moving = true; }
    if (keys["w"]) { this.y -= this.speed; moving = true; }
    if (keys["s"]) { this.y += this.speed; moving = true; }

    if (keys["j"] && this.shootCooldown <= 0) {
      bullets.push(new Bullet(this.x + 16, this.y, this.facing));
      this.shootCooldown = 15;
      playBeep(500, 0.05);
    }

    if (keys["k"] && this.dashCooldown <= 0) {
      this.x += 120 * this.facing;
      this.dashCooldown = 60;
      shakePower = 10;
      shakeTime = 10;
      playBeep(150, 0.1);
    }

    this.shootCooldown--;
    this.dashCooldown--;

    if (moving) {
      this.frameTimer++;
      if (this.frameTimer > 8) {
        this.frame = (this.frame + 1) % 2;
        this.frameTimer = 0;
      }
    }
  }

  draw() {
    ctx.fillStyle = this.frame === 0 ? "cyan" : "#00ffffaa";
    ctx.fillRect(this.x - cameraX, this.y, 32, 32);

    ctx.fillStyle = "white";
    ctx.fillRect(this.x - cameraX + 20 * this.facing, this.y + 10, 4, 4);
  }
}

// ==========================
// BOSS
// ==========================
class Boss {
  constructor() {
    this.x = 1400;
    this.y = 350;
    this.width = 80;
    this.height = 80;
    this.hp = 300;
    this.phase = 1;
    this.intro = true;
    this.introTimer = 180;
    this.attackCooldown = 60;
  }

  update() {
    if (this.intro) {
      this.x -= 2;
      this.introTimer--;
      if (this.introTimer <= 0) this.intro = false;
      return;
    }

    if (this.hp < 200 && this.phase === 1) {
      this.phase = 2;
      explode(this.x, this.y);
    }

    if (this.hp < 100 && this.phase === 2) {
      this.phase = 3;
      explode(this.x, this.y);
    }

    this.attackCooldown--;
    if (this.attackCooldown <= 0) {
      this.attack();
      this.attackCooldown = 90;
    }
  }

  attack() {
    for (let i = 0; i < 10 + this.phase * 5; i++) {
      let angle = (Math.PI * 2 / (10 + this.phase * 5)) * i;
      enemyBullets.push(new EnemyBullet(
        this.x + 40,
        this.y + 40,
        Math.cos(angle) * (2 + this.phase),
        Math.sin(angle) * (2 + this.phase)
      ));
    }
    playBeep(80, 0.2);
  }

  draw() {
    ctx.fillStyle = "purple";
    ctx.fillRect(this.x - cameraX, this.y, 80, 80);

    ctx.fillStyle = "red";
    ctx.fillRect(this.x - cameraX + 25, this.y + 25, 30, 30);
  }
}

// ==========================
// EXPLOSION
// ==========================
function explode(x, y) {
  shakePower = 20;
  shakeTime = 20;
  playBeep(60, 0.4);
  for (let i = 0; i < 40; i++) {
    particles.push(new Particle(x + 40, y + 40, "orange"));
  }
}

// ==========================
// BACKGROUND
// ==========================
function drawBackground() {
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#101030";
  for (let i = 0; i < 20; i++) {
    ctx.fillRect((i * 200 - cameraX * 0.3) % 2000, 100, 100, 300);
  }
}

// ==========================
// INIT
// ==========================
let player = new Player();
let boss = new Boss();
let bullets = [];
let enemyBullets = [];
let particles = [];
let damageNumbers = [];

// ==========================
// GAME LOOP
// ==========================
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (shakeTime > 0) {
    ctx.save();
    ctx.translate(
      (Math.random() - 0.5) * shakePower,
      (Math.random() - 0.5) * shakePower
    );
    shakeTime--;
  }

  drawBackground();

  if (gameState === "MENU") {
    ctx.fillStyle = "white";
    ctx.font = "40px monospace";
    ctx.fillText("NEON WARDEN", 300, 200);
    ctx.fillText("Press SPACE", 330, 260);
    if (keys[" "]) gameState = "GAME";
  }

  if (gameState === "GAME") {
    player.update();
    boss.update();
    cameraX = player.x - 200;

    bullets.forEach((b, i) => {
      b.update();
      if (b.x > boss.x && b.x < boss.x + boss.width &&
          b.y > boss.y && b.y < boss.y + boss.height) {
        boss.hp -= 5;
        damageNumbers.push(new DamageNumber(b.x, b.y, 5));
        bullets.splice(i, 1);
      }
    });

    enemyBullets.forEach((b, i) => {
      b.update();
      if (b.x > player.x && b.x < player.x + player.width &&
          b.y > player.y && b.y < player.y + player.height) {
        player.hp -= 5;
        damageNumbers.push(new DamageNumber(player.x, player.y, 5));
        enemyBullets.splice(i, 1);
      }
    });

    player.draw();
    boss.draw();
    bullets.forEach(b => b.draw());
    enemyBullets.forEach(b => b.draw());
    particles.forEach((p,i)=>{ p.update(); p.draw(); if(p.life<=0)particles.splice(i,1);});
    damageNumbers.forEach((d,i)=>{ d.update(); d.draw(); if(d.life<=0)damageNumbers.splice(i,1);});

    ctx.fillStyle = "green";
    ctx.fillRect(20, 20, player.hp * 2, 20);

    ctx.fillStyle = "red";
    ctx.fillRect(600, 20, boss.hp, 20);

    if (player.hp <= 0) gameState = "DEAD";
  }

  if (gameState === "DEAD") {
    ctx.fillStyle = "red";
    ctx.font = "50px monospace";
    ctx.fillText("YOU DIED", 350, 250);
  }

  if (shakeTime > 0) ctx.restore();

  requestAnimationFrame(gameLoop);
}

gameLoop();
