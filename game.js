// ============================================
// PHASE 5.5 — SCROLLING + ARENA LOCK
// ============================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1100;
canvas.height = 650;

let gameState = "menu";
let worldWidth = 3000;
let arenaLocked = false;

// ------------- INPUT -------------
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ------------- CAMERA -------------
const camera = {
    x: 0,
    smooth: 0.08
};

// ------------- PLAYER -------------
const player = {
    x: 200,
    y: 450,
    width: 42,
    height: 60,
    speed: 4.5,
    vx: 0,
    vy: 0,
    gravity: 0.45,      // smoother gravity
    jumpForce: -11,
    onGround: false,
    facing: 1,
    hp: 100,
    maxHp: 100,

    dashSpeed: 14,
    dashTimer: 0,
    dashDuration: 8,
    dashCooldown: 50,
    dashCD: 0
};

const groundY = 560;

// ------------- BOSS -------------
const boss = {
    x: 2400,
    y: 380,
    width: 120,
    height: 140,
    hp: 400,
    maxHp: 400,
    attackTimer: 0
};

const bossBullets = [];
const playerBullets = [];

// ------------- UPDATE -------------
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
        player.vx *= 0.75;
    }

    // JUMP
    if (keys["w"] && player.onGround) {
        player.vy = player.jumpForce;
        player.onGround = false;
    }

    // DASH
    if (keys["shift"] && player.dashTimer <= 0 && player.dashCD <= 0) {
        player.dashTimer = player.dashDuration;
        player.dashCD = player.dashCooldown;
    }

    if (player.dashTimer > 0) {
        player.vx = player.facing * player.dashSpeed;
        player.dashTimer--;
    }

    if (player.dashCD > 0) player.dashCD--;

    // PHYSICS
    player.vy += player.gravity;
    player.x += player.vx;
    player.y += player.vy;

    if (player.y + player.height >= groundY) {
        player.y = groundY - player.height;
        player.vy = 0;
        player.onGround = true;
    }

    // Clamp world bounds
    if (player.x < 0) player.x = 0;
    if (player.x > worldWidth - player.width)
        player.x = worldWidth - player.width;

    // SHOOT
    if (keys[" "] && playerBullets.length < 4) {
        playerBullets.push({
            x: player.x + player.width/2,
            y: player.y + 20,
            vx: player.facing * 9
        });
    }

    playerBullets.forEach((b, i) => {
        b.x += b.vx;

        if (
            b.x < boss.x + boss.width &&
            b.x > boss.x &&
            b.y < boss.y + boss.height &&
            b.y > boss.y
        ) {
            boss.hp -= 5;
            playerBullets.splice(i, 1);
        }
    });

    // -------- BOSS TRIGGER --------
    if (player.x > 2100 && !arenaLocked) {
        arenaLocked = true;
    }

    // -------- BOSS ATTACKS --------
    if (arenaLocked && boss.hp > 0) {
        boss.attackTimer++;

        if (boss.attackTimer % 90 === 0) {
            for (let i = -2; i <= 2; i++) {
                bossBullets.push({
                    x: boss.x,
                    y: boss.y + 60,
                    vx: -5,
                    vy: i * 2
                });
            }
        }
    }

    bossBullets.forEach((b, i) => {
        b.x += b.vx;
        b.y += b.vy;

        if (
            b.x < player.x + player.width &&
            b.x > player.x &&
            b.y < player.y + player.height &&
            b.y > player.y
        ) {
            player.hp -= 5;
            bossBullets.splice(i, 1);
        }
    });

    // CAMERA
    if (!arenaLocked) {
        let targetX = player.x - canvas.width/2;
        camera.x += (targetX - camera.x) * camera.smooth;
    } else {
        // Lock camera near boss arena
        camera.x = 1900;
    }

    if (player.hp <= 0) gameState = "dead";
}

// ------------- DRAW -------------
function draw() {

    ctx.clearRect(0,0,canvas.width,canvas.height);

    if (gameState === "menu") {
        drawMenu();
        return;
    }

    if (gameState === "dead") {
        drawDeath();
        return;
    }

    // Background
    ctx.fillStyle = "#0c0c18";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Parallax mountains
    ctx.fillStyle = "#181830";
    for (let i = 0; i < 20; i++) {
        let x = (i * 300 - camera.x * 0.3);
        ctx.fillRect(x, 350, 200, 250);
    }

    // Ground
    ctx.fillStyle = "#333";
    ctx.fillRect(-camera.x, groundY, worldWidth, 100);

    // Boss
    ctx.fillStyle = "#aa0000";
    ctx.fillRect(boss.x - camera.x, boss.y, boss.width, boss.height);

    // Player
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(player.x - camera.x, player.y, player.width, player.height);

    // Bullets
    ctx.fillStyle = "white";
    playerBullets.forEach(b =>
        ctx.fillRect(b.x - camera.x, b.y, 8, 4)
    );

    ctx.fillStyle = "orange";
    bossBullets.forEach(b =>
        ctx.fillRect(b.x - camera.x, b.y, 6, 6)
    );

    drawUI();
}

// ------------- UI -------------
function drawUI() {
    ctx.fillStyle = "#400";
    ctx.fillRect(300,20,500,20);
    ctx.fillStyle = "#f00";
    ctx.fillRect(300,20,500*(boss.hp/boss.maxHp),20);

    ctx.fillStyle = "#044";
    ctx.fillRect(20,20,200,15);
    ctx.fillStyle = "#0ff";
    ctx.fillRect(20,20,200*(player.hp/player.maxHp),15);
}

// ------------- MENU -------------
function drawMenu() {
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "40px monospace";
    ctx.fillText("SCROLLING BOSS PROTOTYPE", 300, 280);
    ctx.font = "20px monospace";
    ctx.fillText("Press Enter", 470, 340);
    if (keys["enter"]) gameState = "playing";
}

// ------------- DEATH -------------
function drawDeath() {
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "red";
    ctx.font = "40px monospace";
    ctx.fillText("YOU DIED", 420, 300);
}

// ------------- LOOP -------------
function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
