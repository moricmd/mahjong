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
import { onRiichi, onCancelRiichi, onTsumo, onRon, onPon, onKan, onAnkan, onDaiminkan, onKakan, onNorth,
         addKanDora,
         canRiichi, canTsumo, canRon, canPon, canKan, canAnkan, canDaiminkan, canKakan, canNorth
        } from "./action.js";
import { checkTenpai, isTenpaiNow, getRiichiCandidates,
         checkDiscardFuriten, checkSameTurnFuriten, checkRiichiMissFuriten
        } from "./rules.js"; 

export class Game {
  constructor() {

    this.players = [
      new Player(0, false),
      new Player(1, true),
      new Player(2, true)
    ];

    this.state = "Init";
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
    this.pendingDiscard;  // 保留中の捨て牌（ロンや副露待ちの牌）

    this.isWaitingRiichi = false;  // 立直ボタン押下時の待ちフラグ

    this.timerId = null;  // step()進行用タイマーの管理
    this._isStepping = false;  // step()の多重実行を防ぐフラグ

    // デバッグ用: 各手番の終了までにかかる時間を計測
    this.startTurnTime = 0;
    this.endTurnTime = 0;


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
    this.state = "Deal";
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

    this.state = "TurnStart";
    this.updateUI();
  }

  // -------------------------
  // UI 更新
  // -------------------------
  updateUI() {
    renderState(this.state, this.turn);

    const p = this.players[0];
    const candidates = p.isWaitingRiichi ? getRiichiCandidates(this, 0) : null;

    renderPlayerHand(
      p,
      index => {
        if(p.isWaitingRiichi && candidates){
          const tile = p.hand[index];
          // candidates内にクリックした牌と一致するものがあるか
          const isCandidates = candidates.some(c => c.suit === tile.suit && c.value === tile.value);

          // 宣言牌候補でなければ打牌できない
          if(!isCandidates) {
            console.log("%c[Reject: updateUI] 宣言牌ではない", "color: #e44848;");
            return;
          }

        }

        this.discardStep(index);
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
  if (p.hand.length !== 13) {
    console.log("%c[Reject: sortHand] 手牌が13枚ではない", "color: #e44848;");
    return;
  }
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
  `%c[Step] Player=${this.turn} (${p.isCPU ? "CPU" : "YOU"})  Wind=${windChar[p.wind]}  State=${this.state}`,
  "color: #4caf50;"
);

if(this._isStepping){
  console.log(`%c[Reject: step] step()の多重実行: state=${this.state}`, "color: #e44848;");
  return;
}

this._isStepping = true;

  
try{    
  switch (this.state) {
    case "TurnStart":
      this.onTurnStart();
      break;

    case "Draw":
      this.onDraw();
      break;

    case "CheckTsumo":
      this.tsumoStep();
      break;

    case "Discard":
      this.discardStep();
      break;
    
    case "CheckRon":
      this.ronStep();
      break;

    case "WaitCall":
      this.callStep();
      break;

    case "Delay":
      this.onDelay();
      break;

    case "NextTurn":
      this.onNextTurn();
      break;

    case "EndRound":
      alert("局終了（仮）");
      break;
   }
  } finally {
    this._isStepping = false;
  }

  this.updateUI();
}

  // -------------------------
  // TURN_START
  // -------------------------
onTurnStart() {


console.log("%c[TurnStart: onTurnStart] 開始", "color: #4b88c2;");

 if(this.startTurnTime > 0){
    this.endTurnTime = performance.now();
    console.log(`%c[PassedTime] ターン終了までの時間: ${this.endTurnTime - this.startTurnTime}`, "color: #1bc7a2ff");

    this.endTurnTime = 0;
  }
  
  this.startTurnTime = performance.now();
  console.log("%c[PassedTime] 計測開始", "color: #1bc7a2ff");


  if (this.wallIndex >= this.wall.length) {
    // ★ 流局処理（END_ROUND にしない）
    const parent = this.dealer;
    const parentTenpai = isTenpaiNow(this, parent);

    const renchan = parentTenpai; // 親テンパイなら連荘
    const isDraw = true;

    this.nextRound(renchan, null, isDraw);
    return;
  }

  this.state = "Draw";
  this.scheduleStep(100);
}


  // -------------------------
  // DRAW → ツモ
  // -------------------------
  onDraw() {
    console.log("%c[Draw: onDraw] 開始", "color: #4b88c2;");
    const p = this.players[this.turn];
    const tile = this.wall[this.wallIndex++];
    p.draw(tile);

    this.turnCount++; // 巡目を進める

    this.state = "CheckTsumo";
    this.scheduleStep(100);
  }
 
  // ------------------------------
  // CPUの思考時間をランダム生成
  // ------------------------------
  getRandomDelay() {
    // CPUの打牌は500〜1000ms遅延を入れる
    return 500 + Math.floor(Math.random() * 500); 
  }


  

  // -------------------------
  // CheckTsumo → 和了判定
  // -------------------------
onCheckTsumo(){
  console.log(`%c[CheckTsumo: onCheckTsumo] 開始\nプレイヤー${this.turn}の手番`, "color: #4b88c2;");

  const p = this.players[this.turn];
  isTenpaiNow(this, this.turn);

  const lastTile = p.hand[p.hand.length - 1];

  // ツモ牌が待ち牌であるか
  const isWaitingTiles = p.isTenpai && 
                        p.waitingTiles.some(
                          w => w.suit === lastTile.suit && w.value === lastTile.value 
                        );

  let isTsumoWin = false;
  let result = null;

  if(!isWaitingTiles){
    console.log("%c[Reject: onCheckTsumo] ツモ牌は待ち牌ではない", "color: #e44848;");
    return null;
  }
    // ドラ表示牌のめくられている部分を取り出す
    const openDora = this.doraIndicators.slice(0, this.openDoraCount);
    const uraDora = p.isRiichi ? this.uraIndicators.slice(0, this.openDoraCount) : [];

    result = judgeYaku(
      p,                // プレイヤー
      p.hand,           // 手牌
      lastTile,         // 和了牌
      true,             // ツモ和了
      this.playerWind,  // 自風
      1,                // 場風
      openDora,         // 表ドラ表示牌
      uraDora,          // 裏ドラ表示牌
      this.wallIndex >= this.wall.length  // ハイテイか
    );

    if(p.isRiichi){
      result.han += 1;
      if(p.isIppatsu) result.han += 1;
    }

    if(result.han <= 0){
      console.log("%c[Reject: onCheckTsumo] ツモ和了していない", "color: #e44848;");
      return null;

      // ツモ和了成立の場合
      return {
        winnerIndex: this.turn,
        result: result
      };
    }
  }

tsumoStep(){
  console.log("%c[CheckTsumo: tsumoStep] 開始", "color: #4b88c2;");
  const tsumoResult = this.onCheckTsumo();

  if(tsumoResult){
    console.log(`%c[CheckTsumo: tsumoStep] プレイヤー${tsumoResult.winnerIndex}がツモ和了`, "color: #4b88c2;");
    this.tsumoPayment(tsumoResult);
    return;
  }

  // 和了していなければ打牌へ
  this.state = "Discard";

  // CPUや立直中のプレイヤーなら自動で打牌処理に流す
  const p = this.players[this.turn];
  if(p.isCPU || p.isRiichi){
    console.log("%c[CheckTsumo: tsumoStep] 自動打牌する", "color: #4b88c2;");
    this.scheduleStep(300);
  }
}

  // -------------------------
  // ロン判定
  // -------------------------


  // -------------------------
  // DISCARD
  // -------------------------
  onDiscard(cardIndex = null){
    console.log("%c[Discard: onDiscard] 開始", "color: #4b88c2;");
    const p = this.players[this.turn];
    let discardTile = null;

    // CPUの捨て牌
    if(p.isCPU){
      console.log("%c[Discard: onDiscard] CPUの打牌", "color: #4b88c2;");
      const idx = chooseDiscardIndex(p.hand);
      discardTile = p.discard(idx);

    // 人間の捨て牌
    } else {

      // 立直している場合
      if(p.isRiichi){

        console.log("%c[Discard: onDiscard] 立直者の打牌（ツモ切り）", "color: #4b88c2;");
        // ツモ切りする
        const lastIndex = p.hand.length - 1;
        discardTile = p.discard(lastIndex);

      // 立直していない場合
      } else {
        console.log("%c[Discard: onDiscard] クリックによる打牌", "color: #4b88c2;");
        if(cardIndex === null) return false;  // 手動（クリックによる打牌）
        discardTile = p.discard(cardIndex);
      }
    }

    this.lastDiscarder = this.turn;

    // 一発消し
    if(p.isRiichi && p.isIppatsu){
      console.log("%c[Discard: onDiscard] 一発フラグを消す", "color: #4b88c2;");
      p.isIppatsu = false;
    }

    // 立直宣言時の処理
    if(p.isWaitingRiichi){
      p.isWaitingRiichi = false;
      p.isRiichi = true;          // 立直待ち状態を解除して立直する
      p.riichiTurn = this.turnCount;
      p.riichiTile = discardTile;
      p.score -= 1000;
      this.kyotaku++;
      p.isIppatsu = true;  // 一発フラグ

      console.log("%c[Discard: onDiscard] 立直した", "color: #4b88c2;");

      // ダブル立直
      if(this.turnCount === 1 && this.canDoubleRiichi){
        console.log("%c[Discard: onDiscard] ダブル立直した", "color: #4b88c2;");
        p.isDoubleRiichi = true;
      }
      checkDiscardFuriten(this, this.turn);
    }
    if(this.autoSort) this.sortHand(this.turn);
    this.updateUI();

    return { 
      discardTile,
      discarder: this.turn  // 打牌したプレイヤー 
    };
  }

  discardStep(cardIndex = null){
    console.log("%c[Discard: discardStep] 開始", "color: #4b88c2;");
    const p = this.players[this.turn];

    // DISCARDではないときには打牌できない
    if(this.state !== "Discard"){ 
      console.log("%c[Reject: discardStep] 打牌できるタイミングではない", "color: #e44848;");
      return;
    }

    // 立直者は自動打牌する
    if(p.isRiichi){
      cardIndex = p.hand.length - 1;
      console.log("%c[Discard: discardStep] 立直中のためツモ切り", "color: #e44848");
    }

    // クリックによる打牌
    // ----------
    //
    //  step()から呼ばれるとcardIndexがnullとなるためreturnされ、
    //  牌のクリックイベントからcardIndexを受け取るのを待つ
    //
    if(!p.isCPU && !p.isRiichi && cardIndex === null){
      console.log("%c[WaitUser: discardStep] 打牌待ち", "color: #dd5d92;");
      return;
    }


    const discardResult = this.onDiscard(cardIndex);

    // 正常な打牌ができなかった場合
    if(!discardResult){
      console.log("%c[Reject: discardStep] 正常に打牌できなかった", "color: #e44848;");
      return;
    }

    const { discardTile, discarder } = discardResult;
    this.pendingDiscard = { discardTile, discarder };

    this.state = "CheckRon";
    this.scheduleStep(100);
  }

  // ----------
  // Delay
  // ----------
  onDelay(){

    console.log("%c[Delay: onDelay] 開始", "color: #4b88c2;");

    // プレイヤーの打牌後、次のプレイヤーに移る（NEXT_TURNに移る）前に
    // 数秒間遅延を入れる

    const p = this.players[this.turn];

    let delayTime = 0;

    if(p.isRiichi){
      console.log(`%c[Delay: onDelay] 立直者（プレイヤー${this.turn}）の打牌: 1000ms遅延`, "color: #4b88c2;");

      // 立直者の遅延は1000ms
      delayTime = 1000;
      this.state = "NextTurn";
      this.scheduleStep(delayTime);
      return;
    }

    if(p.isCPU){
      console.log(`%c[Delay: onDelay] CPU（プレイヤー${this.turn}）の打牌: ${delayTime}ms遅延`, "color: #4b88c2;");

      // CPUの遅延は2500 ~ 3500ms
      delayTime = this.getRandomDelay();
      this.state = "NextTurn";
      this.scheduleStep(delayTime);
      return;
    }


    // 通常打牌では遅延なし
    console.log("%c[Delay: onDelay] クリックによる打牌: 遅延なし", "color: #4b88c2;");
    delayTime = 0;
    this.state = "NextTurn";
    this.scheduleStep(delayTime);
  }
  
  // -------------------------
  // NEXT_TURN
  // -------------------------
  onNextTurn() {
    console.log("%c[NextTurn: onNextTurn]", "color: #4b88c2;");
    this.turn = this.getNextTurnIndex(this.turn);
    this.state = "TurnStart";

    console.log(`%c[NextTurn: onNextTurn] プレイヤー${this.turn}の手番を開始`, "color: #4b88c2;");

    const nextPlayer = this.players[this.turn];
    if(!nextPlayer.isCPU && !nextPlayer.isRiichi){
      console.log("%c[NextTurn: onNextTurn] 次のプレイヤーが人間なのでUIを更新", "color: #4b88c2;");
      this.updateUI();
    }

    this.scheduleStep(500);
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

onCheckRon(discardTile, discarderIndex){
  console.log("%c[CheckRon: onCheckRon] 開始", "color: #4b88c2;");
  for(let i = 0; i < 3; i++){
    if(i === discarderIndex) continue;

    const p = this.players[i];

    const isWaitingTiles = p.isTenpai &&
                           p.waitingTiles.some(
                             w => w.suit === discardTile.suit && w.value === discardTile.value
                           );

    if(!isWaitingTiles || p.isFuriten) continue;

    if(!isWaitingTiles){
      console.log("%c[Reject: onCheckRon] 待ち牌ではない", "color: #e44848;");
      continue;
    }

    if(p.isFuriten){
      console.log("%c[Reject: onCheckRon] フリテンである", "color: #e44848;");
    }
    const tempHand = [...p.hand, discardTile];
    const openDora = this.doraIndicators.slice(0, this.openDoraCount);
    const uraDora = p.isRiichi ? this.uraIndicators.slice(0, this.openDoraCount): [];

    const result = judgeYaku(
      p,
      tempHand,
      discardTile,
      false,
      this.playerWind,
      1,
      openDora,
      uraDora,
      this.wallIndex >= this.wall.length
    );

    if(result.han > 0){
      
      console.log("%c[CheckRon: onCheckRon] ロン和了した", "color: #4b88c2;");
      // ロンならJSONを返す
      return {
        winnerIndex: i,
        discarderIndex: discarderIndex,
        result: result
      };
    }
  }
  // ロンでないならnull
  console.log("%c[CheckRon: onCheckRon] ロン和了していない", "color: #4b88c2;");
  return null;
}

tsumoPayment(tsumoResult){
  console.log("%c[CheckTsumo: tsumoPayment] 開始", "color: #4b88c2;");
  const { winnerIndex, result } = tsumoResult;
  const p = this.players[winnerIndex];

  if(p.isRiichi){
    this.uraIndicators = [this.wall[this.wallIndex++]];
  }
  const renchan = (winnerIndex === this.dealer);
  const gainScore = calcScore(this, winnerIndex, null, result.han, result.fu);
  alert(`プレイヤー${winnerIndex} ツモ和了! han=${result.han}\n${result.yakuList.join(" / ")}\nscore=${gainScore}`);
  
  console.log(`%c[CheckTsumo: tsumoPayment] プレイヤー${winnerIndex} ツモ: han= ${result.han}\n
    yaku=${result.yakuList.join(" / ")}\n
    score=${gainScore}\n`, "color: #4b88c2;");

  // 次の局へ
  this.nextRound(renchan, winnerIndex); 
}

// ロンの処理
ronPayment(ronResult){

  console.log("%c[CheckRon: ronPayment] 開始", "color: #4b88c2;");
  const { winnerIndex, discarderIndex, result} = ronResult;
  const renchan = (winnerIndex === this.dealer);

  const gainScore = calcScore(this, winnerIndex, discarderIndex, result.han, result.fu);

  alert(`プレイヤー${winnerIndex} が ロン和了！ han=${result.han}\n${result.yakuList.join(" / ")}\nscore=${gainScore}`);

    console.log(`%c[CheckRon: ronPayment] プレイヤー${winnerIndex} ロン: han= ${result.han}\n
    yaku=${result.yakuList.join(" / ")}\n
    score=${gainScore}\n`, "color: #4b88c2;");

  this.nextRound(renchan, winnerIndex);
}

ronStep(){
  console.log("%c[CheckRon: ronStep] 開始", "color: #4b88c2;");
  const { discardTile, discarder } = this.pendingDiscard;
  const ronResult = this.onCheckRon(discardTile, discarder);

  if(ronResult){
    console.log("%c[CheckRon: ronStep] ロン和了成立", "color: #4b88c2;");
    this.ronPayment(ronResult);
    this.pendingDiscard = null;
    return;
  }

  console.log("%c[CheckRon: ronStep] ロン和了しなかった", "color: #4b88c2;");
  this.state = "WaitCall";
  this.scheduleStep(100);
}

callStep(){
  console.log("%c[WaitCall: callStep] 開始", "color: #4b88c2;");
  if(!this.pendingDiscard || !this.pendingDiscard.discardTile){
    console.log("%c[Reject: callStep] 捨て牌情報がないためDelayへ移行", "color: #e44848;");
    this.state = "Delay";
    this.scheduleStep(100);
    return;
  }
  const discardTile = this.pendingDiscard.discardTile;

  let canCall = false;       // 一人でも副露できるか
  let humanCanCall = false;  // 人間が副露できるか

  for(let i = 0; i < this.players.length; i++){
    if(i === this.turn) continue;
    const targetPlayer = this.players[i];
    const result = this.matchCallCount(targetPlayer, discardTile);
    const { canPon, canKan } = result;

    if(canPon || canKan){

      canCall = true;
      console.log(`%c[WaitCall: callStep] プレイヤー${i}は${canPon ? "ポン" : ""} ${canKan ? "カン" : ""} が可能`, "color: #4b88c2;");

      // 人間が副露できる場合
      if(!targetPlayer.isCPU){
        humanCanCall = true;

      // CPUが副露できる場合
      } else {
        //
        //  CPUが副露するかを判定
        //
      }
    }
  }


  this.pendingDiscard = null;

  if(!canCall){
    console.log(`%c[Reject: callStep] 副露できるプレイヤーがいない`, "color: #e44848;");
    this.state = "Delay";
    this.scheduleStep(100);
/*  } else if(humanCanCall){
    console.log("[WaitCall: callStep] 副露選択待ち") */
  } else {
    console.log("%c[WaitCall: callStep] CPUなので副露をスキップした\n副露ボタン未実装のためプレイヤーでもスキップしている", "color: #4b88c2;");
    this.state = "Delay";
    this.scheduleStep(100);
  }
}

matchCallCount(player, tile){

  console.log("%c[WaitCall: matchCallCount] 開始", "color: #4b88c2;");
  const len = player.hand.filter(t => t.suit === tile.suit && 
                                 t.value === tile.value).length;

  return {
    canPon: len >= 2,
    canKan: len >= 3
  };
}


// ----------
// タイマー
// ----------

// step()の予約
scheduleStep(delay){
  console.log("%c[Timer: scheduleStep] 開始", "color: #f07b0e;");

  if(this.timerId){
    console.log("%c[Timer: scheduleStep] 既存タイマーの破棄", "color: #f07b0e");
    clearTimeout(this.timerId);
    this.timerId = null;
  }

  this.timerId = setTimeout(() => {
    console.log(`%c[Timer: scheduleStep] 次のstate（${this.state}）を開始: ${delay}ms遅延`, "color: #f07b0e;");
    this.timerId = null;
    this.step();
  }, delay);
}

// タイマーのキャンセル
clearTimer(){
  console.log("%c[Timer: clearTimer] 開始", "color: #f07b0e;");
  if(this.timerId){
    console.log("%c[Timer: clearTimer] タイマーのキャンセル", "color: #f07b0e;");
    this.clearTimeout(this.timerId);
    this.timerId = null;
  }
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

  this.state = "EndRound";
}


// 局進行
nextRound(renchan, winnerIndex = null, isDraw = false) {
  const parent = this.dealer;
  const parentTenpai = isTenpaiNow(this, parent);

  // デバッグ用
  console.log(`%c[nextRound] 次の局を開始\n
    isDraw: ${isDraw}\n
    parentIndex: ${parent}\n
    parentTenpai: ${parentTenpai}\n
    winnerIndex: ${winnerIndex}`, "color: #9453df;");


  // 飛び終了チェック: 持ち点が0未満のプレイヤーがいるなら強制終了
  if(this.players.some(p => p.score < 0)){
    console.log("%c[nextRound] 飛び終了", "color: #9453df;");
    this.endGame();
    return;
  }

      
  // 南入後では40000点を超えるプレイヤーが現れた時点で終了
  if (this.round >= 2){
    if (this.hasPlayerOver40000()){
      console.log("%c[nextRound] 南入後: 40000点持ちのプレイヤーが現れた", "color: #9453df;")
      this.endGame();
      return;
    }
  }

  // --- 本場処理 ---
  if (isDraw) {
    // 流局
    console.log("%c[nextRound] 流局: 積み棒を増やす");
    this.honba += 1;  // 親テンパイでもノーテンでも +1
  } else {
    // 和了
    if (winnerIndex === parent) {
      console.log("%c[nextyRound] 親の和了（連荘）: 積み棒を増やす", "color: #9453df;");
      // 親和了 → 連荘
      this.honba += 1;
    } else {
      console.log("%c[nextRound] 子の和了: 積み棒をリセットする", "color: #9453df;");
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
    if(isEast3){
      // 40000点を超えていたなら終了
      if(this.players[parent].score >= 40000){
        console.log("%c[nextRound] 東3局での連荘: 親の40000点越え（終了）", "color: #9453df;");
        this.endGame()
        return;
      } else {
        console.log("%c[nextRound] 東3局での連荘: 40000点に満たない（続行）", "color: #9453df;");
      }
    }

    console.log("%c[nextRound] 通常の連荘", "color: #9453df;");
    this.startNewHand();  // 局は進めない、親も風もそのまま
    return;
  }

  // ------------------------------
  //  連荘しなかった場合
  // ------------------------------
  console.log("%c[nextRound] 連荘しなかった", "color: #9453df;");

  // 東3局終了時
  if(isEast3){

    // 40000点以上のプレイヤーが存在するなら終了
    if(this.hasPlayerOver40000()){
      console.log("%c[nextRound] 東3局終了: 40000点以上のプレイヤーが存在（終了）", "color: #9453df;");
      this.endGame();
      return;
    } else {
      // 南入
      console.log("%c[nextRound] 東3局終了: 南入", "color: #9453df;")
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
    console.log("%c[nextRound] 南3局終了: ゲーム終了", "color: #9453df;");
    this.endGame();
    return;
  }

  console.log(`%c[nextRound] ${this.round === 1 ? "東" : "南"}${this.kyoku}局開始`, "color: #9453df;");
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
  this.state = "Deal";
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
  const isCallTurn = (this.state === "WaitCall");

  // 自分のツモ番（CheckTsumo → Discard）
  const isMyTurn =
    (this.turn === 0) &&
    (this.state === "CheckTsumo" || this.state === "Discard");

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
    if (canAnkan(this)) {
      list.push({ name: "カン", handler: () => onAnkan(this) });
    }

    // 北抜き
    if (canNorth(this)) {
      list.push({ name: "北抜き", handler: () => onNorth(this, 0) });
    }

  } else if (isCallTurn) {
    // 他家の捨て牌 → ポン / 大明槓 のみ
    if (canPon(this)) {
      list.push({ name: "ポン", handler: () => onPon(this, 0) });
    }
    if (canDaiminkan(this)) {
      list.push({ name: "カン", handler: () => onKan(this) });
    }
  }

  // -------------------------
  // ③ レイアウト
  // -------------------------
  if (list.length === 0) return;

  const slots = new Array(6).fill(null);
  
  const skip = { 
    name: "スキップ",
    handler: () => {
      container.innerHTML = "";
      this.pendingDiscard = null;
      this.state = "Delay";
      this.scheduleStep(100);
                 }
  }
  
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
