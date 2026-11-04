// action.js

import { judgeYaku } from "./yaku.js";
import { sameTile, getRiichiCandidates } from "./rules.js";


// ----------
// 副露ボタンを押した際の処理（onXX）
// ----------

// ------------------------------
// 立直
// ------------------------------
export function onRiichi(game, playerIndex = 0) {
  const p = game.players[playerIndex];

  judge = !canRiichi(game, playerIndex) || p.isRiichi || !p.isMenzen || p.score;

  if(true){
    if(!canRiichi(game, playerIndex)) console.log("[Reject] 立直できない状態");
    if(p.isRiichi) console.log("[Reject] すでに立直している");
    if(!p.isMenzen) console.log("[Reject] 門前でない");
    if(p.score < 1000) console.log("[Reject] 持ち点が1000点未満");

    if(judge) return;
  }
  // 立直待ちのフラグ
  p.isWaitingRiichi = true;

  game.updateUI();
}

// 立直キャンセルボタン
export function onCancelRiichi(game, playerIndex = 0){
  const p = game.players[playerIndex];
  
  judge = !p || !p.isWaitingRiichi;

  if(true){
    if(!p) console.log("[Reject] プレイヤーが存在しない");
    if(!p.isWaitingRiichi) console.log("[Reject] 立直待ち状態ではない");

    if(judge) return;
  }

  // 立直待ちを解除する（宣言牌選択から戻る）
  p.isWaitingRiichi = false;

  game.updateUI();
}


export function onTsumo(game){
  game.onCheckTsumo();
}

// 保留
export function onRon(game){
  return false;
}


// -------------------------
// ポン
// -------------------------
export function onPon(game, playerIndex, tile) {
  const p = game.players[playerIndex];


  // どの相手から鳴いたか
  const fromPos = game.players[game.lastDiscarder].position;
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
  game.canDoubleRiichi = false;
  game.clearIppatsu();

  game.turn = playerIndex;
  game.state = "Discard";
  game.updateUI();
}

// ----------
// カン
// ----------
// 保留
export function onKan(game){
  return false;
}

// -------------------------
// 暗槓
// -------------------------
export function onAnkan(game, playerIndex, tile) {
  const p = game.players[playerIndex];

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
  addKanDora(game);

  game.canDoubleRiichi = false;
  game.clearIppatsu();

  game.state = "Draw";
  game.updateUI();
}

// -------------------------
// 大明槓
// -------------------------
export function onDaiminkan(game, playerIndex, tile) {
  const p = game.players[playerIndex];

  // 誰から鳴いたか
  const fromPos = game.players[game.lastDiscarder].position;
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

  addKanDora(game);

  game.canDoubleRiichi = false;
  game.clearIppatsu();

  game.turn = playerIndex;
  game.state = "Draw";
  game.updateUI();
}

  // -------------------------
  // 加槓
  // -------------------------
export function onKakan(game, playerIndex, tile) {
    const p = game.players[playerIndex];

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

    addKanDora(game);

    game.canDoubleRiichi = false;
    game.clearIppatsu();

    game.state = "Draw";
    game.updateUI();
  }

  // -------------------------
  // 北抜き
  // -------------------------
export function onNorth(game, playerIndex = 0) {
    const p = game.players[playerIndex];

    const idx = p.hand.findIndex(t => t.suit === "wind" && t.value === 4);
    if (idx < 0){
      console.log("[Reject] 北が手牌にない");
      return;
    }
    p.hand.splice(idx, 1);

    p.northCount++;

    // 嶺上牌から1枚ツモる
  if (game.rinshan.length > 0) {
    const rinshanTile = game.rinshan.pop();
    p.draw(rinshanTile);
  }


    game.canDoubleRiichi = false;
    game.clearIppatsu();

    game.state = "CheckTsumo";
    const result = game.onCheckTsumo();
    if(result){
      game.tsumoPayment(result);
    } else {
      console.log("[CheckTsumo] 嶺上牌で和了しなかった");
      game.state = "Discard";
      game.updateUI();

      if(p.isCPU || p.isRiichi){
        if(p.isCPU) console.log("[CheckTsumo] CPUの打牌");
        if(p.isRiichi) console.log("[CheckTsumo] 立直者の打牌");

        setTimeout(() => game.step(), 300);
      }
    }

  }

  // -------------------------
  // カンドラ追加（仮実装）
  // -------------------------
