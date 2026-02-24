// ==============================
// STUDIO ENGINE FOUNDATION + PHASE 1
// ==============================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 960;
canvas.height = 540;

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
    down(key) {
        return this.keys[key];
    }
}
const input = new Input();

// ==============================
// CAMERA
// ==============================
class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
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
// PLAYER
// ==============================
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.speed = 250;
        this.hp = 100;
        this.facing = 1;

        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.invuln = 0;

        this.shootCooldown = 0;
    }

    update(dt) {
        if (hitstop > 0) return;

        let moveX = 0;
        let moveY = 0;

        if (input.down("a")) { moveX = -1; this.facing = -1; }
        if (input.down("d")) { moveX = 1; this.facing = 1; }
        if (input.down("w")) moveY = -1;
        if (input.down("s")) moveY = 1;

        this.x += moveX * this.speed * dt;
        this.y += moveY * this.speed * dt;

        // DASH
        if (input.down("k") && this.dashCooldown <= 0) {
            this.dashTimer = 0.15;
            this.dashCooldown = 0.6;
            this.invuln = 0.2;
            camera.shake(8, 0.15);
        }

        if (this.dashTimer > 0) {
            this.x += this.facing * 800 * dt;
            this.dashTimer -= dt;
        }

        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.invuln > 0) this.invuln -= dt;

        // SHOOT
        if (input.down("j") && this.shootCooldown <= 0) {
            game.scene.add(new Bullet(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.facing
            ));
            this.shootCooldown = 0.25;
        }

        if (this.shootCooldown > 0) this.shootCooldown -= dt;
    }

    draw(ctx) {
        ctx.fillStyle = this.invuln > 0 ? "#00ffff88" : "cyan";
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
    }

    takeDamage(amount) {
        if (this.invuln > 0) return;
        this.hp -= amount;
        this.invuln = 0.5;
        camera.shake(6, 0.2);
        hitstop = 0.05;
    }
}

// ==============================
// BULLET
// ==============================
class Bullet extends Entity {
    constructor(x, y, dir) {
        super(x, y, 8, 4);
        this.speed = 600 * dir;
    }

    update(dt) {
        if (hitstop > 0) return;
        this.x += this.speed * dt;
        if (this.x < -100 || this.x > 2000) this.dead = true;
    }

    draw(ctx) {
        ctx.fillStyle = "lime";
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
    }
}

// ==============================
// SCENE
// ==============================
class Scene {
    constructor() {
        this.entities = [];
    }

    add(entity) {
        this.entities.push(entity);
    }

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
        this.player = new Player(200, 300);
        this.scene.add(this.player);
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

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        camera.apply();

        if (this.state === "MENU") {
            ctx.fillStyle = "white";
            ctx.font = "48px monospace";
            ctx.fillText("NEON WARDEN", 250, 200);
            ctx.font = "24px monospace";
            ctx.fillText("Press SPACE to Start", 320, 260);

            if (input.down(" ")) this.state = "GAME";
        }

        if (this.state === "GAME") {
            this.scene.draw(ctx);

            // HP UI
            ctx.fillStyle = "green";
            ctx.fillRect(20 + camera.x, 20, this.player.hp * 2, 20);
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
