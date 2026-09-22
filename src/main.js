import { Player } from "./player.js";
import { Projectile } from "./projectile.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const hpFillP1 = document.getElementById("hp-p1");
const hpFillP2 = document.getElementById("hp-p2");
const turnIndicator = document.getElementById("turn-indicator");
const winnerScreen = document.getElementById("winner-screen");
const winnerText = document.getElementById("winner-text");
const restartBtn = document.getElementById("restart-btn");

const MAX_DRAG = 140;
const POWER_TO_SPEED = 6;

let width, height, groundY;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  groundY = height - 90;
  if (game) game.layout();
}
window.addEventListener("resize", resize);

class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.players = [
      new Player({ id: "p1", characterId: "main", x: 0, y: 0, facing: 1 }),
      new Player({ id: "p2", characterId: "main", x: 0, y: 0, facing: -1 }),
    ];
    this.layout();
    this.turn = 0; // index into players
    this.projectiles = [];
    this.isDragging = false;
    this.dragStart = null;
    this.dragCurrent = null;
    this.gameOver = false;
    winnerScreen.classList.add("hidden");
    this.updateHud();
  }

  layout() {
    if (!width) return;
    this.players[0].x = width * 0.2;
    this.players[0].y = groundY;
    this.players[1].x = width * 0.8;
    this.players[1].y = groundY;
  }

  get activePlayer() {
    return this.players[this.turn];
  }

  get opponent() {
    return this.players[(this.turn + 1) % 2];
  }

  updateHud() {
    const [p1, p2] = this.players;
    hpFillP1.style.width = `${(p1.health / p1.character.maxHealth) * 100}%`;
    hpFillP2.style.width = `${(p2.health / p2.character.maxHealth) * 100}%`;
    hpFillP1.classList.toggle("low", p1.health / p1.character.maxHealth < 0.3);
    hpFillP2.classList.toggle("low", p2.health / p2.character.maxHealth < 0.3);

    if (!this.gameOver) {
      turnIndicator.textContent = `${this.activePlayer === p1 ? "Spieler 1" : "Spieler 2"} ist am Zug`;
    }
  }

  startDrag(pos) {
    if (this.gameOver || this.projectiles.length > 0) return;
    this.isDragging = true;
    this.dragStart = pos;
    this.dragCurrent = pos;
  }

  updateDrag(pos) {
    if (!this.isDragging) return;
    this.dragCurrent = pos;

    const dx = this.dragStart.x - pos.x;
    const dy = this.dragStart.y - pos.y;
    const angle = Math.atan2(dy, dx);
    this.activePlayer.aimAngle = angle;
  }

  endDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;

    const dx = this.dragStart.x - this.dragCurrent.x;
    const dy = this.dragStart.y - this.dragCurrent.y;
    const dist = Math.min(Math.hypot(dx, dy), MAX_DRAG);
    if (dist < 12) return; // too small, ignore as a tap

    const angle = Math.atan2(dy, dx);
    const power = dist * POWER_TO_SPEED;
    const ability = this.activePlayer.character.ability;

    const shooter = this.activePlayer;
    this.projectiles.push(
      new Projectile({
        x: shooter.x + Math.cos(angle) * 40,
        y: shooter.y - 35 + Math.sin(angle) * 40,
        vx: Math.cos(angle) * power * ability.speedMultiplier,
        vy: Math.sin(angle) * power * ability.speedMultiplier,
        damage: ability.damage,
        color: ability.projectileColor,
        ownerId: shooter.id,
      })
    );
  }

  update(dt) {
    this.projectiles.forEach((p) => p.update(dt));

    for (const proj of this.projectiles) {
      if (proj.dead) continue;

      if (proj.y > height + 100 || proj.x < -100 || proj.x > width + 100) {
        proj.dead = true;
        continue;
      }

      for (const target of this.players) {
        if (target.id === proj.ownerId || !target.isAlive) continue;
        const dx = proj.x - target.x;
        const dy = proj.y - (target.y - 40);
        if (Math.hypot(dx, dy) < 34) {
          target.takeDamage(proj.damage);
          proj.dead = true;
          this.onHit(target);
          break;
        }
      }

      if (!proj.dead && proj.y >= groundY) {
        proj.dead = true;
      }
    }

    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }

  onHit(target) {
    this.updateHud();
    if (!target.isAlive) {
      this.endGame(this.activePlayer);
      return;
    }
    this.nextTurn();
  }

  nextTurn() {
    this.turn = (this.turn + 1) % 2;
    this.updateHud();
  }

  endGame(winner) {
    this.gameOver = true;
    const label = winner === this.players[0] ? "Spieler 1" : "Spieler 2";
    winnerText.textContent = `${label} gewinnt!`;
    winnerScreen.classList.remove("hidden");
  }

  draw() {
    ctx.clearRect(0, 0, width, height);

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#1e2a4a");
    sky.addColorStop(1, "#4a3a5a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // ground
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(0, groundY + 40, width, height - groundY - 40);
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(0, groundY + 40, width, 8);

    this.players.forEach((p) => p.draw(ctx));
    this.projectiles.forEach((p) => p.draw(ctx));

    if (this.isDragging) {
      const shooter = this.activePlayer;
      const dx = this.dragStart.x - this.dragCurrent.x;
      const dy = this.dragStart.y - this.dragCurrent.y;
      const dist = Math.min(Math.hypot(dx, dy), MAX_DRAG);
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.strokeStyle = "#ffd54f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(shooter.x, shooter.y - 35);
      ctx.lineTo(
        shooter.x + Math.cos(angle) * dist,
        shooter.y - 35 + Math.sin(angle) * dist
      );
      ctx.stroke();

      // power meter
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(shooter.x - 30, shooter.y - 120, 60, 12);
      ctx.fillStyle = "#ffd54f";
      ctx.fillRect(shooter.x - 30, shooter.y - 120, 60 * (dist / MAX_DRAG), 12);
      ctx.restore();
    }
  }
}

let game;

function loop(timestamp) {
  if (!loop.last) loop.last = timestamp;
  const dt = Math.min((timestamp - loop.last) / 1000, 0.033);
  loop.last = timestamp;

  game.update(dt);
  game.draw();

  requestAnimationFrame(loop);
}

function getPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const point = evt.touches ? evt.touches[0] : evt;
  return { x: point.clientX - rect.left, y: point.clientY - rect.top };
}

function attachInput() {
  canvas.addEventListener("mousedown", (e) => game.startDrag(getPos(e)));
  canvas.addEventListener("mousemove", (e) => game.updateDrag(getPos(e)));
  window.addEventListener("mouseup", () => game.endDrag());

  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      game.startDrag(getPos(e));
    },
    { passive: false }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      game.updateDrag(getPos(e));
    },
    { passive: false }
  );
  window.addEventListener("touchend", () => game.endDrag());

  restartBtn.addEventListener("click", () => game.reset());
}

resize();
game = new Game();
attachInput();
requestAnimationFrame(loop);
