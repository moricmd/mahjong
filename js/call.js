// ----------
// 副露ボタンを押した際の処理（onXX）
// ----------

// ------------------------------
// 立直
// ------------------------------
export function onRiichi(game, playerIndex = 0) {
  const p = game.players[playerIndex];

  // 聴牌確認
  if (!canRiichi(playerIndex)) return;

  // 未立直で門前、持ち点1000点以上であるか確認
  if (p.isRiichi || !p.isMenzen || p.score < 1000) return;

  // 立直待ちのフラグ
  p.isWaitingRiichi = true;

  game.updateUI();
}

// 立直キャンセルボタン
export function onCancelRiichi(game, playerIndex = 0){
  const p = game.players[playerIndex];
  if(!p || !p.isWaitingRiichi) return;

  // 立直待ちを解除する（宣言牌選択から戻る）
  p.isWaitingRiichi = false;

  game.updateUI();
}


export function onTsumo(){
  game.onCheckWin();
}



// -------------------------
// ポン
// -------------------------
export function onPon(game, tile) {
  const p = game.players[game.playerIndex];


  // どの相手から鳴いたか
  const fromPos = players[game.lastDiscarder].position;
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
  game.state = "DISCARD";
  game.updateUI();
}

// -------------------------
// 暗槓
// -------------------------
export function onAnkan(game, tile) {
  const p = game.players[game.playerIndex];

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
  game.addKanDora();

  game.canDoubleRiichi = false;
  game.clearIppatsu();

  game.state = "DRAW";
  game.updateUI();
}

// -------------------------
// 大明槓
// -------------------------
export function onDaiminkan(game, players, tile) {
  const p = players[game.playerIndex];

  // 誰から鳴いたか
  const fromPos = players[game.lastDiscarder].position;
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

  game.addKanDora();

  game.canDoubleRiichi = false;
  game.clearIppatsu();

  game.turn = playerIndex;
  game.state = "DRAW";
  game.updateUI();
}

  // -------------------------
  // 加槓
  // -------------------------
export function onKakan(game, tile) {
    const p = game.players[game.playerIndex];

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

    game.addKanDora();

    game.canDoubleRiichi = false;
    game.clearIppatsu();

    game.state = "DRAW";
    game.updateUI();
  }

  // -------------------------
  // 北抜き
  // -------------------------
export function onNorth(game, rinshan) {
    const p = game.players[game.playerIndex];

    const idx = p.hand.findIndex(t => t.suit === "wind" && t.value === 4);
    if (idx < 0) return;

    p.hand.splice(idx, 1);

    p.northCount++;

    // 嶺上牌から1枚ツモる
  if (rinshan.length > 0) {
    const rinshanTile = rinshan.pop();
    p.draw(rinshanTile);
  }


    game.canDoubleRiichi = false;
    game.clearIppatsu();

    game.state = "CHECK_WIN";
    game.onCheckWin(); 
    game.updateUI();
  }

  // -------------------------
  // カンドラ追加（仮実装）
  // -------------------------
export function addKanDora(game, openDoraCount) {
  if (openDoraCount < game.doraIndicators.length) {
    openDoraCount++;  // 左から順に公開枚数を増やすだけ
  }
}



  /* 副露後の牌描画*/
export function updateMelds(players) {
  const area = document.getElementById("player-melds");
  area.innerHTML = "";

  const p = players[0];

  p.melds.forEach(m => {
    m.tiles.forEach(tile => {
      const img = createTileElement(tile);
      area.appendChild(img);
    });
  });
}


/* 北抜き後の牌描画*/
export function updateNorthTiles(players) {
  const area = document.getElementById("player-north");
  area.innerHTML = "";

  const p = players[0];

  for (let i = 0; i < p.northCount; i++) {
    const img = createTileElement({ suit:"wind", value:4 });
    area.appendChild(img);
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
  if (game.turn !== playerIndex) return false;
  if (!p.isMenzen || p.isRiichi || p.score < 1000) return false;
  if ((game.wall.length - game.wallIndex) < 4) return false;

  // 手牌が3の倍数 + 2（雀頭）でない場合はリーチ不可
  if (p.hand.length % 3 !== 2) return false;

  const candidates = game.getRiichiCandidates(playerIndex);
  return candidates.length > 0;

}

// ツモ
export function canTsumo(game, doraIndicators, uraIndicators, openDoraCount) {
  const p = game.players[game.turn];
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
    false,  // isRon
    game.playerWind,
    1,
    openDora,
    uraDora,
    game.wallIndex >= game.wall.length
  );

  console.log("約判定結果", result);
  return result.han > 0;
}


// ロン
export function canRon(game) {
  if (game.state === "WAIT_RON") {
    const p = game.players[0];
    if (!p.isFuriten) {
      return true;
    }
  }
  return false;
}


// ポン
export function canPon(game) {
  return game.state === "WAIT_PON_KAN" && game.ponCandidates?.length > 0;
}

/* canKan() {
  return game.state === "WAIT_PON_KAN" && kanCandidates?.length > 0;
} */

// カン
export function canKan(game) {
  const p = game.players[0];

  // -------------------------
  // ① 他家の捨て牌 → 大明槓
  // -------------------------
  if (game.state === "WAIT_PON_KAN") {
    return game.kanCandidates?.length > 0; // 大明槓候補がある
  }

  // -------------------------
  // ② 自分のツモ番でなければカン不可
  // -------------------------
  const isMyTurn =
    (game.turn === 0) &&
    (game.state === "CHECK_WIN" || game.state === "DISCARD");

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

export function canAnkan(player) {
  return false;
}


// 北抜き
export function canNorth(game) {
  const p = game.players[0];
  return p.hand.some(t => t.suit === "wind" && t.value === 4);
}

