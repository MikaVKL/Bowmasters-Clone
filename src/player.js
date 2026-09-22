import { getCharacter } from "./characters.js";

export class Player {
  constructor({ id, characterId, x, y, facing }) {
    this.id = id;
    this.character = getCharacter(characterId);
    this.x = x;
    this.y = y;
    this.facing = facing; // 1 = faces right, -1 = faces left
    this.health = this.character.maxHealth;
    this.aimAngle = facing === 1 ? -0.3 : Math.PI + 0.3;
  }

  get isAlive() {
    return this.health > 0;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  draw(ctx) {
    const { x, y } = this;
    const flip = this.facing;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip, 1);

    // legs
    ctx.strokeStyle = "#3e2723";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-14, 40);
    ctx.moveTo(10, 0);
    ctx.lineTo(14, 40);
    ctx.stroke();

    // body
    ctx.fillStyle = this.character.color;
    ctx.beginPath();
    ctx.ellipse(0, -30, 22, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // head
    ctx.fillStyle = "#ffccbc";
    ctx.beginPath();
    ctx.arc(0, -68, 16, 0, Math.PI * 2);
    ctx.fill();

    // bow (drawn pointing toward aim angle, roughly)
    ctx.strokeStyle = this.character.bowColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(26, -35, 22, -1.1, 1.1);
    ctx.stroke();

    ctx.restore();

    // aim indicator line
    if (this.isAlive) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(x, y - 35);
      ctx.lineTo(
        x + Math.cos(this.aimAngle) * 60,
        y - 35 + Math.sin(this.aimAngle) * 60
      );
      ctx.stroke();
      ctx.restore();
    }
  }
}
