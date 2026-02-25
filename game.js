// ==========================================
// AAA INDIE SCROLLING BOSS FIGHT ENGINE
// Phase 6 – True Scrolling Build
// ==========================================

// =========================
// CANVAS SETUP
// =========================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

// =========================
// WORLD
// =========================
const WORLD_WIDTH = 4000;
let cameraX = 0;

// =========================
// INPUT
// =========================
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// =========================
// PLAYER
// =========================
const player = {
    x: 300,
    y: 500,
    width: 48,
    height: 64,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpForce: -15,
    gravity: 0.8,
    onGround: false,
    hp: 100,
    maxHp: 100,
    facing: 1,
    dashCooldown: 0,
    attackCooldown: 0
};

// =========================
// BOSS
// =========================
const boss = {
    x: 2500,
    y: 400,
    width: 180,
    height: 220,
    hp: 1500,
    maxHp: 1500,
    phase: 1,
    attackTimer: 0,
    attackIndex: 0
};

// =========================
// ARRAYS
// =========================
let playerBullets = [];
let bossBullets = [];
let particles = [];
let damageNumbers = [];

// =========================
// UTILITY
// =========================
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// =========================
// PLAYER UPDATE
// =========================
function updatePlayer() {

    // Horizontal movement
    if (keys["a"]) {
        player.vx = -player.speed;
        player.facing = -1;
    } else if (keys["d"]) {
        player.vx = player.speed;
        player.facing = 1;
    } else {
        player.vx *= 0.8;
    }

    // Jump
    if (keys["w"] && player.onGround) {
        player.vy = player.jumpForce;
        player.onGround = false;
    }

    // Gravity
    player.vy += player.gravity;

    // Apply movement
    player.x += player.vx;
    player.y += player.vy;

    // Ground collision
    if (player.y > 550) {
        player.y = 550;
        player.vy = 0;
        player.onGround = true;
    }

    // World bounds
    player.x = clamp(player.x, 0, WORLD_WIDTH - player.width);

    // Dash
    if (keys["shift"] && player.dashCooldown <= 0) {
        player.vx = player.facing * 20;
        player.dashCooldown = 60;
    }

    if (player.dashCooldown > 0) player.dashCooldown--;

    // Shoot
    if (keys[" "] && player.attackCooldown <= 0) {
        playerBullets.push({
            x: player.x + player.width / 2,
            y: player.y + 30,
            vx: player.facing * 12,
            damage: 15
        });
        player.attackCooldown = 15;
    }

    if (player.attackCooldown > 0) player.attackCooldown--;

    // Camera follows player
    cameraX = player.x - canvas.width / 2;
    cameraX = clamp(cameraX, 0, WORLD_WIDTH - canvas.width);
}

// =========================
// BOSS ATTACK PATTERNS
// =========================
function bossAttackPattern() {

    boss.attackTimer++;

    if (boss.attackTimer % 120 === 0) {
        boss.attackIndex++;
    }

    // Pattern 1: Spread Shot
    if (boss.phase === 1 && boss.attackTimer % 90 === 0) {
        for (let i = -2; i <= 2; i++) {
            bossBullets.push({
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height / 2,
                vx: -6 + i,
                vy: i * 1.5,
                damage: 10
            });
        }
    }

    // Phase 2 Unlock
    if (boss.hp < 1000) boss.phase = 2;

    if (boss.phase === 2 && boss.attackTimer % 60 === 0) {
        for (let i = 0; i < 8; i++) {
            let angle = (Math.PI * 2 / 8) * i;
            bossBullets.push({
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height / 2,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                damage: 12
            });
        }
    }

    // Phase 3 Unlock
    if (boss.hp < 500) boss.phase = 3;

    if (boss.phase === 3 && boss.attackTimer % 45 === 0) {
        bossBullets.push({
            x: boss.x,
            y: 0,
            vx: 0,
            vy: 8,
            damage: 20
        });
    }
}

// =========================
// BULLET UPDATE
// =========================
function updateBullets() {

    playerBullets.forEach((b, i) => {
        b.x += b.vx;

        if (b.x > boss.x &&
            b.x < boss.x + boss.width &&
            b.y > boss.y &&
            b.y < boss.y + boss.height) {

            boss.hp -= b.damage;
            damageNumbers.push({
                x: boss.x,
                y: boss.y,
                value: b.damage,
                life: 30
            });
            playerBullets.splice(i, 1);
        }
    });

    bossBullets.forEach((b, i) => {
        b.x += b.vx;
        b.y += b.vy;

        if (b.x > player.x &&
            b.x < player.x + player.width &&
            b.y > player.y &&
            b.y < player.y + player.height) {

            player.hp -= b.damage;
            damageNumbers.push({
                x: player.x,
                y: player.y,
                value: b.damage,
                life: 30
            });
            bossBullets.splice(i, 1);
        }
    });
}

// =========================
// DRAWING
// =========================
function drawWorld() {

    // Background parallax layers
    ctx.fillStyle = "#070713";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Far stars
    ctx.fillStyle = "#111122";
    for (let i = 0; i < 200; i++) {
        ctx.fillRect((i * 50 - cameraX * 0.2) % canvas.width, i * 10 % 720, 2, 2);
    }

    // Ground
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(-cameraX, 600, WORLD_WIDTH, 120);
}

function drawPlayer() {
    ctx.fillStyle = "#00e0ff";
    ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);
}

function drawBoss() {
    ctx.fillStyle = "#ff0040";
    ctx.fillRect(boss.x - cameraX, boss.y, boss.width, boss.height);
}

function drawBullets() {
    ctx.fillStyle = "#ffff00";
    playerBullets.forEach(b => {
        ctx.fillRect(b.x - cameraX, b.y, 8, 4);
    });

    ctx.fillStyle = "#ff8800";
    bossBullets.forEach(b => {
        ctx.fillRect(b.x - cameraX, b.y, 6, 6);
    });
}

function drawHPBars() {

    // Player HP
    ctx.fillStyle = "red";
    ctx.fillRect(50, 50, 300, 20);
    ctx.fillStyle = "lime";
    ctx.fillRect(50, 50, 300 * (player.hp / player.maxHp), 20);

    // Boss HP
    ctx.fillStyle = "darkred";
    ctx.fillRect(canvas.width / 2 - 300, 30, 600, 20);
    ctx.fillStyle = "orange";
    ctx.fillRect(canvas.width / 2 - 300, 30, 600 * (boss.hp / boss.maxHp), 20);
}

// =========================
// MAIN LOOP
// =========================
function gameLoop() {

    updatePlayer();
    bossAttackPattern();
    updateBullets();

    drawWorld();
    drawPlayer();
    drawBoss();
    drawBullets();
    drawHPBars();

    requestAnimationFrame(gameLoop);
}

gameLoop();
