// ============================================
// AAA INDIE BOSS FIGHT - PHASE 4.5
// ============================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

// -----------------
// GAME STATE
// -----------------
let gameState = "menu"; // menu, playing, dead

// -----------------
// INPUT
// -----------------
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// -----------------
// CAMERA
// -----------------
const camera = { x: 0, smooth: 0.08 };

// -----------------
// PLAYER
// -----------------
const player = {
    x: 400,
    y: 500,
    width: 48,
    height: 64,
    speed: 5,
    vx: 0,
    vy: 0,
    gravity: 0.8,
    jumpForce: -16,
    onGround: false,
    facing: 1,
    hp: 100,
    maxHp: 100,

    dashSpeed: 20,
    dashDuration: 10,
    dashTimer: 0,
    dashCooldown: 60,
    dashCDTimer: 0,

    shootCooldown: 12,
    shootTimer: 0
};

const groundY = 580;

// -----------------
// BOSS
// -----------------
const boss = {
    x: 1600,
    y: 420,
    width: 120,
    height: 160,
    hp: 500,
    maxHp: 500
};

// -----------------
// BULLETS
// -----------------
const bullets = [];

// -----------------
// MAIN UPDATE
// -----------------
function update() {

    if (gameState !== "playing") return;

    // MOVEMENT
    if (keys["a"]) {
        player.vx = -player.speed;
        player.facing = -1;
    } else if (keys["d"]) {
        player.vx = player.speed;
        player.facing = 1;
    } else {
        player.vx *= 0.8;
    }

    // JUMP
    if (keys["w"] && player.onGround) {
        player.vy = player.jumpForce;
        player.onGround = false;
    }

    // DASH
    if (keys["shift"] && player.dashTimer <= 0 && player.dashCDTimer <= 0) {
        player.dashTimer = player.dashDuration;
        player.dashCDTimer = player.dashCooldown;
    }

    if (player.dashTimer > 0) {
        player.vx = player.facing * player.dashSpeed;
        player.dashTimer--;
    }

    if (player.dashCDTimer > 0) player.dashCDTimer--;

    // SHOOT
    if (keys[" "] && player.shootTimer <= 0) {
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            vx: player.facing * 14,
            width: 10,
            height: 4
        });
        player.shootTimer = player.shootCooldown;
    }

    if (player.shootTimer > 0) player.shootTimer--;

    // PHYSICS
    player.vy += player.gravity;
    player.x += player.vx;
    player.y += player.vy;

    if (player.y + player.height >= groundY) {
        player.y = groundY - player.height;
        player.vy = 0;
        player.onGround = true;
    }

    // BULLETS
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.vx;

        if (
            b.x < boss.x + boss.width &&
            b.x + b.width > boss.x &&
            b.y < boss.y + boss.height &&
            b.y + b.height > boss.y
        ) {
            boss.hp -= 5;
            bullets.splice(i, 1);
        }

        if (b.x < 0 || b.x > 4000) bullets.splice(i, 1);
    }

    // CAMERA FOLLOW
    let targetX = player.x - canvas.width / 2;
    camera.x += (targetX - camera.x) * camera.smooth;

    if (player.hp <= 0) gameState = "dead";
}

// -----------------
// DRAW
// -----------------
function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "menu") {
        drawMenu();
        return;
    }

    if (gameState === "dead") {
        drawDeath();
        return;
    }

    // BACKGROUND
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Parallax pillars
    ctx.fillStyle = "#151525";
    for (let i = 0; i < 20; i++) {
        let x = (i * 400 - camera.x * 0.4) % 4000;
        ctx.fillRect(x, 300, 40, 300);
    }

    // GROUND
    ctx.fillStyle = "#222";
    ctx.fillRect(0, groundY, canvas.width, 200);

    // BOSS (stylized)
    ctx.fillStyle = "#8b0000";
    ctx.fillRect(boss.x - camera.x, boss.y, boss.width, boss.height);
    ctx.fillStyle = "#ff0044";
    ctx.fillRect(boss.x - camera.x + 20, boss.y + 40, 80, 80);

    // PLAYER (stylized pixel look)
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(player.x - camera.x, player.y, player.width, player.height);
    ctx.fillStyle = "#007777";
    ctx.fillRect(player.x - camera.x + 10, player.y + 20, 28, 30);

    // BULLETS
    ctx.fillStyle = "white";
    bullets.forEach(b => {
        ctx.fillRect(b.x - camera.x, b.y, b.width, b.height);
    });

    drawUI();
}

// -----------------
// UI
// -----------------
function drawUI() {

    // Boss HP
    let bossRatio = boss.hp / boss.maxHp;
    ctx.fillStyle = "#400";
    ctx.fillRect(canvas.width / 2 - 300, 20, 600, 25);
    ctx.fillStyle = "#ff0033";
    ctx.fillRect(canvas.width / 2 - 300, 20, 600 * bossRatio, 25);

    // Player HP
    let playerRatio = player.hp / player.maxHp;
    ctx.fillStyle = "#044";
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(20, 20, 200 * playerRatio, 20);
}

// -----------------
// MENU
// -----------------
function drawMenu() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "48px monospace";
    ctx.fillText("VOID EXECUTION", 400, 300);

    ctx.font = "24px monospace";
    ctx.fillText("Press Enter to Start", 480, 380);

    if (keys["enter"]) {
        gameState = "playing";
    }
}

// -----------------
// DEATH
// -----------------
function drawDeath() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    ctx.font = "48px monospace";
    ctx.fillText("YOU DIED", 520, 350);

    ctx.font = "24px monospace";
    ctx.fillText("Refresh to Retry", 500, 400);
}

// -----------------
// LOOP
// -----------------
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
