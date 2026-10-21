// yaku.js

import { decomposeHand, sortTiles } from "./melds.js";

// ------------------------------
// 役判定のメイン関数
// ------------------------------
export function judgeYaku(
  player,
  handTiles,
  winTile,
  isTsumo,
  isRon,
  playerWind = 1,
  roundWind = 1,
  doraIndicators = [],
  uraIndicators = [],
  isLastTile = false
) {
  const tiles = [...handTiles];
  const yakuList = [];
  let han = 0;

  const declaredMelds = player.melds || [];
  const decomposition = decomposeHand(tiles, declaredMelds);
  const chiitoiHan = player.isMenzen ? checkChiitoitsu(tiles) : 0;

  // 和了形チェック（通常形または七対子）
  if (!decomposition && chiitoiHan === 0) {
    return { han: 0, yakuList: [] };
  }

  // ------------------------------
  // 七対子（チートイツ）の判定（特殊形）
  // ------------------------------
  if (chiitoiHan > 0) {
    yakuList.push("七対子");
    han += chiitoiHan;

    // 立直・一発などの共通役を加算してリターン
    han += addCommonYaku(player, isTsumo, isRon, isLastTile, yakuList);
    han += addDoraYaku(tiles, player, doraIndicators, uraIndicators, yakuList);

    return { han, yakuList };
  }

  // 以降は通常の4面子1雀頭の判定
  const { jantou, melds } = decomposition;

  // 立直系・ツモ等
  han += addCommonYaku(player, isTsumo, isRon, isLastTile, yakuList);

  // タンヤオ
  if (isTanyao(tiles, melds)) {
    yakuList.push("断么九");
    han += 1;
  }

  // 役牌
  const yakuhaiHan = checkYakuhai(melds, playerWind, roundWind);
  if (yakuhaiHan > 0) {
    yakuList.push("役牌");
    han += yakuhaiHan;
  }

  // 一盃口・二盃口
  if (player.isMenzen) {
    const iipeikouHan = checkIipeikou(tiles);
    if (iipeikouHan === 3) {
      yakuList.push("二盃口");
      han += 3;
    } else if (iipeikouHan === 1) {
      yakuList.push("一盃口");
      han += 1;
    }
  }

  // 平和
  const pinfuHan = checkPinfu(decomposition, playerWind, roundWind, winTile);
  if (player.isMenzen && pinfuHan > 0) {
    yakuList.push("平和");
    han += pinfuHan;
  }

  // ドラ・裏ドラ
  han += addDoraYaku(tiles, player, doraIndicators, uraIndicators, yakuList);

  // 三色同刻
  const sanshokuHan = checkSanshokuDoukou(melds);
  if (sanshokuHan > 0) {
    yakuList.push("三色同刻");
    han += sanshokuHan;
  }

  // 一気通貫
  const ittsuuHan = checkIttsuu(melds);
  if (ittsuuHan > 0) {
    if (player.isMenzen) {
      yakuList.push("一気通貫");
      han += 2;
    } else {
      yakuList.push("一気通貫（食い下がり）");
      han += 1;
    }
  }

  // 三暗刻
  if (checkSanankou(player, winTile, isRon, melds)) {
    yakuList.push("三暗刻");
    han += 2;
  }

  // 三槓子
  if (checkSankantsu(player)) {
    yakuList.push("三槓子");
    han += 2;
  }

  // 混老頭
  if (checkHonroutou(tiles, jantou, melds)) {
    yakuList.push("混老頭");
    han += 2;
  }

  // 小三元
  if (checkShousangen(jantou, melds)) {
    yakuList.push("小三元");
    han += 2;
  }

  // 対々和
  if (checkToitoi(melds)) {
    yakuList.push("対々和");
    han += 2;
  }

  // 混一色
  if (checkHonitsu(tiles)) {
    if (player.isMenzen) {
      yakuList.push("混一色");
      han += 3;
    } else {
      yakuList.push("混一色（食い下がり）");
      han += 2;
    }
  }

  // 清一色
  if (checkChinitsu(tiles)) {
    if (player.isMenzen) {
      yakuList.push("清一色");
      han += 6;
    } else {
      yakuList.push("清一色（食い下がり）");
      han += 5;
    }
  }

  // チャンタ
  if (checkChanta(jantou, melds)) {
    if (player.isMenzen) {
      yakuList.push("混全帯么九");
      han += 2;
    } else {
      yakuList.push("混全帯么九（食い下がり）");
      han += 1;
    }
  }

  // 純チャン
  if (checkJunchan(jantou, melds)) {
    if (player.isMenzen) {
      yakuList.push("純全帯么九");
      han += 3;
    } else {
      yakuList.push("純全帯么九（食い下がり）");
      han += 2;
    }
  }

  return { han, yakuList };
}