export function addKanDora(game) {
  if (game.openDoraCount < game.doraIndicators.length) {
    game.openDoraCount++;  // 左から順に公開枚数を増やすだけ
  }
}






// ----------
// 副露できるかを判定（canXX）
// ----------

// 立直
export function canRiichi(game, playerIndex = 0) {
  const p = game.players[playerIndex];
  if (!p) return false;

  // 基本条件のチェック
  if (game.turn !== playerIndex){
    console.log("自分の手番でない");
    return false;
  }

  if (!p.isMenzen || p.isRiichi || p.score < 1000){
    console.log("門前でない or すでに立直している or 1000点未満");
    return false;
  }
  if ((game.wall.length - game.wallIndex) < 4){
    console.log("次のツモ番がない");
    return false;
  }
  // 手牌が3の倍数 + 2（雀頭）でない場合はリーチ不可
  if (p.hand.length % 3 !== 2){
    console.log("手牌が揃っていない: 現在の手牌は", p.hand.length);
    return false;
  }

  const candidates = getRiichiCandidates(game, playerIndex);
  return candidates.length > 0;

}

// ツモ
export function canTsumo(game, playerIndex = 0) {
  const p = game.players[playerIndex];

  const doraIndicators = game.doraIndicators;
  const uraIndicators = game.uraIndicators;
  const openDoraCount = game.openDoraCount;

  if (!p) return false;

  const lastTile = p.hand[p.hand.length - 1];  // 手牌の末尾（ツモ牌）
  if (!lastTile) return false;

  if (!p.waitingTiles || !p.waitingTiles.some(t => t.suit === lastTile.suit && t.value === lastTile.value)){
    return false;
  }

  console.log("==ツモ時の手牌==");
  console.log("手牌:", JSON.stringify(p.hand));
  console.log("ツモ牌:", JSON.stringify(lastTile));
  console.log("待ち牌:", JSON.stringify(p.waitingTiles));

  if (!p.waitingTiles){
    console.log("聴牌してない");
    return false;
  }

  const isMatch = p.waitingTiles.some(t => t.suit === lastTile.suit && t.value === lastTile.value);
  console.log("ツモ牌が待ち牌にあるか", isMatch);

  const openDora = doraIndicators.slice(0, openDoraCount);
  const uraDora = p.isRiichi ? uraIndicators.slice(0, openDoraCount) : [];

  const result = judgeYaku(
    p,
    p.hand,
    lastTile,
    true,   // isTsumo
    game.playerWind,
    1,
    openDora,
    uraDora,
    game.wallIndex >= game.wall.length
  );

  console.log("役判定結果", result);
  return result.han > 0;
}


// ロン
export function canRon(game) {
  if (game.state === "CheckRon") {
    const p = game.players[0];
    if (!p.isFuriten) {
      return true;
    }
  }
  return false;
}


// ポン
export function canPon(game) {
  return game.state === "WaitCall" && game.ponCandidates?.length > 0;
}

/* canKan() {
  return game.state === "WaitCall" && kanCandidates?.length > 0;
} */

// カン
export function canKan(game) {

  if(!game || !game.players || !game.players[0]) return false;
  const p = game.players[0];

  // -------------------------
  // ① 他家の捨て牌 → 大明槓
  // -------------------------
  if (game.state === "WaitCall") {
    return game.kanCandidates?.length > 0; // 大明槓候補がある
  }

  // -------------------------
  // ② 自分のツモ番でなければカン不可
  // -------------------------
  const isMyTurn =
    (game.turn === 0) &&
    (game.state === "CheckTsumo" || game.state === "Discard");

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

// 保留: カン系
export function canAnkan(game) {
  return false;
}

export function canDaiminkan(game){
  return false;
}

export function canKakan(game){
  return false;
}


// 北抜き
export function canNorth(game) {
  const p = game.players[0];
  return p.hand.some(t => t.suit === "wind" && t.value === 4);
}

