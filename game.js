// ==============================
// AAA INDIE PHASE 2 ENGINE
// ==============================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Bigger screen
canvas.width = 1280;
canvas.height = 720;

// ==============================
// TIME
// ==============================
let lastTime = 0;
let delta = 0;
let hitstop = 0;

// ==============================
// INPUT
// ==============================
class Input {
    constructor() {
        this.keys = {};
        window.addEventListener("keydown", e => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener("keyup", e => this.keys[e.key.toLowerCase()] = false);
    }
    down(key) { return this.keys[key]; }
}
const input = new Input();

// ==============================
// CAMERA
// ==============================
class Camera {
    constructor() {
        this.x = 0;
        this.shakeTime = 0;
        this.shakePower = 0;
    }
    update(dt) {
        if (this.shakeTime > 0) this.shakeTime -= dt;
    }
    apply() {
        if (this.shakeTime > 0) {
            ctx.translate(
                (Math.random() - 0.5) * this.shakePower,
                (Math.random() - 0.5) * this.shakePower
            );
        }
    }
    shake(power, time) {
        this.shakePower = power;
        this.shakeTime = time;
    }
}
const camera = new Camera();

// ==============================
// ENTITY BASE
// ==============================
class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.dead = false;
    }
    update(dt) {}
    draw(ctx) {}
    collides(other) {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }
}

// ==============================
// PARTICLES
// ==============================
class Particle extends Entity {
    constructor(x, y, color) {
        super(x, y, 4, 4);
        this.dx = (Math.random() - 0.5) * 300;
        this.dy = (Math.random() - 0.5) * 300;
        this.life = 0.4;
        this.color = color;
    }
    update(dt) {
        this.x += this.dx * dt;
        this.y += this.dy * dt;
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - camera.x, this.y, 4, 4);
    }
}

// ==============================
// DAMAGE NUMBER
// ==============================
class DamageNumber extends Entity {
    constructor(x, y, value) {
        super(x, y, 0, 0);
        this.value = value;
        this.life = 1;
    }
    update(dt) {
        this.y -= 40 * dt;
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
    }
    draw(ctx) {
        ctx.fillStyle = "yellow";
        ctx.font = "20px monospace";
        ctx.fillText(this.value, this.x - camera.x, this.y);
    }
}

// ==============================
// PLAYER
// ==============================
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.speed = 350;
        this.hp = 100;
        this.facing = 1;
        this.shootCooldown = 0;
        this.dashCooldown = 0;
        this.invuln = 0;
        this.combo = 0;
    }

    update(dt) {
        if (hitstop > 0) return;

        let moveX = 0;
        if (input.down("a")) { moveX = -1; this.facing = -1; }
        if (input.down("d")) { moveX = 1; this.facing = 1; }

        this.x += moveX * this.speed * dt;

        if (input.down("k") && this.dashCooldown <= 0) {
            this.x += 200 * this.facing;
            this.dashCooldown = 0.8;
            camera.shake(10, 0.2);
        }

        if (this.dashCooldown > 0) this.dashCooldown -= dt;

        if (input.down("j") && this.shootCooldown <= 0) {
            game.scene.add(new Bullet(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.facing
            ));
            this.shootCooldown = 0.2;
        }

        if (this.shootCooldown > 0) this.shootCooldown -= dt;
    }

    draw(ctx) {
        ctx.fillStyle = "cyan";
        ctx.fillRect(this.x - camera.x, this.y, this.width, this.height);
    }
}

// ==============================
// BULLET
// ==============================
class Bullet extends Entity {
    constructor(x, y, dir) {
        super(x, y, 10, 6);
        this.speed = 900 * dir;
    }
    update(dt) {
        if (hitstop > 0) return;
        this.x += this.speed * dt;

        if (this.x > 5000 || this.x < -100) this.dead = true;

        // collision with dummy
        if (this.collides(game.dummy)) {
            this.dead = true;
            game.dummy.takeDamage(10);
        }
    }
    draw(ctx) {
        ctx.fillStyle = "lime";
        ctx.fillRect(this.x - camera.x, this.y, this.width, this.height);
    }
}

// ==============================
// DUMMY ENEMY
// ==============================
class Dummy extends Entity {
    constructor(x, y) {
        super(x, y, 80, 80);
        this.hp = 500;
    }

    takeDamage(amount) {
        this.hp -= amount;
        hitstop = 0.05;
        camera.shake(6, 0.1);

        game.scene.add(new DamageNumber(this.x + 40, this.y, amount));

        for (let i = 0; i < 10; i++) {
            game.scene.add(new Particle(this.x + 40, this.y + 40, "orange"));
        }
    }

    draw(ctx) {
        ctx.fillStyle = "purple";
        ctx.fillRect(this.x - camera.x, this.y, this.width, this.height);
    }
}

// ==============================
// SCENE
// ==============================
class Scene {
    constructor() {
        this.entities = [];
    }
    add(entity) { this.entities.push(entity); }
    update(dt) {
        this.entities.forEach(e => e.update(dt));
        this.entities = this.entities.filter(e => !e.dead);
    }
    draw(ctx) {
        this.entities.forEach(e => e.draw(ctx));
    }
}

// ==============================
// GAME
// ==============================
class Game {
    constructor() {
        this.state = "MENU";
        this.scene = new Scene();
        this.player = new Player(200, 500);
        this.dummy = new Dummy(1000, 480);

        this.scene.add(this.player);
        this.scene.add(this.dummy);
    }

    update(dt) {
        camera.update(dt);

        if (hitstop > 0) {
            hitstop -= dt;
            return;
        }

        if (this.state === "GAME") {
            this.scene.update(dt);
            camera.x = this.player.x - canvas.width / 2;
        }
    }

    drawBackground() {
        // sky layer
        ctx.fillStyle = "#080816";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // far buildings
        ctx.fillStyle = "#111133";
        for (let i = 0; i < 20; i++) {
            ctx.fillRect(
                (i * 400 - camera.x * 0.2) % 4000,
                300,
                200,
                300
            );
        }

        // floor
        ctx.fillStyle = "#222";
        ctx.fillRect(-camera.x, 580, 5000, 200);
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        camera.apply();

        if (this.state === "MENU") {
            ctx.fillStyle = "white";
            ctx.font = "60px monospace";
            ctx.fillText("NEON WARDEN", 400, 300);
            ctx.font = "30px monospace";
            ctx.fillText("Press SPACE", 500, 360);
            if (input.down(" ")) this.state = "GAME";
        }

        if (this.state === "GAME") {
            this.drawBackground();
            this.scene.draw(ctx);
        }

        ctx.restore();
    }
}

const game = new Game();

// ==============================
// LOOP
// ==============================
function gameLoop(timestamp) {
    delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    game.update(delta);
    game.draw();

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
