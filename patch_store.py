import re

with open("src/store/gameStore.ts", "r") as f:
    content = f.read()

# Add addPlayer type
content = re.sub(
    r"(setPlayers: \(players: Player\[\]\) => void;)",
    r"\1\n  addPlayer: (player: Player) => void;",
    content
)

# Add addPlayer implementation
content = re.sub(
    r"(setPlayers: \(players\) => set\(\{ players \}\),)",
    r"\1\n  addPlayer: (player) => set((state) => ({\n    players: state.players.some(p => p.id === player.id) \n      ? state.players \n      : [...state.players, player]\n  })),",
    content
)

with open("src/store/gameStore.ts", "w") as f:
    f.write(content)
