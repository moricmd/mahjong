// ui.js
export function renderHand(player) {
    const area = document.getElementById("player-hand");
    area.innerHTML = "";

    player.hand.forEach((tile) => {
        const div = document.createElement("div");
        div.className = "tile";
        div.textContent = tile;
        area.appendChild(div);   // ← これが必要
    });
}


export function renderState(game) {
    document.getElementById("state").textContent = game.state;
    document.getElementById("turn").textContent = game.turn;
}
