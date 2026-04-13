// ui.js
export function renderHand(player, onDiscard) {
  const area = document.getElementById("player-hand");
  area.innerHTML = "";

  player.hand.forEach((tile, index) => {
    const div = document.createElement("div");
    div.className = "tile";
    div.textContent = tile.red ? "赤5" : tile.value;
    div.onclick = () => onDiscard(index);
    area.appendChild(div);
  });
}

export function renderState(state, turn) {
  document.getElementById("state-label").textContent = state;
  document.getElementById("turn-label").textContent = String(turn);
}

