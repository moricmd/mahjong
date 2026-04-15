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
      return `${tile.suit}${tile.value}r`; // 例: pin5r.png
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
export function renderPlayerHand(player, onClick) {
  const area = document.getElementById("player-hand");
  area.innerHTML = "";

  player.hand.forEach((tile, index) => {
    const img = createTileImg(tile);

    // クリックで打牌
    img.onclick = () => onClick(index);

    // ドラッグ＆ドロップ（自動整理 OFF のときのみ）
    img.draggable = !game.autoSort;

    img.ondragstart = e => {
      e.dataTransfer.setData("index", index);
    };

    img.ondragover = e => e.preventDefault();

    img.ondrop = e => {
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


