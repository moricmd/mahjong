// rules.js

import { decomposeHand } from "./melds.js";


 // ------------------------------
 // 聴牌判定
 // ------------------------------
export function checkTenpai(hand) {
  // テンパイ判定：手牌（13枚）に任意の1枚を足して、和了形になる組み合わせがあるかチェック
  const allTileTypes = [];

  // 数の牌 (man, pin, sou) の1〜9を生成
  for (const suit of ["man", "pin", "sou"]) {
      for (let v = 1; v <= 9; v++) {
        allTileTypes.push({ suit, value: v, red: false });
      }
  }
  // 字牌 (wind: 1~4, dragon: 1~3) を生成
  for (let v = 1; v <= 4; v++) {
      allTileTypes.push({ suit: "wind", value: v, red: false });
  }
  for (let v = 1; v <= 3; v++) {
      allTileTypes.push({ suit: "dragon", value: v, red: false });
  }

  // 待ち牌の配列
  const waitingTiles = []

  // 各牌を1枚ずつ足してみて、decomposeHandが成功するか試す
  for (const target of allTileTypes) {
    const tempHand = [...hand, target];
    const result = decomposeHand(tempHand);
    if (result !== null) {
    if(!waitingTiles.some(t => t.suit === target.suit && t.value === target.value)){
        waitingTiles.push(target);
      }
    }
  }

  // 聴牌判定の結果と待ち牌のリストを返す
  return {
    isTenpai: waitingTiles.length > 0,
    waitingTiles: waitingTiles
  };
}


export function isTenpai(game, playerIndex) {
  const p = game.players[playerIndex];
  if(!p) return false;

  const res = checkTenpai(p.hand);
  
  p.waitingTiles = res.waitingTiles;
  return res.isTenpai;
  }


// ----------
// 立直宣言牌の候補を取得
// ----------
export function getRiichiCandidates(game, playerIndex = 0){

  const p = game.players[playerIndex];
  const candidates = []

  if(!p || p.hand.length % 3 !== 2) return candidates;

  for(let i = 0; i < p.hand.length; i++){
    const tempHand = p.hand.filter((_, idx) => idx !== i);
    const res = checkTenpai(tempHand);

    if(res.isTenpai){
      candidates.push(i)
    }
  }

  return candidates;

}

// -------------------------
// フリテン
// -------------------------

// 捨て牌によるフリテン
export function checkDiscardFuriten(game, playerIndex = 0) {
  const p = game.players[playerIndex];
  if(!p) return false;

  const waits = p.waitingTiles;
  const discards = p.discards;

  // テンパイしていないならフリテンなし
  if (!p.isTenpai) {
    p.isFuriten = false;
    p.furitenType = "none";
    return;
  }

  // 捨て牌に待ち牌が含まれているか
  for (const w of waits) {
    if (discards.includes(w)) {
      p.isFuriten = true;
      p.furitenType = "discard";
      return;
    }
  }

  // フリテン解除
  p.isFuriten = false;
  p.furitenType = "none";
}



// 同巡フリテン 
export function checkSameTurnFuriten(game, playerIndex, tile) {
  const p = game.players[playerIndex];

  // 自分の最後の捨て牌と一致したら同巡フリテン
  const lastDiscard = p.discards[p.discards.length - 1];
  if (lastDiscard && lastDiscard === tile) {
    p.isFuriten = true;
    p.furitenType = "sameTurn";
    return true; // フリテン
  }
  return false;
}



// リーチ後見逃しフリテン
export function checkRiichiMissFuriten(game, playerIndex) {
  const p = game.players[playerIndex];

  if (p.isRiichi && p.missedRon) {
    p.isFuriten = true;
    p.furitenType = "riichi";
    return true;
  }
  return false;
}


// ----------
// 同じ種類の牌かを判定
// ----------
export function sameTile(t1, t2){
  if(!t1 || !t2) return false;
  return t1.suit === t2.suit && t1.value === t2.value;
}