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
// 副露牌表示
// -------------------------
function getMeldTilesForRender(meld) {
  const tiles = [...meld.tiles];

  if (meld.type === "pon") {
    // 取った牌を左に倒す
    const takenTile = tiles.pop(); // 最後が取った牌
    return [
      { tile: takenTile, rotate: true },
      ...tiles.map(t => ({ tile: t, rotate: false }))
    ];
  }

  if (meld.type === "daiminkan") {
    const taken = tiles.pop();

    if (meld.from === "left") {
      // 左から → 左端
      return [
        { tile: taken, rotate: true },
        ...tiles.map(t => ({ tile: t, rotate: false }))
      ];
    }

    if (meld.from === "top") {
      // 対面 → 左から2番目
      return [
        { tile: tiles[0], rotate: false },
        { tile: taken, rotate: true },
        { tile: tiles[1], rotate: false },
        { tile: tiles[2], rotate: false }
      ];
    }

    if (meld.from === "right") {
      // 右から → 右端
      return [
        ...tiles.map(t => ({ tile: t, rotate: false })),
        { tile: taken, rotate: true }
      ];
    }
  }

  if (meld.type === "kakan") {
    // 小明槓 → ポン面子の横向き牌の上に重ねる
    const base = getMeldTilesForRender({
      type: "pon",
      tiles: meld.tiles.slice(0, 3),
      from: meld.from
    });

    const added = meld.tiles[3];

    return base.map((obj, i) => {
      if (obj.rotate) {
        return {
          tile: obj.tile,
          rotate: true,
          stacked: {
            tile: added,
            rotate: true // 上に重ねる牌
          }
        };
      }
      return obj;
    });
  }

  if (meld.type === "ankan") {
    // 暗槓 → 中2枚を裏向きにする
    return [
      { tile: tiles[0], rotate: false },
      { tile: null,   rotate: false, dark: true },
      { tile: null,   rotate: false, dark: true },
      { tile: tiles[3], rotate: false }
    ];
  }
}


// 牌要素作成
export function createTileElement(tile) {
  const img = document.createElement("img");
  img.src = tileToImage(tile);
  img.className = "tile";
  return img;
}

// 描画
export function updateMelds() {
  const area = document.getElementById("player-melds");
  area.innerHTML = "";

  const p = this.players[0];

  p.melds.forEach(meld => {
    const renderTiles = getMeldTilesForRender(meld);

    renderTiles.forEach(obj => {
      const img = createTileElement(obj.tile);

      if (obj.rotate) {
        img.style.transform = "rotate(-90deg)";
      }

      if (obj.dark) {
        img.classList.add("tile-dark");
      }

      area.appendChild(img);

      
      // 小明槓の牌描画
      if (obj.stacked) {
        const stackedImg = createTileElement(obj.stacked.tile);
        stackedImg.style.transform = "rotate(-90deg)";
        stackedImg.classList.add("kakan-stacked");
        area.appendChild(stackedImg);
      }
    });
  });
}



// -------------------------
// 状態表示
// -------------------------
export function renderState(state, turn) {
  document.getElementById("state").textContent = `State: ${state}, Turn: ${turn}`;
}