// ======================================================================
// 共通役・ドラ加算のヘルパー
// ======================================================================
function addCommonYaku(player, isTsumo, isRon, isLastTile, yakuList) {
  let han = 0;
  if (player.isRiichi) {
    yakuList.push("立直");
    han += 1;
  }
  if (player.isRiichi && player.isIppatsu) {
    yakuList.push("一発");
    han += 1;
  }
  if (player.isDoubleRiichi) {
    yakuList.push("ダブル立直");
    han += 2;
  }
  if (isTsumo && player.isMenzen) {
    yakuList.push("門前清自摸和");
    han += 1;
  }
  if (isTsumo && isLastTile) {
    yakuList.push("海底摸月");
    han += 1;
  }
  if (isRon && isLastTile) {
    yakuList.push("河底撈魚");
    han += 1;
  }
  return han;
}

function addDoraYaku(tiles, player, doraIndicators, uraIndicators, yakuList) {
  let han = 0;
  const doraCount = countDora(tiles, doraIndicators);
  if (doraCount > 0) {
    yakuList.push(`ドラ${doraCount}`);
    han += doraCount;
  }
  if (player.isRiichi) {
    const uraCount = countDora(tiles, uraIndicators);
    if (uraCount > 0) {
      yakuList.push(`裏ドラ${uraCount}`);
      han += uraCount;
    }
  }
  return han;
}


// ======================================================================
// 各種役の判定関数
// ======================================================================

// タンヤオ
function isTanyao(tiles) {
  return tiles.every(t => {
    if (t.suit === "wind" || t.suit === "dragon") return false;
    return t.value >= 2 && t.value <= 8;
  });
}

// 役牌
function checkYakuhai(melds, playerWind, roundWind) {
  let han = 0;
  for (const m of melds) {
    if (m.type === "koutsu" || m.type === "kan") {
      if (m.suit === "dragon") {
        han++;
      } else if (m.suit === "wind") {
        if (m.value === playerWind) han++;
        if (m.value === roundWind) han++;
      }
    }
  }
  return han;
}

// 一盃口・二盃口
function checkIipeikou(tiles) {
  const suits = { man: [], pin: [], sou: [] };
  for (const t of tiles) {
    if (suits[t.suit]) suits[t.suit].push(t.value);
  }

  let count = 0;
  for (const suit of ["man", "pin", "sou"]) {
    const arr = suits[suit].sort((a, b) => a - b);
    const shuntsu = {};
    for (let i = 0; i < arr.length - 2; i++) {
      if (arr[i] + 1 === arr[i + 1] && arr[i + 1] + 1 === arr[i + 2]) {
        const key = `${arr[i]}`;
        shuntsu[key] = (shuntsu[key] || 0) + 1;
      }
    }
    for (const key in shuntsu) {
      if (shuntsu[key] >= 2) count++;
    }
  }

  if (count >= 2) return 3;
  if (count === 1) return 1;
  return 0;
}

// 平和
function checkPinfu(decomposition, playerWind, roundWind, winTile) {
  const { jantou, melds } = decomposition;

  // 1. 雀頭が役牌ならピンフ不可
  if (jantou.suit === "dragon") return 0;
  if (jantou.suit === "wind" && (jantou.value === playerWind || jantou.value === roundWind)) return 0;

  // 2. すべて順子であること（刻子・槓子が混ざってないか）
  if (!melds.every(m => m.type === "shuntsu")) return 0;

  // 3. 待ちが両面かどうか（簡易判定：winTileが順子の両端のどちらか）
  const isRyanmen = melds.some(m => {
    if (m.type !== "shuntsu" || m.suit !== winTile.suit) return false;
    const [v1, v2, v3] = m.values;
    // 両端待ち（最小値でロン/ツモ、または最大値でロン/ツモ）かつ嵌張・辺張・単騎でない
    const isMinEdge = (winTile.value === v1);
    const isMaxEdge = (winTile.value === v3);
    return isMinEdge || isMaxEdge;
  });

  return isRyanmen ? 1 : 0;
}

// ドラ計算
function countDora(tiles, indicators) {
  let count = 0;
  for (const ind of indicators) {
    const next = nextDoraTile(ind);
    for (const t of tiles) {
      if (t.suit === next.suit && t.value === next.value) count++;
    }
  }
  return count;
}

