// ui.js

import { tileToImage } from "./tiles.js";


// -------------------------
// 牌画像を作る
// -------------------------

// 表面
export function createTileImg(tile) {
  const img = document.createElement("img");
  img.src = tileToImage(tile);
  img.className = "tile";
  return img;
}

// 裏面
export function createBackImg() {
  const img = document.createElement("img");
  img.src = "img/back.png";
  img.className = "tile";
  return img;
}



// -------------------------
// ドラ表示
// -------------------------
export function renderDoraIndicators(doraIndicators) {
  const area = document.getElementById("dora-indicators");
  if (!area) return;

  area.innerHTML = ""; // 一旦クリア

  for (const tile of doraIndicators) {
    const img = document.createElement("img");
    img.src = tileToImage(tile);
    img.className = "tile dora-tile";
    area.appendChild(img);
  }
}


// -------------------------
// 手牌表示（プレイヤー）
// -------------------------
export function renderPlayerHand(player, onClick, autoSort) {
  const area = document.getElementById("player-hand");

  area.classList.remove("hand-top", "hand-right", "hand-bottom", "hand-left");

  // 座り順に応じて位置クラスを付与
  area.classList.add(`hand-${player.position}`);

  area.innerHTML = "";

  player.hand.forEach((tile, index) => {
    const img = document.createElement("img");
    img.src = tileToImage(tile);
    img.className = "tile";

    if (!player.isCPU) {
      img.onclick = () => onClick(index);
    }

    area.appendChild(img);
  });
}





// -------------------------
// 手牌表示（CPU）
// -------------------------
export function renderCPUHand(player) {
  const area = document.getElementById(`cpu${player.index}-hand`);

  if (!area) {
    console.error("CPU hand area not found:", `cpu${player.index}-hand`);
    return;
  }

  area.classList.remove("hand-top", "hand-right", "hand-bottom", "hand-left");
  area.classList.add(`hand-${player.position}`);

  area.innerHTML = "";

  for (let i = 0; i < player.hand.length; i++) {
    const img = document.createElement("img");
    img.src = "img/back.png";
    img.className = "tile";
    area.appendChild(img);
  }
}






// -------------------------
// 捨て牌表示
// -------------------------
export function renderDiscards(playerIndex, discards, position) {
  const area = document.getElementById(`discards-${playerIndex}`);
  area.className = "discard-area opponent";

  if (position === "top") area.classList.add("discard-top");
  if (position === "right") area.classList.add("discard-right");
  if (position === "left") area.classList.add("discard-left");
  if (position === "bottom") area.classList.add("discard-bottom");

  area.innerHTML = "";
  discards.forEach(tile => {
    const img = document.createElement("img");
    img.src = tileToImage(tile);
    img.className = "tile";
    area.appendChild(img);
  });
}


// -------------------------
// 状態表示
// -------------------------
export function renderState(state, turn) {
  document.getElementById("state").textContent = `State: ${state}, Turn: ${turn}`;
}


