// game.js
import { generateTiles, shuffle } from "./tiles.js";
import { Player } from "./player.js";
import { renderDoraIndicators, renderPlayerHand, renderCPUHand, renderDiscards, renderState, createTileElement } from "./ui.js";
import { judgeYaku } from "./yaku.js";
import { calcScore } from "./score.js";
import { chooseDiscardIndex } from "./CPU.js";

export class Game {
  constructor() {

    this.players = [
      new Player(0, false),
      new Player(1, true),
      new Player(2, true)
    ];

    this.state = "INIT";
    this.turn = 0; // 手番管理
    this.turnCount = 0; // 巡目カウンター

    this.canDoubleRiichi = true;

    this.wallIndex = 0;
    this.autoSort = true;

    this.honba = 0;
    this.kyotaku = 0;

    this.wall = [];
    this.rinshan = [];
    this.doraIndicators = [];
    this.uraIndicators = [];


    this.scores = [35000, 40000, 30000]; //動作確認用

    //this.scores = [35000, 35000, 35000]; // 点数 
    this.showRelativeScores = false; // 相対点数表示（デフォルトはオフ）
    this.round = 1;   // 1=東, 2=南, 3=西
    this.kyoku = 1;   // 1〜3
    this.dealer = 0; 
    
    this.lastDiscarder = null;


    this.initGame();
  }

  
// 初期設定・UI
// ==========================================================================================


  // -------------------------
  // INIT → 山生成
  // -------------------------
  initGame() {
    const winds = [1, 2, 3];
    this.playerWind = winds[Math.floor(Math.random() * winds.length)];

    this.players[0].position = "bottom";

    this.assignSeatsByWind();

    this.dealer = this.players.findIndex(p => p.wind === 1);
    this.turn = this.dealer;

    this.lastDiscarder = null;
    
    this.buildWall();
    this.state = "DEAL";
    this.deal();
  }

  // -------------------------
  // 山構築（嶺上・ドラ）
  // -------------------------
  buildWall() {
    const tiles = generateTiles();
    shuffle(tiles);

    this.rinshan = tiles.splice(-4);
    this.doraIndicators = [tiles.splice(-1)[0]];
    this.uraIndicators = [];

    this.wall = tiles;
    this.wallIndex = 0;
  }

  // -------------------------
  // 配牌
  // -------------------------
  deal() {
    for (let i = 0; i < 13; i++) {
      this.players.forEach(p => p.draw(this.wall[this.wallIndex++]));
    }

    if (this.autoSort) this.sortHand(0);

    this.state = "TURN_START";
    this.updateUI();
  }

  // -------------------------
  // UI 更新
  // -------------------------
  updateUI() {
    renderState(this.state, this.turn);

    renderPlayerHand(
      this.players[0],
      index => this.onPlayerDiscard(index),
      this.autoSort
    );

    renderCPUHand(this.players[1]);
    renderCPUHand(this.players[2]);


    renderDiscards(0, this.players[0].discards, this.players[0].position);
    renderDiscards(1, this.players[1].discards, this.players[1].position);
    renderDiscards(2, this.players[2].discards, this.players[2].position);

    this.updateTableInfo();
    this.updateCPUHandPosition();

    renderDoraIndicators(this.doraIndicators);
    
    this.updateRelativeScores();
    this.updateTurnIndicator(this.turn);

    this.updateHandPositions();
    this.updateDiscardPositions();

    this.updateActionButtons();
    this.updateMelds(this.players[0]);
    this.updateNorthTiles();

  }


  // -------------------------
  // 風の割り当て
  // -------------------------  
  assignSeatsByWind() {
  const bottomWind = this.playerWind; //自分は常に下

  let rightWind, topWind, leftWind;

    this.players[0].position = "bottom";
    this.players[0].wind = bottomWind;

  if (bottomWind === 1) {      // 自分が東
    rightWind = 2;             // 南
    topWind = 3;               // 西

    this.players[1].position = "right";
    this.players[2].position = "top";

    this.players[1].wind = rightWind;
    this.players[2].wind = topWind;
    
    } else if (bottomWind === 2) { // 自分が南
      leftWind = 1;              // 東
      rightWind = 3;             // 西

      this.players[1].position = "left";
      this.players[2].position = "right";

      this.players[1].wind = leftWind;
      this.players[2].wind = rightWind;
    
    } else if (bottomWind === 3) { // 自分が西
      topWind = 1;               // 東
      leftWind = 2;              // 南

      this.players[1].position = "top";
      this.players[2].position = "left";

      this.players[1].wind = topWind;
      this.players[2].wind = leftWind;
    }

  }

