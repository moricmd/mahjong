// ui.js
// --------------------------------------------------

// tileIdを文字列に変換
function tileToId(tile) {
  if (typeof tile === "string") return tile; // すでに文字列ならOK
  return `${tile.suit}${tile.value}`;
}

// -------------------------
// 牌画像を作る
// -------------------------
export function createTileImg(tile) {
  const tileId = tileToId(tile);
  const img = document.createElement("img");
  img.src = `img/${tileId}.png`;
  img.className = "tile";
  return img;
}


export function createBackImg() {
  const img = document.createElement("img");
  img.src = "img/back.png";
  img.className = "tile";
  return img;
}

// -------------------------
// 手牌表示（プレイヤー）
// -------------------------
export function renderPlayerHand(player, onClick) {
  const area = document.getElementById("player-hand");
  area.innerHTML = "";

  player.hand.forEach((tileId, index) => {
    const img = createTileImg(tileId);
    img.onclick = () => onClick(index);
    area.appendChild(img);
  });
}

// -------------------------
// 手牌表示（CPU）
// -------------------------
export function renderCPUHand(cpuIndex, count) {
  const area = document.getElementById(`cpu${cpuIndex}-hand`);
  area.innerHTML = "";

  for (let i = 0; i < count; i++) {
    area.appendChild(createBackImg());
  }
}

// -------------------------
// 捨て牌表示
// -------------------------
export function renderDiscards(playerIndex, discards) {
  const area = document.getElementById(
    playerIndex === 0 ? "player-discards" : `cpu${playerIndex}-discards`
  );
  area.innerHTML = "";

  discards.forEach(tileId => {
    area.appendChild(createTileImg(tileId));
  });
}

// -------------------------
// 状態表示
// -------------------------
export function renderState(state, turn) {
  document.getElementById("state").textContent = `State: ${state}, Turn: ${turn}`;
}


