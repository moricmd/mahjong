// ui.js
export function renderHand(player, onClick) {
  const area = document.getElementById("player-hand");
  area.innerHTML = "";

  player.hand.forEach((tile, index) => {
    const div = document.createElement("div");
    div.className = "tile";
    div.textContent = tile.value ?? tile;

    div.onclick = () => onClick(index);

    area.appendChild(div);
  });
}


export function renderState(game) {
    document.getElementById("state").textContent = game.state;
    document.getElementById("turn").textContent = game.turn;
}