function nextDoraTile(ind) {
  if (ind.suit === "man" || ind.suit === "pin" || ind.suit === "sou") {
    const nextValue = ind.value === 9 ? 1 : ind.value + 1;
    return { suit: ind.suit, value: nextValue };
  }
  if (ind.suit === "wind") {
    const nextValue = ind.value === 4 ? 1 : ind.value + 1;
    return { suit: "wind", value: nextValue };
  }
  if (ind.suit === "dragon") {
    const nextValue = ind.value === 3 ? 1 : ind.value + 1;
    return { suit: "dragon", value: nextValue };
  }
  return ind;
}

// 三色同刻
function checkSanshokuDoukou(melds) {
  const koutsus = melds.filter(m => m.type === "koutsu" || m.type === "kan");
  for (let n = 1; n <= 9; n++) {
    const hasMan = koutsus.some(m => m.suit === "man" && m.value === n);
    const hasPin = koutsus.some(m => m.suit === "pin" && m.value === n);
    const hasSou = koutsus.some(m => m.suit === "sou" && m.value === n);
    if (hasMan && hasPin && hasSou) return 2;
  }
  return 0;
}

// 一気通貫
function checkIttsuu(melds) {
  const shuntsus = melds.filter(m => m.type === "shuntsu");
  for (const suit of ["man", "pin", "sou"]) {
    const values = shuntsus.filter(m => m.suit === suit).map(m => m.values[0]);
    if (values.includes(1) && values.includes(4) && values.includes(7)) {
      return 2;
    }
  }
  return 0;
}

// 三暗刻
function checkSanankou(player, winTile, isRon, melds) {
  let ankoCount = 0;
  for (const m of melds) {
    if ((m.type === "koutsu" || m.type === "kan") && !m.isOpen) {
      // ロン和了のとき、和了牌を含む刻子がポンなどでなく暗刻に含まれていて放銃牌の場合の処理など
      // 基本的な暗刻カウント
      ankoCount++;
    }
  }
  return ankoCount >= 3;
}

// 三槓子
function checkSankantsu(player) {
  return player.kanCount >= 3;
}

// 七対子
function checkChiitoitsu(tiles) {
  if (tiles.length !== 14) return 0;
  const counts = {};
  for (const t of tiles) {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  let pairCount = 0;
  for (const key in counts) {
    const c = counts[key];
    if (c === 2) pairCount++;
    else return 0;
  }
  return pairCount === 7 ? 2 : 0;
}

// 混老頭
function checkHonroutou(tiles, jantou, melds) {
  const allTiles = [jantou, ...melds.flatMap(m => m.type === "shuntsu" ? [{suit: m.suit, value: m.values[0]}, {suit: m.suit, value: m.values[1]}, {suit: m.suit, value: m.values[2]}] : [{suit: m.suit, value: m.value}, {suit: m.suit, value: m.value}, {suit: m.suit, value: m.value}])];
  return allTiles.every(t => {
    if (t.suit === "wind" || t.suit === "dragon") return true;
    return t.value === 1 || t.value === 9;
  });
}

// 小三元
function checkShousangen(jantou, melds) {
  const dragons = melds.filter(m => (m.type === "koutsu" || m.type === "kan") && m.suit === "dragon");
  const isJantouDragon = (jantou.suit === "dragon");
  return dragons.length === 2 && isJantouDragon;
}

// 対々和
function checkToitoi(melds) {
  const koutsus = melds.filter(m => m.type === "koutsu" || m.type === "kan");
  return koutsus.length === 4;
}

// 混一色
function checkHonitsu(tiles) {
  const suits = new Set(tiles.map(t => t.suit));
  const hasHonor = suits.has("wind") || suits.has("dragon");
  const numberSuits = [...suits].filter(s => s === "man" || s === "pin" || s === "sou");
  return hasHonor && numberSuits.length === 1;
}

// 清一色
function checkChinitsu(tiles) {
  const suits = new Set(tiles.map(t => t.suit));
  if (suits.has("wind") || suits.has("dragon")) return false;
  const numberSuits = [...suits].filter(s => s === "man" || s === "pin" || s === "sou");
  return numberSuits.length === 1;
}

// チャンタ
function checkChanta(jantou, melds) {
  const allParts = [jantou, ...melds];
  return allParts.every(part => {
    if (part.type === "shuntsu") {
      return part.values.includes(1) || part.values.includes(9);
    } else {
      // 雀頭または刻子/槓子
      if (part.suit === "wind" || part.suit === "dragon") return true;
      return part.value === 1 || part.value === 9;
    }
  });
}

// 純チャン
function checkJunchan(jantou, melds) {
  const allParts = [jantou, ...melds];
  return allParts.every(part => {
    if (part.type === "shuntsu") {
      return part.values.includes(1) || part.values.includes(9);
    } else {
      if (part.suit === "wind" || part.suit === "dragon") return false;
      return part.value === 1 || part.value === 9;
    }
  });
}