import re
import sys

with open("src/store/gameStore.ts", "r") as f:
    content = f.read()

# Make addPlayer return a boolean indicating if it was added
if "addPlayer: (player: Player) => boolean;" in content:
    pass # Already added
elif "addPlayer: (player: Player) => void;" in content:
    content, count = re.subn(
        r"addPlayer: \(player: Player\) => void;",
        "addPlayer: (player: Player) => boolean;",
        content
    )
    if count != 1:
        raise RuntimeError("Failed to replace addPlayer type signature exactly once")
else:
    content, count = re.subn(
        r"(setPlayers: \(players: Player\[\]\) => void;)",
        r"\1\n  addPlayer: (player: Player) => boolean;",
        content
    )
    if count != 1:
        raise RuntimeError("Failed to insert addPlayer type signature")


impl_search = """  addPlayer: (player) => {
    let added = false;
    set((state) => {
      if (state.players.some(p => p.id === player.id)) {
        return { players: state.players };
      }
      added = true;
      return { players: [...state.players, player] };
    });
    return added;
  },"""

if "addPlayer: (player) => {" in content:
    pass # Already added
elif "addPlayer: (player) => set(" in content:
    raise RuntimeError("An old addPlayer implementation exists that needs manual cleanup before running this script.")
else:
    content, count = re.subn(
        r"(setPlayers: \(players\) => set\(\{ players \}\),)",
        r"\1\n" + impl_search,
        content
    )
    if count != 1:
        raise RuntimeError("Failed to insert addPlayer implementation exactly once")

with open("src/store/gameStore.ts", "w") as f:
    f.write(content)

print("Patch successful!")
