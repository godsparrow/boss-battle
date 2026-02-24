// ==============================
// STUDIO ENGINE FOUNDATION
// ==============================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 960;
canvas.height = 540;

// ==============================
// TIME SYSTEM (Frame Independent)
// ==============================
let lastTime = 0;
let delta = 0;

// ==============================
// INPUT SYSTEM
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
// CAMERA SYSTEM
// ==============================
class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.shakeTime = 0;
        this.shakePower = 0;
    }

    update(dt) {
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
        }
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
// BASE ENTITY CLASS
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
// SCENE MANAGER
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
// GAME STATES
// ==============================
class Game {
    constructor() {
        this.state = "MENU";
        this.scene = new Scene();
    }

    update(dt) {
        camera.update(dt);
        if (this.state === "GAME") {
            this.scene.update(dt);
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

            if (input.down(" ")) {
                this.state = "GAME";
            }
        }

        if (this.state === "GAME") {
            this.scene.draw(ctx);
        }

        ctx.restore();
    }
}

const game = new Game();

// ==============================
// GAME LOOP
// ==============================
function gameLoop(timestamp) {
    delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    game.update(delta);
    game.draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