  // -------------------------
  // CPUの手牌のクラスを指定
  // -------------------------
  updateCPUHandPosition() {

  const cpu1 = this.players[1];
  const cpu2 = this.players[2];

  const area1 = document.getElementById("cpu1-hand");
  const area2 = document.getElementById("cpu2-hand");

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
  updateTableInfo() {
  const roundNames = ["", "東", "南", "西"];
  document.getElementById("round-display").textContent =
    `${roundNames[this.round]}${this.kyoku}局`;

  const remain = this.wall.length - this.wallIndex;
  document.getElementById("wall-count").textContent = `${remain}`;

  const windChar = {1:"東", 2:"南", 3:"西"};

  // ★ assignSeatsByWind() が wind をセット済み
  const bottomWind = this.players[0].wind;

  // ★ 右・上・左のプレイヤーを position から判定
  let rightWind = null;
  let topWind   = null;
  let leftWind  = null;

  for (const p of this.players) {
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
  const pos = this.players[i].position;

  if (pos === "bottom") {
    document.getElementById("score-bottom").textContent = this.scores[i];
  }
  if (pos === "right") {
    document.getElementById("score-right").textContent = this.scores[i];
  }
  if (pos === "top") {
    document.getElementById("score-top").textContent = this.scores[i];
  }
  if (pos === "left") {
    document.getElementById("score-left").textContent = this.scores[i];
  }
}

}

// ------------------------------ 
// 相対点数表示
// ------------------------------ 

// 山をクリックで表示を切り替え
onWallClick() {
  this.showRelativeScores = !this.showRelativeScores;
  this.updateUI();
}

// 表示設定
updateRelativeScores() {
  const selfIndex = 0; // 自分がプレイヤー0
  const ids = ["score-bottom", "score-top", "score-right"];

  for (let i = 0; i < this.players.length; i++) {
    const elem = document.getElementById(ids[i]);
    if (!elem) continue;

    if (!this.showRelativeScores) {
      // 通常表示
      elem.textContent = this.scores[i];
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

    const diff = this.scores[i] - this.scores[selfIndex];

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
updateTurnIndicator(currentPlayer) {
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
  const pos = this.players[currentPlayer].position; // ← ここがポイント

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





  
// ------------------------------
// プレイモード表示
// ------------------------------
setPlayMode(mode) {
  const el = document.getElementById("play-mode");
  if (el) el.textContent = mode;
}



// -------------------------
// 一発クリア
// -------------------------
clearIppatsu() {
  for (const p of this.players) {
    p.isIppatsu = false;
  }
}

// -------------------------
// 自動理牌
// -------------------------
sortHand(playerIndex) {
  const p = this.players[playerIndex];
  if (p.hand.length !== 13) return;

  const windOrder = { 1: 0, 2: 1, 3: 2, 4: 3 };
  const dragonOrder = { 1: 0, 2: 1, 3: 2 };
  const suitOrder = { man: 0, pin: 1, sou: 2, wind: 3, dragon: 4 };

  p.hand.sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }

    if (a.suit === "man" || a.suit === "pin" || a.suit === "sou") {
      if (a.value !== b.value) return a.value - b.value;
      return (a.red ? 1 : 0) - (b.red ? 1 : 0);
    }

    if (a.suit === "wind") {
      return windOrder[a.value] - windOrder[b.value];
    }

    if (a.suit === "dragon") {
      return dragonOrder[a.value] - dragonOrder[b.value];
    }

    return 0;
  });
}

  
// 副露処理 
// ===========================================================================


// ------------------------------
// 立直
// ------------------------------
onRiichi() {
  const p = this.players[0];

  // すでにリーチしているなら無効
  if (p.isRiichi) return;

  // 門前でないとリーチ不可
  if (!p.isMenzen) return;

  // テンパイしていなければ無効
  if (!this.isTenpai(p)) return;
  
  // 点数不足
  if (this.scores[0] < 1000) return;

  // 1000点支払い
  this.scores[0] -= 1000;
  this.kyotaku++;

  // リーチフラグ
  p.isRiichi = true;
  p.riichiTurn = this.turnCount;
  p.riichiTile = this.lastDrawnTile;
  p.isIppatsu = true;

  /* ダブル立直
  
   ・turnCount === 1（第一ツモ）
   ・canDoubleRiichi が true（誰も鳴いていない） */
  if (this.turnCount === 1 && this.canDoubleRiichi) {
    p.isDoubleRiichi = true;
  }

  // UI更新（リーチボタン消すなど）
  this.updateUI();

  // -------------------------
  // リーチ宣言牌をツモ切り
  // -------------------------
  const discardTile = p.discard(p.hand.length - 1);

  // -------------------------
  // リーチ後のフリテン判定
  // -------------------------
  // 自分の捨て牌に待ち牌が含まれていればフリテン
  this.checkDiscardFuriten(p);

  // -------------------------
  // ロンチェック（他家がロンできるか）
  // -------------------------
  if (this.onCheckRon(discardTile, 0)) return;

  // 次のターンへ
  this.state = "NEXT_TURN";
  this.updateUI();
  this.autoContinue();
}



// -------------------------
// ポン
// -------------------------
onPon(playerIndex, tile) {
  const p = this.players[playerIndex];


  // どの相手から鳴いたか
  const fromPos = this.players[this.lastDiscarder].position;
  let from = "top";
  if (fromPos === "right") from = "right";
  if (fromPos === "left")  from = "left";
  if (fromPos === "top")  from = "top";

  // 手牌から2枚抜く
  let removed = 0;
  for (let i = 0; i < p.hand.length && removed < 2; i++) {
    if (sameTile(p.hand[i], tile)) {
      p.hand.splice(i, 1);
      i--;
      removed++;
    }
  }

  p.melds.push({
    type: "pon",
    tiles: [tile, tile, tile]
  });

  p.isMenzen = false;
  this.canDoubleRiichi = false;
  this.clearIppatsu();

  this.turn = playerIndex;
  this.state = "DISCARD";
  this.updateUI();
}

// -------------------------
// 暗槓
// -------------------------
onAnkan(playerIndex, tile) {
  const p = this.players[playerIndex];

  // 手牌から4枚抜く
  let removed = 0;
  for (let i = 0; i < p.hand.length && removed < 4; i++) {
    if (sameTile(p.hand[i], tile)) {
      p.hand.splice(i, 1);
      i--;
      removed++;
    }
  }

  p.melds.push({
    type: "ankan",
    tiles: [tile, tile, tile, tile]
  });

  p.kanCount++;
  this.addKanDora();

  this.canDoubleRiichi = false;
  this.clearIppatsu();

  this.state = "DRAW";
  this.updateUI();
}

// -------------------------
// 大明槓
// -------------------------
onDaiminkan(playerIndex, tile) {
  const p = this.players[playerIndex];

  // 誰から鳴いたか
  const fromPos = this.players[this.lastDiscarder].position;
  let from = "top";
  if (fromPos === "right") from = "right";
  if (fromPos === "left")  from = "left";
  if (fromPos === "top")  from = "top";

  // 手牌から3枚抜く
  let removed = 0;
  for (let i = 0; i < p.hand.length && removed < 3; i++) {
    if (sameTile(p.hand[i], tile)) {
      p.hand.splice(i, 1);
      i--;
      removed++;
    }
  }

  p.melds.push({
    type: "daiminkan",
    tiles: [tile, tile, tile, tile]
  });

  p.isMenzen = false;
  p.kanCount++;

  this.addKanDora();

  this.canDoubleRiichi = false;
  this.clearIppatsu();

  this.turn = playerIndex;
  this.state = "DRAW";
  this.updateUI();
}

  // -------------------------
  // 加槓
  // -------------------------
  onKakan(playerIndex, tile) {
    const p = this.players[playerIndex];

    // 既存のポン面子を探す
    const meld = p.melds.find(m => m.type === "pon" && sameTile(m.tiles[0], tile));

    // 手牌から1枚抜く
    const idx = p.hand.findIndex(t => sameTile(t, tile));
    p.hand.splice(idx, 1);

    // ポン → 加槓に変換
    meld.type = "kakan";
    meld.tiles.push(tile);

    // from はポン時のものをそのまま使う
    // meld.from は既に入っているので変更不要

    p.kanCount++;

    this.addKanDora();

    this.canDoubleRiichi = false;
    this.clearIppatsu();

    this.state = "DRAW";
    this.updateUI();
  }

  // -------------------------
  // 北抜き
  // -------------------------
  onNorth(playerIndex) {
    const p = this.players[playerIndex];

    const idx = p.hand.findIndex(t => t.suit === "wind" && t.value === 4);
    if (idx < 0) return;

    const tile = p.hand[idx];
    p.hand.splice(idx, 1);

    p.northCount++;

    this.doraIndicators.push(tile);


    this.canDoubleRiichi = false;
    this.clearIppatsu();

    this.state = "DRAW";
    this.updateUI();
  }

  // -------------------------
  // カンドラ追加（仮実装）
  // -------------------------
  addKanDora() {
    if (this.wall.length > 0) {
      this.doraIndicators.push(this.wall[this.wallIndex++]);
    }
  }


  /* 副露後の牌描画*/
  updateMelds() {
  const area = document.getElementById("player-melds");
  area.innerHTML = "";

  const p = this.players[0];

  p.melds.forEach(m => {
    m.tiles.forEach(tile => {
      const img = createTileElement(tile);
      area.appendChild(img);
    });
  });
}


/* 北抜き後の牌描画*/
updateNorthTiles() {
  const area = document.getElementById("player-north");
  area.innerHTML = "";

  const p = this.players[0];

  for (let i = 0; i < p.northCount; i++) {
    const img = createTileElement({ suit:"wind", value:4 });
    area.appendChild(img);
  }
}


// -------------------------
// フリテン
// -------------------------

// 捨て牌によるフリテン
checkDiscardFuriten(player) {
  const waits = player.tenpaiWaits;
  const discards = player.discards;

  // テンパイしていないならフリテンなし
  if (!player.isTenpai) {
    player.isFuriten = false;
    player.furitenType = "none";
    return;
  }

  // 捨て牌に待ち牌が含まれているか
  for (const w of waits) {
    if (discards.includes(w)) {
      player.isFuriten = true;
      player.furitenType = "discard";
      return;
    }
  }

  // フリテン解除
  player.isFuriten = false;
  player.furitenType = "none";
}



// 同巡フリテン 
checkSameTurnFuriten(player, tile) {
  // 自分の最後の捨て牌と一致したら同巡フリテン
  const lastDiscard = player.discards[player.discards.length - 1];
  if (lastDiscard && lastDiscard === tile) {
    player.isFuriten = true;
    player.furitenType = "sameTurn";
    return true; // フリテン
  }
  return false;
}



// リーチ後見逃しフリテン
checkRiichiMissFuriten(player) {
  if (player.isRiichi && player.missedRon) {
    player.isFuriten = true;
    player.furitenType = "riichi";
    return true;
  }
  return false;
}




  

  
// ゲーム進行
// ===========================================================================

step() {

// ★ デバッグログ（開発用）
const p = this.players[this.turn];
const windChar = {1:"東", 2:"南", 3:"西"};
console.log(
  `%c[STEP] Player=${this.turn} (${p.isCPU ? "CPU" : "YOU"})  Wind=${windChar[p.wind]}  State=${this.state}`,
  "color:#4CAF50; font-weight:bold;"
);

  
    
  switch (this.state) {
    case "TURN_START":
      this.onTurnStart();
      break;

    case "DRAW":
      this.onDraw();
      break;

    case "CHECK_WIN":
      this.onCheckWin();
      break;

    case "DISCARD":
      const p = this.players[this.turn];

      // プレイヤー → UI で待つ
      if (!p.isCPU) {
        break;
      }

      // CPU → 自動打牌
      this.onCPUDiscard();
      break;

    case "NEXT_TURN":
      this.onNextTurn();
      break;

    case "END_ROUND":
      alert("局終了（仮）");
      break;
   }

  this.updateUI();
  this.autoContinue();
}

  // -------------------------
  // TURN_START
  // -------------------------
  onTurnStart() {
    if (this.wallIndex >= this.wall.length) {
      this.state = "END_ROUND";
      return;
    }
    this.state = "DRAW";
  }

  // -------------------------
  // DRAW → ツモ
  // -------------------------
  onDraw() {
    const p = this.players[this.turn];
    const tile = this.wall[this.wallIndex++];
    p.draw(tile);

    this.turnCount++; // 巡目を進める

    this.state = "CHECK_WIN";
  }

  // ------------------------------
  // 処理待ちとCPUの自動進行
  // ------------------------------
  autoContinue() {
    const p = this.players[this.turn];

    // プレイヤーの打牌待ちだけ止める
    if (!p.isCPU && this.state === "DISCARD") {
      return;
    }

    // ポン・カン選択待ち
    if (this.state === "WAIT_PON_KAN") {
      return;
    }
    
    // onCPUDiscardで管理
    if (p.isCPU && this.state === "DISCARD") return;

    // 次のプレイヤーに移る際は500ms
    if (this.state === "NEXT_TURN") {
      setTimeout(() => this.step(), 500);
      return;
    }

    // 基本の処理遅延は300ms
    setTimeout(() => this.step(), 300);
    
  }
 
  // ------------------------------
  // CPUの思考時間をランダム生成
  // ------------------------------
  getRandomDelay() {
    // CPUの打牌時のみ2500〜3500ms
    return 2500 + Math.floor(Math.random() * 1000); 
  }


  

  // -------------------------
  // CHECK_WIN → 和了判定
  // -------------------------
  onCheckWin() {
    const p = this.players[this.turn];
    const lastTile = p.hand[p.hand.length - 1];

    const result = judgeYaku(
      p,
      p.hand,
      lastTile,
      true,   // isTsumo
      false,  // isRon
      this.playerWind,
      1,
      this.doraIndicators,
      this.uraIndicators,
      this.wallIndex >= this.wall.length
    );

    if (result.han > 0) {
      const score = calcScore(result, 30, this.turn === 0, true);

      alert(`プレイヤー${this.turn} ツモ和了！ han=${result.han}\n${result.yakuList.join(" / ")}`);
      const winnerIndex = this.turn;
      const renchan = (winnerIndex === this.dealer);

      this.nextRound(renchan, winnerIndex);
      return;
    }


    // 立直していた場合
    if (p.isRiichi) {
      result.han += 1; // 立直

      if (p.isIppatsu) {
        result.han += 1; // 一発
      }

      // 裏ドラ
      this.uraIndicators = [this.wall[this.wallIndex++]];
    }


    // 和了でなければ捨て牌へ
    if (p.isCPU) {
      const idx = chooseDiscardIndex(p.hand);
      const discardTile = p.discard(idx);

      if (this.onCheckRon(discardTile, this.turn)) return;

      if (this.autoSort) this.sortHand(this.turn);
      this.state = "NEXT_TURN";
    } else {
      this.state = "DISCARD";
    }
  }


  
  // ツモ判定
  onTsumo() {
  const p = this.players[this.turn];
  const lastTile = p.hand[p.hand.length - 1];

  const result = judgeYaku(
    p,
    p.hand,
    lastTile,
    true,   // isTsumo
    false,  // isRon
    this.playerWind,
    1,
    this.doraIndicators,
    this.uraIndicators,
    this.wallIndex >= this.wall.length
  );

  // 立直していた場合の処理
  if (p.isRiichi) {
    result.han += 1; // 立直
    if (p.isIppatsu) result.han += 1; // 一発
    this.uraIndicators = [this.wall[this.wallIndex++]];
  }

  if (result.han > 0) {
    const score = calcScore(result, 30, this.turn === 0, true);

    alert(`プレイヤー${this.turn} ツモ和了！ han=${result.han}\n${result.yakuList.join(" / ")}`);

    const winnerIndex = this.turn;
    const renchan = (winnerIndex === this.dealer);

    this.nextRound(renchan, winnerIndex);
    return;
  }

  // 和了でなければ何もしない（ツモボタンは和了専用）
}


  

  // -------------------------
  // ロン判定
  // -------------------------
  onCheckRon(discardTile, discarderIndex) {
    for (let i = 0; i < 3; i++) {
      if (i === discarderIndex) continue;

      const p = this.players[i];
      const tempHand = [...p.hand, discardTile];

      const result = judgeYaku(
        p,
        tempHand,
        discardTile,
        false,  // isTsumo
        true,   // isRon
        this.playerWind,
        1,
        this.doraIndicators,
        this.uraIndicators,
        this.wallIndex >= this.wall.length
      );

      if (result.han > 0) {
        const score = calcScore(result, 30, i === 0, false);

        alert(`プレイヤー${i} が ロン和了！ han=${result.han}\n${result.yakuList.join(" / ")}`);

       const winnerIndex = i;
       const renchan = (winnerIndex === this.dealer);

       this.nextRound(renchan, winnerIndex);
       return true;
      }
    }

    return false;
  }


  // -------------------------
  // 聴牌判定
  // -------------------------
  isTenpai(playerIndex) {
    const p = this.players[playerIndex];
    return this.checkTenpai(p.hand);
  }


  // -------------------------
  // DISCARD
  // -------------------------
  onPlayerDiscard(index) {
    if (this.state !== "DISCARD") return;

    const p = this.players[0];

    // 立直後はツモ切りのみ
    if (p.isRiichi) {
      index = p.hand.length - 1;
    }


    // -------------------------
    // ★ リーチ中の一発消し（和了しなかった場合）
    // -------------------------
    if (p.isRiichi && p.isIppatsu) {
      // この打牌で和了していない → 一発終了
      p.isIppatsu = false;
    }
    
    const discardTile = p.discard(index);

    if (this.onCheckRon(discardTile, 0)) return;

    if (this.autoSort) this.sortHand(0);

    this.lastDiscarder = this.turn;

    this.state = "NEXT_TURN";
    this.updateUI();

    this.autoContinue();
  }

  onCPUDiscard() {
    const p = this.players[this.turn];

    const idx = chooseDiscardIndex(p.hand);
    const discardTile = p.discard(idx);

    // ロン判定
    if (this.onCheckRon(discardTile, this.turn)) return;


  // 一発消し
  if (p.isRiichi && p.isIppatsu) {
    p.isIppatsu = false;
  }

    if (this.autoSort) this.sortHand(this.turn);

    this.lastDiscarder = this.turn;

    this.state = "NEXT_TURN";
    
    const delay = this.getRandomDelay();
    setTimeout(() => this.step(), delay);
  }



  // -------------------------
  // NEXT_TURN
  // -------------------------
  onNextTurn() {
    this.turn = this.getNextTurnIndex(this.turn);
    this.state = "TURN_START";

    if (this.players[this.turn].isCPU) {
    }
  }


  // 座席に基づいた次の手番を返す
  getNextTurnIndex(currentIndex) {
  const order = ["bottom", "right", "top", "left"]; // 反時計回り
  const currentPos = this.players[currentIndex].position;

  let i = order.indexOf(currentPos);

  // 次の座席を探す（存在するプレイヤーだけ）
  for (let step = 1; step <= 4; step++) {
    const nextPos = order[(i + step) % 4];
    const nextPlayer = this.players.findIndex(p => p.position === nextPos);
    if (nextPlayer !== -1) {
      return nextPlayer;
    }
  }

  return currentIndex; // 念のため
}




  // -------------------------
  // 場進行
  // -------------------------
  // 40000点以上のプレイヤーがいるか
hasPlayerOver40000() {
  return this.scores.some(s => s >= 40000);
}

// 対局終了
endGame() {
  const maxScore = Math.max(...this.scores);
  const winner = this.scores.indexOf(maxScore);

  alert(`ゲーム終了！\n1位は プレイヤー${winner}（${maxScore}点）`);
  this.state = "END_ROUND";
}

// 場進行
nextRound(renchan, winnerIndex = null) {
  const parent = this.dealer;
  const someoneOver40k = this.hasPlayerOver40000();

  // 今がオーラスかどうか（東3 / 南3 / 西3）
  const isAllLast =
    (this.round === 1 && this.kyoku === 3) ||
    (this.round === 2 && this.kyoku === 3) ||
    (this.round === 3 && this.kyoku === 3);

  // --- 1) 東3局終了時の処理 ---
  if (this.round === 1 && this.kyoku === 3) {
    if (someoneOver40k) {
      // 誰かが40000点以上 → 即終了
      this.endGame();
      return;
    }
    // 誰も40000に届いていない → 南1へ
    this.round = 2;
    this.kyoku = 1;
    this.dealer = 0;      // 東場の親をどうするかは好みだが、ここではプレイヤー0を親にしている
    this.startNewHand();
    return;
  }

  // --- 2) 南場以降での40000点即終了ルール ---
  if (this.round >= 2 && someoneOver40k) {
    // 南1以降は、局数に関係なく誰かが40000点に到達した時点で終了
    this.endGame();
    return;
  }

  // --- 3) オーラスの親あがり/テンパイやめ ---
  if (isAllLast && someoneOver40k) {
    const parentCondition =
      (winnerIndex === parent) || this.isTenpai(parent);

    if (parentCondition) {
      // 親が和了 or テンパイで40000到達 → 連荘せず終了
      this.endGame();
      return;
    }
  }

  // --- 4) ここまで来たら通常の場進行 ---

  if (renchan) {
    // 親連荘：親はそのまま、局だけ進める
    this.kyoku++;
    if (this.kyoku > 3) this.kyoku = 3;  // 三麻なので3まで
    // 本当は本場カウントを増やすならここで this.honba++ など
    this.startNewHand();
    return;
  }

  // 親交代
  this.dealer = (this.dealer + 1) % 3;

  // 局進行
  this.kyoku++;
  if (this.kyoku > 3) {
    this.kyoku = 1;
    this.round++;
  }

  // 西3局を打ち終わったあと
  if (this.round === 4) {
    // まだ誰も40000に届いていない → 強制終了（トップ勝ち）
    this.endGame();
    return;
  }

  this.startNewHand();
}

  
  // ------------------------------
  // 画面中央から均等に配置
  // ------------------------------

  // 手牌
  updateHandPositions() {
const table = document.getElementById("table");
  const rect  = table.getBoundingClientRect();

  const yama = document.getElementById("table-info");
  const yamaRect = yama.getBoundingClientRect();

  // 山の中心（画面座標）
  const yamaCenterX = yamaRect.left + yamaRect.width  / 2;
  const yamaCenterY = yamaRect.top  + yamaRect.height / 2;

  // 山の中心（table 内座標）
  const cx = yamaCenterX - rect.left;
  const cy = yamaCenterY - rect.top;

  const offset = yamaRect.width * 1.3;

    
  const set = (cls, x, y) => {
      const el = document.querySelector(cls);
      if (el) {
        el.style.left = `${x}px`;
        el.style.top  = `${y}px`;
      }
    };

    set(".hand-bottom", cx,          cy + offset);
    set(".hand-top",    cx,          cy - offset);
    set(".hand-right",  cx + offset, cy);
    set(".hand-left",   cx - offset, cy);
}



  // 捨て牌
  updateDiscardPositions() {
  const table = document.getElementById("table");
  const rect  = table.getBoundingClientRect();

  const yama = document.getElementById("table-info");
  const yamaRect = yama.getBoundingClientRect();

  // 山の中心（table 内座標）
  const cx = (yamaRect.left - rect.left) + yamaRect.width  / 2;
  const cy = (yamaRect.top  - rect.top ) + yamaRect.height / 2;

  const offset = yamaRect.width * 0.9;

  const set = (cls, x, y) => {
      const el = document.querySelector(cls);
      if (el) {
        el.style.left = `${x}px`;
        el.style.top  = `${y}px`;
      }
    };

    set(".discard-bottom", cx,          cy + offset);
    set(".discard-top",    cx,          cy - offset);
    set(".discard-right",  cx + offset, cy);
    set(".discard-left",   cx - offset, cy);
  }


  // 立直・副露ボタン
  // ===========================================================================
updateActionButtons() {
  const container = document.getElementById("action-buttons");
  container.innerHTML = "";

  const p = this.players[0];

  // -------------------------
  // ① ボタンを表示する状況か？
  // -------------------------

  // 他家の捨て牌でポン・カン待ち
  const isCallTurn = (this.state === "WAIT_PON_KAN");

  // 自分のツモ番（CHECK_WIN → DISCARD）
  const isMyTurn =
    (this.turn === 0) &&
    (this.state === "CHECK_WIN" || this.state === "DISCARD");

  if (!isCallTurn && !isMyTurn) {
    return; // 何も表示しない
  }

  // -------------------------
  // ② ボタン候補を作る（優先順）
  // -------------------------
  let list = [];

  if (isMyTurn) {
    // 立直（門前時のみ）
    if (p.isMenzen && this.canRiichi()) {
      list.push({ name: "立直", handler: () => this.onRiichi() });
    }

    // 和了（ツモ / ロン）
    if (this.canTsumo()) list.push({ name: "ツモ", handler: () => this.onTsumo() });
    if (this.canRon())   list.push({ name: "ロン", handler: () => this.onRon() });

    // 暗槓（自分のツモ番のみ）
    if (this.canAnkan()) {
      list.push({ name: "カン", handler: () => this.onKanSelect() });
    }

    // 北抜き
    if (this.canNorth()) {
      list.push({ name: "北抜き", handler: () => this.onNorth(0) });
    }

  } else if (isCallTurn) {
    // 他家の捨て牌 → ポン / 大明槓 のみ
    if (this.canPon()) {
      list.push({ name: "ポン", handler: () => this.onPonSelect() });
    }
    if (this.canDaiminkan()) {
      list.push({ name: "カン", handler: () => this.onKanSelect() });
    }
  }

  // -------------------------
  // ③ スキップ追加（必ず最後）
  // -------------------------
  if (list.length === 0) return;

  const skip = { name: "スキップ", handler: () => { container.innerHTML = ""; } };
  const total = list.length + 1;

  const slots = new Array(6).fill(null);

  // -------------------------
  // ④ レイアウト
  // -------------------------
  if (total <= 3) {
    // 3個以下 → 3,4,5 を使用
    let pos = 3;
    for (let i = 0; i < list.length; i++) {
      slots[pos++] = list[i];
    }
    slots[pos] = skip;

  } else {
    // 4個以上 → スキップは5固定
    slots[5] = skip;

    // 下段 3,4 に優先順 1,2
    slots[3] = list[0];
    slots[4] = list[1];

    // 上段は右から左へ（2→1→0）
    let pos = 2;
    for (let i = 2; i < list.length; i++) {
      slots[pos--] = list[i];
    }
  }

  // -------------------------
  // ⑤ DOM に追加（null は描画しない）
  // -------------------------
  slots.forEach(item => {
    if (!item) return;
    const btn = this.createActionButton(item.name, item.handler);
    container.appendChild(btn);
  });
}


  




  createActionButton(label, handler) {
    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.textContent = label;
    btn.onclick = handler;
    return btn;
}


 // ------------------------------
 // 副露可能か判断
 // ------------------------------

  // 仮
  checkTenpai(hand) {
  // TODO: 本物のテンパイ判定を実装する
  return false;
}

canTsumo() { return true; }

canRon() {
  if (this.state === "WAIT_RON") {
    if (!player.isFuriten) {
      return true;
    }
  }
}
  
 canRiichi() {
  const p = this.players[0];
  return (
    this.turn === 0 &&
    p.isMenzen &&
    !p.isRiichi &&
    this.isTenpai(0) &&
    (this.wall.length - this.wallIndex) >= 4
  );
}

canPon() {
  return this.state === "WAIT_PON_KAN" && this.ponCandidates?.length > 0;
}

/* canKan() {
  return this.state === "WAIT_PON_KAN" && this.kanCandidates?.length > 0;
} */

canKan() {
  const p = this.players[0];

  // -------------------------
  // ① 他家の捨て牌 → 大明槓
  // -------------------------
  if (this.state === "WAIT_PON_KAN") {
    return this.kanCandidates?.length > 0; // 大明槓候補がある
  }

  // -------------------------
  // ② 自分のツモ番でなければカン不可
  // -------------------------
  const isMyTurn =
    (this.turn === 0) &&
    (this.state === "CHECK_WIN" || this.state === "DISCARD");

  if (!isMyTurn) return false;

  // -------------------------
  // ③ 暗槓（手牌に4枚）
  // -------------------------
  const hasAnkan = p.hand.some(t =>
    p.hand.filter(x => sameTile(x, t)).length === 4
  );

  if (hasAnkan) return true;

  // -------------------------
  // ④ 小明槓（ポン済み + 同じ牌をツモった）
  // -------------------------
  const lastTile = p.hand[p.hand.length - 1]; // ツモ牌

  const hasKakan = p.melds.some(m =>
    m.type === "pon" && sameTile(m.tiles[0], lastTile)
  );

  if (hasKakan) return true;

  return false;
}

canAnkan(player) {
  return false;
}



canNorth() {
  const p = this.players[0];
  return p.hand.some(t => t.suit === "wind" && t.value === 4);
}




}
