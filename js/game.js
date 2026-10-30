// game.js
import { generateTiles, shuffle } from "./tiles.js";
import { Player } from "./player.js";
import { renderDoraIndicators, renderPlayerHand, renderCPUHand, renderDiscards, renderState,
         createTileElement,
         assignSeatsByWind,
         updateMelds, updateNorthTiles,
         updateRelativeScores, updateTurnIndicator, updateCPUHandPosition, updateTableInfo
        } from "./ui.js";
import { judgeYaku } from "./yaku.js";
import { calcScore } from "./score.js";
import { chooseDiscardIndex } from "./CPU.js";
import { decomposeHand } from "./melds.js";
import { onRiichi, onCancelRiichi, onTsumo, onPon, onAnkan, onDaiminkan, onKakan, onNorth,
         addKanDora,
         canRiichi, canTsumo, canRon, canPon, canKan, canAnkan, canNorth
        } from "./call.js";
import { checkTenpai, isTenpai, getRiichiCandidates,
         checkDiscardFuriten, checkSameTurnFuriten, checkRiichiMissFuriten
        } from "./rules.js"; 

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
    this.openDoraCount = 0; // ドラ表示牌の公開枚数

    this.showRelativeScores = false; // 相対点数表示（デフォルトはオフ）
    this.round = 1;   // 1=東, 2=南, 3=西
    this.kyoku = 1;   // 1〜3局
    this.dealer = 0; 
    
    this.lastDiscarder = null;

    this.isWaitingRiichi = false;  // 立直ボタン押下時の待ちフラグ


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

    assignSeatsByWind(this.players, this.playerWind);

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

    this.rinshan = tiles.splice(-8); // 嶺上牌: カン最大4回、北抜き最大4回
    this.doraIndicators = tiles.splice(-5); // ドラ表示牌
    this.uraIndicators = tiles.splice(-5); // 裏ドラ表示牌

    this.openDoraCount = 1; // 1枚だけ公開

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

    const p = this.players[0];
    const candidates = p.isWaitingRiichi ? getRiichiCandidates(0) : null;

    renderPlayerHand(
      p,
      index => {
        if(p.isWaitingRiichi && candidates && !candidates.includes(index)){
          return;
        }
        this.onPlayerDiscard(index);
      },
      this.autoSort,
      candidates
    );

    renderCPUHand(this.players[1]);
    renderCPUHand(this.players[2]);


    renderDiscards(0, this.players[0].discards, this.players[0].position);
    renderDiscards(1, this.players[1].discards, this.players[1].position);
    renderDiscards(2, this.players[2].discards, this.players[2].position);

    updateTableInfo(this.round, this.kyoku, this.wall, this.wallIndex, this.players);
    updateCPUHandPosition(this.players);

    renderDoraIndicators(this.doraIndicators, this.openDoraCount);
    
    updateRelativeScores(this.players, this.showRelativeScores);
    updateTurnIndicator(this.turn, this.players);

    this.updateHandPositions();
    this.updateDiscardPositions();

    this.updateActionButtons();
    updateMelds(this);
    updateNorthTiles(this);

  }

  // ----------
  // 相対点数表示
  // ----------
  // 山をクリックで表示を切り替え
  onWallClick() {
    this.showRelativeScores = !this.showRelativeScores;
    this.updateUI();
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
    // ★ 流局処理（END_ROUND にしない）
    const parent = this.dealer;
    const parentTenpai = isTenpai(this, parent);

    const renchan = parentTenpai; // 親テンパイなら連荘
    const isDraw = true;

    this.nextRound(renchan, null, isDraw);
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

  // ドラ表示牌の部分を取り出す
  const openDora = this.doraIndicators.slice(0, this.openDoraCount);
  const uraDora = p.isRiichi ? this.uraIndicators.slice(0, this.openDoraCount) : [];

  const result = judgeYaku(
    p,
    p.hand,
    lastTile,
    true,   // isTsumo
    false,  // isRon
    this.playerWind,
    1,
    openDora,
    uraDora,
    this.wallIndex >= this.wall.length
  );

  // 立直していた場合の処理（先に飜を確定させる）
  if (p.isRiichi) {
    result.han += 1; // 立直
    if (p.isIppatsu) result.han += 1; // 一発
    this.uraIndicators = [this.wall[this.wallIndex++]];
  }

  if (result.han > 0) {

    const winnerIndex = this.turn;
    const renchan = (winnerIndex === this.dealer);

    // ★ 点数計算
    const gainScore = calcScore(this, this.turn, null, false, result.han, result.fu);

    alert(`プレイヤー${this.turn} ツモ和了！ han=${result.han}\n${result.yakuList.join(" / ")}\nscore=${gainScore}`);

    this.nextRound(renchan, winnerIndex);
    return;

  }

  // 和了でなければ捨て牌へ（ここはそのままでOK）
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

  

  // -------------------------
  // ロン判定
  // -------------------------
onCheckRon(discardTile, discarderIndex) {
  for (let i = 0; i < 3; i++) {
    if (i === discarderIndex) continue;

    const p = this.players[i];
    const tempHand = [...p.hand, discardTile];

    const openDora = this.doraIndicators.slice(0, this.openDoraCount);
    const uraDora = p.isRiichi ? this.uraIndicators.slice(0, this.openDoraCount) : [];

    const honbaBonus = this.honba * 300;
    const kyotakuBonus = this.kyotaku * 1000;

    const result = judgeYaku(
      p,
      tempHand,
      discardTile,
      false,  // isTsumo
      true,   // isRon
      this.playerWind,
      1,
      openDora,
      uraDora,
      this.wallIndex >= this.wall.length
    );

    if (result.han > 0) {

      // ★ 先に winnerIndex を宣言する（最重要）
      const winnerIndex = i;
      const renchan = (winnerIndex === this.dealer);

      // ★ 点数計算
      const gainScore = calcScore(this, winnerIndex, discarderIndex, true, result.han, result.fu);

      alert(`プレイヤー${winnerIndex} が ロン和了！ han=${result.han}\n${result.yakuList.join(" / ")}\nscore=${gainScore}`);

      this.nextRound(renchan, winnerIndex);
      return true;
    }
  }

  return false;
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

    // 捨て牌
    const discardTile = p.discard(index);

    // -------------------------
    // ★ リーチ中の一発消し（和了しなかった場合）
    // -------------------------
    if (p.isRiichi && p.isIppatsu) {
      // この打牌で和了していない → 一発終了
      p.isIppatsu = false;
    }
    
    // 立直待ちでの打牌（宣言牌）なら
    if(p.isWaitingRiichi){
      p.isWaitingRiichi = false;
      p.isRiichi = true;          // 待ちを解除して立直に入る
      p.riichiTurn = this.turnCount;
      p.riichiTile = discardTile;

      // 供託支払い
      p.score -= 1000;
      this.kyotaku++;
      
      // 一発フラグ
      p.isIppatsu = true;

      // 第一ツモで副露なし → ダブル立直フラグ
      if(this.turnCount === 1 && this.canDoubleRiichi){
        p.isDoubleRiichi = true;
      }

      // フリテンチェック
      checkDiscardFuriten(p);

    }

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

    const p = this.players[this.turn];

    if (p.isCPU) {
      // CPUなら自動で進行
      const delay = this.getRandomDelay();
      setTimeout(() => this.step(), delay);
    } else {
      // 自分の番ならUIだけ更新
      this.updateUI();
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
  return this.players.some(p => p.score >= 40000);
}

// 対局終了
endGame() {

  const rankedPlayers = [...this.players].sort((a, b) => {

    if (a.score !== b.score){
      return b.score - a.score;
    }
    return a.priority - b.priority;
  });

  let resultMsg = "End Game\n"

  rankedPlayers.forEach((p, rankIndex) => {
    const playerIndex = this.players.indexOf(p);
    const rank = rankIndex + 1;

    resultMsg += `${rank}位: プレイヤー${playerIndex} (${p.score}点)\n`;
  });

  alert(resultMsg);

  this.state = "END_ROUND";
}


// 場進行
nextRound(renchan, winnerIndex = null, isDraw = false) {
  const parent = this.dealer;
  const parentTenpai = this.isTenpai(this, parent);

  // デバッグ用
  console.log("--- nextRound 呼び出し ---");
  console.log("isDraw:", isDraw);
  console.log("parent (親のindex):", parent);
  console.log("parentTenpai (親のテン牌状態):", parentTenpai);
  console.log("winnerIndex:", winnerIndex);

  // 飛び終了チェック: 持ち点が0未満のプレイヤーがいるなら強制終了
  if(this.players.some(p => p.score < 0)){
    console.log("飛び終了");
    this.endGame();
    return;
  }

      
  // 南入後では40000点を超えるプレイヤーが現れた時点で終了
  if (this.round >= 2){
    if (this.hasPlayerOver40000()){
      this.endGame();
      return;
    }
  }

  // --- 本場処理 ---
  if (isDraw) {
    // 流局
    this.honba += 1;  // 親テンパイでもノーテンでも +1
  } else {
    // 和了
    if (winnerIndex === parent) {
      // 親和了 → 連荘
      this.honba += 1;
    } else {
      // 子和了 → 本場リセット
      this.honba = 0;
    }
  }

  // --- 連荘判定 ---
  const isRenchan =
    (winnerIndex === parent) ||        // 親和了
    (isDraw && parentTenpai);          // 親テンパイ流局

  const isEast3 = (this.round === 1 && this.kyoku === 3);




  // 連荘時の処理
  if (isRenchan) {

    // 東3局で連荘する場合
    if(isEast3 && isRenchan){
      // 40000点を超えていたなら終了
      if(this.players[parent].score >= 40000){
        console.log("親の40000点越え");
        this.endGame()
        return;
      } else {
        console.log("40000点に満たない（続行）");
      }
    }

    console.log("通常連荘");
    this.startNewHand();  // 局は進めない、親も風もそのまま
    return;
  }

  // ------------------------------
  //  連荘しなかった場合
  // ------------------------------

  // 東3局終了時
  if(isEast3){

    // 40000点以上のプレイヤーが存在するなら終了
    if(this.hasPlayerOver40000()){
      console.log("40000点以上のプレイヤーが存在");
      this.endGame();
      return;
    } else {
      // 南入
      this.round = 2;
      this.kyoku = 1;
      this.dealer = (this.dealer + 1) % 3;
      this.startNewHand();
      return;
    }
  }

  // 通常の局終了時
  // 親交代
  this.dealer = (this.dealer + 1) % 3;

  // --- 局進行 ---
  this.kyoku++;

  // 南3局までやったら終了
  if(this.round === 2 && this.kyoku > 3){
    console.log("南3局終了");
    this.endGame();
    return;
  }

  this.startNewHand();
}




// ローテーション
rotatePlayerWinds() {

  const windMap = { 0: 1,  // 東
                1: 2,  // 南
                2: 3   // 西
              };

  for (let i = 0; i < this.players.length; i++) {
    const relativePos = (i - this.dealer + 3) % 3;
    this.players[i].wind = windMap[relativePos];
  }
}




// -------------------------
// 次の局に移動
// -------------------------
startNewHand() {
  // --- 山を作り直す ---
  this.buildWall();

  // --- 各種状態リセット ---
  this.wallIndex = 0;
  this.turnCount = 0;
  this.canDoubleRiichi = true;
  this.lastDiscarder = null;

  // --- プレイヤー状態リセット ---
  for (const p of this.players) {
    p.hand = [];
    p.discards = [];
    p.melds = [];
    p.isRiichi = false;
    p.isDoubleRiichi = false;
    p.isIppatsu = false;
    p.isMenzen = true;
    p.kanCount = 0;
    p.northCount = 0;
    p.missedRon = false;
  }

  // ローテーション
  this.rotatePlayerWinds();

  // --- 親の手番から開始 ---
  this.turn = this.dealer;

  // --- 配牌 ---
  this.state = "DEAL";
  this.deal();


  // UI更新
  this.updateUI();
}



// ------------------------------
  // 画面中央から均等に配置
  // ------------------------------
// ------------------------------
  // 手牌の位置を更新
  // ------------------------------
  updateHandPositions() {
    const table = document.getElementById("table");
    const rect  = table.getBoundingClientRect();
    const yama  = document.getElementById("table-info");
    const yamaRect = yama.getBoundingClientRect();

    const cx = (yamaRect.left - rect.left) + yamaRect.width  / 2;
    const cy = (yamaRect.top  - rect.top ) + yamaRect.height / 2;

    // ★手牌用の独立したオフセット
    const offset = yamaRect.width * 1.4;

    // 各プレイヤーの position に応じて座標と回転を決定
    this.players.forEach((player, index) => {
      // プレイヤー(0)なら #player-wrapper、CPUなら #cpu1-wrapper, #cpu2-wrapper
      const selector = index === 0 ? "#player-wrapper" : `#cpu${index}-wrapper`;
      const el = document.querySelector(selector);
      if (!el) return;

      let x = cx;
      let y = cy;
      let rotate = 0;

      switch (player.position) {
        case "bottom":
          y = cy + offset;
          rotate = 0;
          break;
        case "top":
          y = cy - offset;
          rotate = 180;
          break;
        case "right":
          x = cx + offset;
          y = cy - 14;  // 牌0.5枚分
          rotate = -90;
          break;
        case "left":
          x = cx - offset;
          y = cy + 14;
          rotate = 90;
          break;

          //
          // hand-areaが14枚分の箱を用意する都合上rightとleftでは牌1枚分の
          // 高さのずれが起こるので、(40px * 0.7) = 28pxの半分だけそれぞれずらすことで
          // 位置を合わせる
          //

      }

      el.style.position = "absolute";
      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      el.style.transform = `translate(-50%, -50%) rotate(${rotate}deg)`;
    });
  }

  // ------------------------------
  // 捨て牌の位置を更新
  // ------------------------------
  updateDiscardPositions() {
    const table = document.getElementById("table");
    const rect  = table.getBoundingClientRect();
    const yama  = document.getElementById("table-info");
    const yamaRect = yama.getBoundingClientRect();

    const cx = (yamaRect.left - rect.left) + yamaRect.width  / 2;
    const cy = (yamaRect.top  - rect.top ) + yamaRect.height / 2;

    // ★捨て牌用の独立したオフセット（手牌とは完全に別個の距離にできる！）
    const offset = yamaRect.width * 0.8;

    this.players.forEach((player, index) => {
      // 捨て牌は #discards-0, #discards-1, #discards-2
      const selector = `#discards-${index}`;
      const el = document.querySelector(selector);
      if (!el) return;

      let x = cx;
      let y = cy;
      let rotate = 0;

      switch (player.position) {
        case "bottom":
          y = cy + offset;
          rotate = 0;
          break;
        case "top":
          y = cy - offset;
          rotate = 180;
          break;
        case "right":
          x = cx + offset;
          rotate = -90;
          break;
        case "left":
          x = cx - offset;
          rotate = 90;
          break;
      }

      el.style.position = "absolute";
      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      el.style.transform = `translate(-50%, -50%) rotate(${rotate}deg)`;
    });
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

  if(p.isWaitingRiichi){
    // 立直待ち中はキャンセルボタンしか表示させない
    list.push({"name": "キャンセル", handler: () => onCancelRiichi(this, 0)});

  } else if (isMyTurn) {
    // 立直（門前時のみ）
    if (p.isMenzen && canRiichi(this, 0)) {
      list.push({ name: "立直", handler: () => onRiichi(this, 0) });
    }


    // 和了（ツモ / ロン）
    if (canTsumo(this, 0)) list.push({ name: "ツモ", handler: () => onTsumo(this) });
    if (canRon(this))   list.push({ name: "ロン", handler: () => onRon() });

    // 暗槓（自分のツモ番のみ）
    if (canAnkan(0)) {
      list.push({ name: "カン", handler: () => onKanSelect() });
    }

    // 北抜き
    if (canNorth(this)) {
      list.push({ name: "北抜き", handler: () => onNorth(this, 0) });
    }

  } else if (isCallTurn) {
    // 他家の捨て牌 → ポン / 大明槓 のみ
    if (canPon(this)) {
      list.push({ name: "ポン", handler: () => onPon(this, 0, ) });
    }
    if (canDaiminkan()) {
      list.push({ name: "カン", handler: () => onKan() });
    }
  }

  // -------------------------
  // ③ レイアウト
  // -------------------------
  if (list.length === 0) return;

  const slots = new Array(6).fill(null);
  
  const skip = { name: "スキップ", handler: () => { container.innerHTML = ""; } }
  //
  //  slots = [0] [1] [2]
  //          [3] [4] [5]
  //
  //  ・スキップボタンは必ず5に置く
  //
  //  ・下段から使い、優先度の高いボタンから詰めていく:
  //
  //  　  立直 → ツモ / ロン → ポン → カン → 北抜き　の順
  //
  //  　  優先度の高いものほど左に並ぶ
  //

  const allItems = p.isWaitingRiichi
    ? [...list]         // 立直待ちならキャンセルのみ（listにキャンセルしか入っていない）
    : [...list, skip];  // 各action-btnとスキップボタン

  const total = allItems.length;

  let orderIndex = [];

  if(total == 1){
    // キャンセルボタン
    orderIndex = [5];
  } else if(total === 2){
    orderIndex = [4, 5];
  } else if(total === 3){
    orderIndex = [3, 4, 5];
  } else if(total === 4){
    orderIndex = [3, 4, 0, 5];
  } else if(total === 5){
    orderIndex = [3, 4, 0, 1, 5];
  } else {
    orderIndex = [3, 4, 0, 1, 2, 5];
  }

  for(let i = 0; i < allItems.length; i++){
    if(orderIndex[i] !== undefined){
      slots[orderIndex[i]] = allItems[i];
      console.log(`${allItems[i].name}: ${orderIndex[i]}`);
    }
  }

  console.log("result: ", slots.map(s => s ? s.name : "empty"));
    // -------------------------
  // ④ DOM に追加（null は描画しない）
  // -------------------------
  slots.forEach((item, index) => {
    if (!item) return;
    const btn = this.createActionButton(item.name, item.handler);

    const row = Math.floor(index / 3) + 1;
    const col = (index % 3) + 1;
    
    btn.style.gridRow = row;
    btn.style.gridColumn = col;

    container.appendChild(btn);
  });
}



  createActionButton(label, handler) {
    console.log("生成したラベル: ", label);
    

    const btn = document.createElement("button");
    btn.className = "action-btn";
    btn.textContent = label;
    btn.onclick = handler;

    switch(label){

      case "立直":
        btn.classList.add("btn-riichi");
        break;

      case "キャンセル":
        btn.classList.add("btn-cancel");
        break;

      case "ツモ":
        btn.classList.add("btn-tsumo");
        break;

      case "ロン":
        btn.classList.add("btn-ron");
        break;

      case "ポン":
        btn.classList.add("btn-pon");
        break;

      case "カン":
        btn.classList.add("btn-kan");
        break;

      case "北抜き":
        btn.classList.add("btn-north");
        break;

      case "スキップ":
        btn.classList.add("btn-skip");
        break;

    }

    return btn;
}





}
