// Character definitions. Add new characters here later — each one just
// needs a color, base stats and an ability. The game logic never needs
// to change when a new character is added.

export const Characters = {
  main: {
    id: "main",
    name: "Bowman",
    color: "#8d6e63",
    bowColor: "#5d4037",
    maxHealth: 100,
    ability: {
      id: "power_shot",
      name: "Power Shot",
      description: "Ein normaler, kräftiger Pfeil.",
      damage: 20,
      projectileColor: "#f5f5f5",
      speedMultiplier: 1,
    },
  },
};

export function getCharacter(id) {
  return Characters[id] ?? Characters.main;
}
