// ============================================
// TRIPLE-A INDIE BOSS FIGHT - PHASE 3
// ============================================

// -----------------
// CANVAS SETUP
// -----------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

// -----------------
// INPUT
// -----------------
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// -----------------
// CAMERA
// -----------------
const camera = {
    x: 0,
    y: 0,
    smooth: 0.08
};

// -----------------
// PARTICLE ENGINE
// -----------------
class Particle {
    constructor(x, y, vx, vy, life, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.size = size;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw() {
        ctx.globalAlpha = this.life / 30;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

const particles = [];

function spawnDust(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(
            x,
            y,
            (Math.random() - 0.5) * 4,
            Math.random() * -2,
            30,
            4,
            "#aaa"
        ));
    }
}

// -----------------
// PLAYER
// -----------------
const player = {
    x: 400,
    y: 500,
    width: 40,
    height: 60,
    speed: 6,
    dashSpeed: 18,
    dashTime: 0,
    dashDuration: 12,
    facing: 1,
    afterImages: []
};

function updatePlayer() {

    let moving = false;

    // FIXED A/D
    if (keys["a"]) {
        player.x -= player.speed;
        player.facing = -1;
        moving = true;
    }
    if (keys["d"]) {
        player.x += player.speed;
        player.facing = 1;
        moving = true;
    }

    // DASH BOTH DIRECTIONS
    if (keys["shift"] && player.dashTime <= 0) {
        player.dashTime = player.dashDuration;
    }

    if (player.dashTime > 0) {
        player.x += player.facing * player.dashSpeed;
        player.dashTime--;

        player.afterImages.push({
            x: player.x,
            y: player.y,
            life: 15
        });
    }

    if (moving) spawnDust(player.x + 20, player.y + 60);

    player.afterImages.forEach(img => img.life--);
    player.afterImages = player.afterImages.filter(img => img.life > 0);
}

function drawPlayer() {

    // Afterimages
    player.afterImages.forEach(img => {
        ctx.globalAlpha = img.life / 15;
        ctx.fillStyle = "#00ffff";
        ctx.fillRect(img.x - camera.x, img.y - camera.y, player.width, player.height);
        ctx.globalAlpha = 1;
    });

    // Player body
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(player.x - camera.x, player.y - camera.y, player.width, player.height);
}

// -----------------
// BOSS
// -----------------
const boss = {
    x: 1600,
    y: 450,
    width: 100,
    height: 140
};

function drawBoss() {
    ctx.fillStyle = "#ff0044";
    ctx.fillRect(boss.x - camera.x, boss.y - camera.y, boss.width, boss.height);
}

// -----------------
// PARALLAX BACKGROUND
// -----------------
function drawBackground() {

    // Layer 1 - Far stars
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1a1a1a";
    for (let i = 0; i < 50; i++) {
        let x = (i * 300 - camera.x * 0.2) % 4000;
        ctx.fillRect(x, 100, 3, 3);
    }

    // Layer 2 - Mid
    ctx.fillStyle = "#222";
    for (let i = 0; i < 30; i++) {
        let x = (i * 500 - camera.x * 0.5) % 4000;
        ctx.fillRect(x, 300, 10, 200);
    }

    // Layer 3 - Foreground floor
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 560, canvas.width, 200);
}

// -----------------
// CAMERA FOLLOW
// -----------------
function updateCamera() {
    const targetX = player.x - canvas.width / 2;
    camera.x += (targetX - camera.x) * camera.smooth;
}

// -----------------
// GAME LOOP
// -----------------
function update() {
    updatePlayer();
    updateCamera();

    particles.forEach(p => p.update());
    particles.splice(0, particles.filter(p => p.life <= 0).length);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawBoss();
    drawPlayer();

    particles.forEach(p => p.draw());
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
