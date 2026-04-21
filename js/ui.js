// ui.js
// --------------------------------------------------


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
export function renderPlayerHand(player, onClick, autoSort) {
  const area = document.getElementById("player-hand");
  area.className = "hand-area";

  // 座り順に応じて位置クラスを付与
  if (player.position === "bottom") area.classList.add("hand-bottom");
  if (player.position === "top")    area.classList.add("hand-top");
  if (player.position === "right")  area.classList.add("hand-right");

  area.innerHTML = "";

  // 手牌を描画
  player.hand.forEach((tile, index) => {
    const img = document.createElement("img");
    img.src = tileToImage(tile);
    img.className = "tile";

    // 自分の手牌だけクリック可能
    if (!player.isCPU) {
      img.onclick = () => onClick(index);
    }

    area.appendChild(img);
  });
}




// -------------------------
// 手牌表示（CPU）
// -------------------------
export function renderCPUHand(playerIndex, tileCount, position) {
  const area = document.getElementById(`cpu${playerIndex}-hand`);
  area.className = "hand-area";

  if (position === "top") area.classList.add("hand-top");
  if (position === "right") area.classList.add("hand-right");
  if (position === "left") area.classList.add("hand-left");

  area.innerHTML = "";
  for (let i = 0; i < tileCount; i++) {
    const img = document.createElement("img");
    img.src = "img/back.png";
    area.appendChild(img);
  }
}


// -------------------------
// 捨て牌表示
// -------------------------
export function renderDiscards(playerIndex, discards, position) {
  const area = document.getElementById(`discards-${playerIndex}`);
  area.className = "discard-area";

  if (position === "top") area.classList.add("discard-top");
  if (position === "right") area.classList.add("discard-right");
  if (position === "left") area.classList.add("discard-left");
  if (position === "bottom") area.classList.add("discard-bottom");

  area.innerHTML = "";
  discards.forEach(tile => {
    const img = document.createElement("img");
    img.src = tileToImage(tile);
    area.appendChild(img);
  });
}


// -------------------------
// 状態表示
// -------------------------
export function renderState(state, turn) {
  document.getElementById("state").textContent = `State: ${state}, Turn: ${turn}`;
}


