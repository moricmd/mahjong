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
export function renderDoraIndicators(doraIndicators, openCount) {
  const area = document.getElementById("dora-indicators");
  if (!area) return;

  area.innerHTML = ""; // 一旦クリア

  for (let i = 0; i < doraIndicators.length; i++) {
    const img = document.createElement("img");

    if (i < openCount) {
      // 公開されているドラ（表）
      img.src = tileToImage(doraIndicators[i]);
    } else {
      // 未公開のドラ（裏）
      img.src = "img/back.png";
    }

    img.className = "tile dora-tile";
    area.appendChild(img);
  }
}



// -------------------------
// 手牌表示（プレイヤー）
// -------------------------
export function renderPlayerHand(player, onClick, autoSort, candidates = null) {
  const area = document.getElementById("player-hand");

  area.classList.remove("hand-top", "hand-right", "hand-bottom", "hand-left");

  // 座り順に応じて位置クラスを付与
  area.classList.add(`hand-${player.position}`);

  area.innerHTML = "";

  player.hand.forEach((tile, index) => {
    const img = document.createElement("img");
    img.src = tileToImage(tile);
    img.className = "tile";

    // 立直待ちの時に打牌できない牌を暗くする
    const isInvalid = player.isWaitingRiichi && candidates && !candidates.includes(index);
    if(isInvalid){
      img.classList.add("disabled");
    }

    if (!player.isCPU) {
      img.onclick = () => {
        if(isInvalid) return;
        onClick(index);
      };
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



// ------------------------------ 
// 相対点数表示
// ------------------------------ 
// 表示設定
export function updateRelativeScores(players, showRelativeScores) {
  const selfIndex = 0; // 自分がプレイヤー0
  const selfScore = players[selfIndex].score;


  for (let i = 0; i < players.length; i++) {

    const p = players[i];
    const elem = document.getElementById(`score-${p.position}`);
    if (!elem) continue;

    if (showRelativeScores) {
      // 通常表示
      elem.textContent = p.score;
      elem.style.color = "black";
      continue;
    }

    // 相対点数表示
    if (i === selfIndex) {
      // 自分は常に +0（グレー）
      elem.textContent = "+0";
      elem.style.color = "#888";
      continue;
    }

    const diff = p.score - selfScore;

    // diff = 0 のとき
    if (diff === 0) {
      elem.textContent = "+0";
      elem.style.color = "#888"; // グレー
      continue;
    }

    // diff > 0（相手のほうが点数が高い）
    if (diff > 0) {
      elem.textContent = `+${diff}`;
      elem.style.color = "blue";
      continue;
    }

    // diff < 0（自分のほうが点数が高い）
    elem.textContent = `${diff}`; // diff は負なのでそのまま "-◯"
    elem.style.color = "red";
  }
}



// ------------------------------ 
// ターンインジケーター
// ------------------------------
export function updateTurnIndicator(currentPlayer, players) {
  // まず全部リセット
  ["bottom", "right", "top", "left"].forEach(pos => {
    const w = document.getElementById(`wind-${pos}`);
    const s = document.getElementById(`score-${pos}`);
    if (w) w.classList.remove("turn-highlight");
    if (s) s.classList.remove("turn-highlight");
  });

  ["wall-top", "wall-right", "wall-bottom", "wall-left"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // 今の手番プレイヤーの座席を取得
  const pos = players[currentPlayer].position; // ← ここがポイント

  // スコア枠を光らせる
  const w = document.getElementById(`wind-${pos}`);
  const s = document.getElementById(`score-${pos}`);
  if (w) w.classList.add("turn-highlight");
  if (s) s.classList.add("turn-highlight");

  // 山の縁を方向に応じて点滅
  if (pos === "bottom") document.getElementById("wall-bottom").style.display = "block";
  if (pos === "right")  document.getElementById("wall-right").style.display  = "block";
  if (pos === "top")    document.getElementById("wall-top").style.display    = "block";
  if (pos === "left")   document.getElementById("wall-left").style.display   = "block";
}



  // -------------------------
  // 風と優先順位の割り当て
  // -------------------------  
export function assignSeatsByWind(players, playerWind) {
  const bottomWind = playerWind; //自分は常に下

  let rightWind, topWind, leftWind;

    players[0].position = "bottom";
    players[0].wind = bottomWind;

  if (bottomWind === 1) {      // 自分が東
    rightWind = 2;             // 南
    topWind = 3;               // 西

    players[1].position = "right";
    players[2].position = "top";

    players[1].wind = rightWind;
    players[2].wind = topWind;

    players[0].priority = 0;
    players[1].priority = 1;
    players[2].priority = 2;
    
    } else if (bottomWind === 2) { // 自分が南
      leftWind = 1;              // 東
      rightWind = 3;             // 西

      players[1].position = "left";
      players[2].position = "right";

      players[1].wind = leftWind;
      players[2].wind = rightWind;

      players[0].priority = 1;
      players[1].priority = 0;
      players[2].priority = 2;
    
    } else if (bottomWind === 3) { // 自分が西
      topWind = 1;               // 東
      leftWind = 2;              // 南

      players[1].position = "top";
      players[2].position = "left";

      players[1].wind = topWind;
      players[2].wind = leftWind;

      players[0].priority = 2;
      players[1].priority = 0;
      players[2].priority = 1;

    }

  }

  // -------------------------
  // CPUの手牌のクラスを指定
  // -------------------------
export function updateCPUHandPosition(players) {

  const cpu1 = players[1];
  const cpu2 = players[2];

  const area1 = document.getElementById("cpu1-hand");
  const area2 = document.getElementById("cpu2-hand");

  if(!area1 || !area2) return;

  // 既存クラスをリセット
  area1.className = "hand-area opponent";
  area2.className = "hand-area opponent";

  // CPU1
  area1.classList.add(`hand-${cpu1.position}`);

  // CPU2
  area2.classList.add(`hand-${cpu2.position}`);
}


  // -------------------------
  // 山の表示
  // -------------------------
export function updateTableInfo(round, kyoku, wall, wallIndex, players) {
  const roundNames = ["", "東", "南", "西"];
  document.getElementById("round-display").textContent =
    `${roundNames[round]}${kyoku}局`;

  const remain = wall.length - wallIndex;
  document.getElementById("wall-count").textContent = `${remain}`;

  const windChar = {1:"東", 2:"南", 3:"西"};

  // ★ assignSeatsByWind() が wind をセット済み
  const bottomWind = players[0].wind;

  // ★ 右・上・左のプレイヤーを position から判定
  let rightWind = null;
  let topWind   = null;
  let leftWind  = null;

  for (const p of players) {
    if (p.position === "right") rightWind = p.wind;
    if (p.position === "top")   topWind   = p.wind;
    if (p.position === "left")  leftWind  = p.wind;
  }

  // ★ まず全枠を非表示にする
  document.getElementById("wind-right").style.display = "none";
  document.getElementById("wind-top").style.display   = "none";
  document.getElementById("wind-left").style.display  = "none";

  document.getElementById("score-right").style.display = "none";
  document.getElementById("score-top").style.display   = "none";
  document.getElementById("score-left").style.display  = "none";

  // ★ bottom は必ず表示
  document.getElementById("wind-bottom").style.display = "flex";
  document.getElementById("score-bottom").style.display = "block";

  // ★ 存在する座席だけ表示
  if (rightWind !== null) {
    document.getElementById("wind-right").style.display = "flex";
    document.getElementById("score-right").style.display = "block";
  }
  if (topWind !== null) {
    document.getElementById("wind-top").style.display = "flex";
    document.getElementById("score-top").style.display = "block";
  }
  if (leftWind !== null) {
    document.getElementById("wind-left").style.display = "flex";
    document.getElementById("score-left").style.display = "block";
  }

  // ★ 風文字を反映
  document.getElementById("wind-bottom").textContent = windChar[bottomWind];
  document.getElementById("wind-right").textContent  = rightWind ? windChar[rightWind] : "";
  document.getElementById("wind-top").textContent    = topWind ? windChar[topWind] : "";
  document.getElementById("wind-left").textContent   = leftWind ? windChar[leftWind] : "";

  // ★ 赤背景リセット
  ["wind-bottom", "wind-right", "wind-top", "wind-left"].forEach(id=>{
    document.getElementById(id).classList.remove("east-wind");
  });

  // ★ 東のプレイヤーだけ赤背景
  if (bottomWind === 1) document.getElementById("wind-bottom").classList.add("east-wind");
  if (rightWind  === 1) document.getElementById("wind-right").classList.add("east-wind");
  if (topWind    === 1) document.getElementById("wind-top").classList.add("east-wind");
  if (leftWind   === 1) document.getElementById("wind-left").classList.add("east-wind");

// ★ 点数表示（座席順に合わせる）
for (let i = 0; i < 3; i++) {
  const pos = players[i].position;

  if (pos === "bottom") {
    document.getElementById("score-bottom").textContent = players[i].score;
  }
  if (pos === "right") {
    document.getElementById("score-right").textContent = players[i].score;
  }
  if (pos === "top") {
    document.getElementById("score-top").textContent = players[i].score;
  }
  if (pos === "left") {
    document.getElementById("score-left").textContent = players[i].score;
  }
}

}