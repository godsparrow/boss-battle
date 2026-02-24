// ============================================
// TRIPLE-A INDIE BOSS FIGHT - PHASE 4
// ============================================

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
// CAMERA + SHAKE
// -----------------
const camera = {
    x: 0,
    y: 0,
    smooth: 0.08,
    shake: 0
};

function applyShake() {
    if (camera.shake > 0) {
        camera.shake--;
        return (Math.random() - 0.5) * 10;
    }
    return 0;
}

// -----------------
// PARTICLES
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

function spawnHitParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(
            x,
            y,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            30,
            4,
            "#ff4444"
        ));
    }
}

// -----------------
// DAMAGE NUMBERS
// -----------------
const damageNumbers = [];

function spawnDamage(x, y, amount) {
    damageNumbers.push({
        x, y,
        value: amount,
        life: 40
    });
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
    hp: 100,

    dashSpeed: 20,
    dashDuration: 10,
    dashTimer: 0,
    dashCooldown: 60,
    dashCDTimer: 0,

    facing: 1,
    shootCooldown: 12,
    shootTimer: 0
};

function updatePlayer() {

    let moving = false;

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

    // DASH
    if (keys["shift"] && player.dashTimer <= 0 && player.dashCDTimer <= 0) {
        player.dashTimer = player.dashDuration;
        player.dashCDTimer = player.dashCooldown;
    }

    if (player.dashTimer > 0) {
        player.x += player.facing * player.dashSpeed;
        player.dashTimer--;
    }

    if (player.dashCDTimer > 0) player.dashCDTimer--;

    // SHOOT (space)
    if (keys[" "] && player.shootTimer <= 0) {
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            vx: player.facing * 12,
            width: 8,
            height: 4
        });
        player.shootTimer = player.shootCooldown;
    }

    if (player.shootTimer > 0) player.shootTimer--;
}

function drawPlayer() {
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(player.x - camera.x, player.y - camera.y, player.width, player.height);
}

// -----------------
// BULLETS
// -----------------
const bullets = [];

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;

        // Collision
        if (
            b.x < boss.x + boss.width &&
            b.x + b.width > boss.x &&
            b.y < boss.y + boss.height &&
            b.y + b.height > boss.y
        ) {
            boss.hp -= 5;
            spawnHitParticles(b.x, b.y);
            spawnDamage(b.x, b.y, 5);
            camera.shake = 10;
            bullets.splice(i, 1);
            continue;
        }

        if (b.x < 0 || b.x > 4000) bullets.splice(i, 1);
    }
}

function drawBullets() {
    ctx.fillStyle = "#ffffff";
    bullets.forEach(b =>
        ctx.fillRect(b.x - camera.x, b.y - camera.y, b.width, b.height)
    );
}

// -----------------
// BOSS
// -----------------
const boss = {
    x: 1600,
    y: 450,
    width: 100,
    height: 140,
    hp: 500
};

function drawBoss() {
    ctx.fillStyle = "#ff0044";
    ctx.fillRect(boss.x - camera.x, boss.y - camera.y, boss.width, boss.height);
}

// -----------------
// UI
// -----------------
function drawUI() {
    ctx.fillStyle = "red";
    ctx.fillRect(20, 20, boss.hp, 20);

    ctx.fillStyle = "cyan";
    ctx.fillRect(20, 50, player.hp * 2, 15);
}

// -----------------
// CAMERA
// -----------------
function updateCamera() {
    const targetX = player.x - canvas.width / 2;
    camera.x += (targetX - camera.x) * camera.smooth;
}

// -----------------
// UPDATE
// -----------------
function update() {
    updatePlayer();
    updateBullets();
    updateCamera();

    particles.forEach(p => p.update());
    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    damageNumbers.forEach(d => {
        d.y -= 1;
        d.life--;
    });
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        if (damageNumbers[i].life <= 0) damageNumbers.splice(i, 1);
    }
}

// -----------------
// DRAW
// -----------------
function draw() {

    const shakeX = applyShake();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(shakeX, 0);

    drawBoss();
    drawPlayer();
    drawBullets();

    particles.forEach(p => p.draw());

    damageNumbers.forEach(d => {
        ctx.fillStyle = "#ffaaaa";
        ctx.fillText(d.value, d.x - camera.x, d.y - camera.y);
    });

    ctx.restore();

    drawUI();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
