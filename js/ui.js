// ui.js
// --------------------------------------------------

// tileIdを文字列に変換
function tileToId(tile) {
  // すでに文字列ならそのまま
  if (typeof tile === "string") return tile;

  // 数牌（萬・筒・索）
  if (tile.suit === "man" || tile.suit === "pin" || tile.suit === "sou") {
    // 赤5対応
    if (tile.red) {
      return `${tile.suit}${tile.value}r`;
    }
    return `${tile.suit}${tile.value}`;
  }

  // 風牌（1=東, 2=南, 3=西, 4=北）
  if (tile.suit === "wind") {
    const map = {
      1: "east",
      2: "south",
      3: "west",
      4: "north"
    };
    return `wind_${map[tile.value]}`;
  }

  // 三元牌（1=白, 2=發, 3=中）
  if (tile.suit === "dragon") {
    const map = {
      1: "white",
      2: "green",
      3: "red"
    };
    return `dragon_${map[tile.value]}`;
  }

  console.warn("Unknown tile:", tile);
  return "back";
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
export function renderPlayerHand(player, onClick, autoSort) {
  const area = document.getElementById("player-hand");
  area.innerHTML = "";

  player.hand.forEach((tile, index) => {
    const img = createTileImg(tile);

    img.onclick = () => onClick(index);

    // 自動整理 OFF のときだけドラッグ可能
    img.draggable = !autoSort;

    img.ondragstart = e => {
      if (autoSort) return;
      e.dataTransfer.setData("index", index);
    };

    img.ondragover = e => {
      if (autoSort) return;
      e.preventDefault();
    };

    img.ondrop = e => {
      if (autoSort) return;

      const from = Number(e.dataTransfer.getData("index"));
      const to = index;

      const t = player.hand.splice(from, 1)[0];
      player.hand.splice(to, 0, t);

      game.updateUI();
    };

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


