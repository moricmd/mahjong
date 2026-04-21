// yaku.js

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

  // 和了形チェック
  if (!checkWinningShape(tiles)) {
    return { han: 0, yakuList: [] };
  }

  // 立直
  if (player.isRiichi) {
    yakuList.push("立直");
    han += 1;
  }


    // ------------------------------
  // 一発）
  // ------------------------------
  if (player.isRiichi && player.isIppatsu) {
    yakuList.push("一発");
    han += 1;
  }


  // ツモ（門前のみ）
  if (isTsumo && player.isMenzen) {
    yakuList.push("門前清自摸和");
    han += 1;
  }

  // タンヤオ
  if (isTanyao(tiles)) {
    yakuList.push("断么九");
    han += 1;
  }

  // 役牌
  const yakuhaiHan = checkYakuhai(tiles, playerWind, roundWind);
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
  const pinfuHan = checkPinfu(tiles, playerWind, roundWind, winTile);
  if (player.isMenzen && pinfuHan > 0) {
    yakuList.push("平和");
    han += pinfuHan;
  }

  // ドラ
  const doraCount = countDora(tiles, doraIndicators);
  if (doraCount > 0) {
    yakuList.push(`ドラ${doraCount}`);
    han += doraCount;
  }

  // 裏ドラ
  if (player.isRiichi) {
    const uraCount = countDora(tiles, uraIndicators);
    if (uraCount > 0) {
      yakuList.push(`裏ドラ${uraCount}`);
      han += uraCount;
    }
  }


  // ------------------------------
  // 海底摸月（ハイテイ）
  // ------------------------------
  if (isTsumo && isLastTile) {
    yakuList.push("海底摸月");
    han += 1;
  }

  // ------------------------------
  // 河底撈魚（ホウテイ）
  // ------------------------------
  if (isRon && isLastTile) {
    yakuList.push("河底撈魚");
    han += 1;
  }



  // 三色同刻
  const sanshokuHan = checkSanshokuDoukou(tiles);
  if (sanshokuHan > 0) {
    yakuList.push("三色同刻");
    han += sanshokuHan;
  }

  // 一気通貫
  const ittsuuHan = checkIttsuu(tiles);
  if (ittsuuHan > 0) {
    if (player.isMenzen) {
      yakuList.push("一気通貫");
      han += 2;
    } else {
      yakuList.push("一気通貫（食い下がり）");
      han += 1;
    }
  }


  // ------------------------------
  // ダブル立直
  // ------------------------------
  if (player.isDoubleRiichi) {
    yakuList.push("ダブル立直");
    han += 2;
  }

  
　// ------------------------------
  // 三暗刻
  // ------------------------------
  if (checkSanankou(player, winTile, isRon)) {
    yakuList.push("三暗刻");
    han += 2;
  }

  
  // ------------------------------
  // 三槓子
  // ------------------------------
  if (checkSankantsu(player)) {
    yakuList.push("三槓子");
    han += 2;
  }

  

  // ------------------------------
  // 七対子（チートイツ）
  // ------------------------------
  const chiitoiHan = checkChiitoitsu(tiles);
  if (player.isMenzen && chiitoiHan > 0) {
    yakuList.push("七対子");
    han += chiitoiHan;
    return { han, yakuList }; // 七対子は特殊和了形なのでここで終了
  }




  // ------------------------------
  // 混老頭（ホンロウトウ）
  // ------------------------------
  if (checkHonroutou(tiles)) {
    yakuList.push("混老頭");
    han += 2;
  }

  // ------------------------------
  // 小三元
  // ------------------------------
  if (checkShousangen(tiles)) {
    yakuList.push("小三元");
    han += 2;
  }


  // ------------------------------
  // 対々和（トイトイ）
  // ------------------------------
  if (checkToitoi(tiles)) {
    yakuList.push("対々和");
    han += 2;
  }

  // ------------------------------
  // 混一色（ホンイツ）
  // ------------------------------
  if (checkHonitsu(tiles)) {
    if (player.isMenzen) {
      yakuList.push("混一色");
      han += 3;
    } else {
      yakuList.push("混一色（食い下がり）");
      han += 2;
    }
  }

  // ------------------------------
  // 清一色（チンイツ）
  // ------------------------------
  if (checkChinitsu(tiles)) {
    if (player.isMenzen) {
      yakuList.push("清一色");
      han += 6;
    } else {
      yakuList.push("清一色（食い下がり）");
      han += 5;
    }
  }

  // ------------------------------
  // 混全帯么九（チャンタ）
  // ------------------------------
  if (checkChanta(tiles)) {
    if (player.isMenzen) {
      yakuList.push("混全帯么九");
      han += 2;
    } else {
      yakuList.push("混全帯么九（食い下がり）");
      han += 1;
    }
  }

  // ------------------------------
  // 純全帯么九（純チャン）
  // ------------------------------
  if (checkJunchan(tiles)) {
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
// 役の定義
// ======================================================================

// ------------------------------
// 和了形チェック
// ------------------------------
function checkWinningShape(tiles) {
  tiles.sort((a, b) => a.id - b.id);

  for (let i = 0; i < tiles.length - 1; i++) {
    if (sameTile(tiles[i], tiles[i + 1])) {
      const remaining = tiles.slice();
      remaining.splice(i, 2);
      if (checkMelds(remaining)) return true;
    }
  }
  return false;
}

// ------------------------------
// 面子分解
// ------------------------------
function checkMelds(tiles) {
  if (tiles.length === 0) return true;

  const first = tiles[0];

  // 刻子
  const same = tiles.filter(t => sameTile(t, first));
  if (same.length >= 3) {
    const rest = removeTiles(tiles, first, 3);
    if (checkMelds(rest)) return true;
  }

  // 順子
  if (first.suit === "man" || first.suit === "pin" || first.suit === "sou") {
    const t2 = findTile(tiles, first.suit, first.value + 1);
    const t3 = findTile(tiles, first.suit, first.value + 2);
    if (t2 && t3) {
      const rest = removeSpecificTiles(tiles, [first, t2, t3]);
      if (checkMelds(rest)) return true;
    }
  }

  return false;
}

// ------------------------------
// タンヤオ
// ------------------------------
function isTanyao(tiles) {
  return tiles.every(t => {
    if (t.suit === "wind" || t.suit === "dragon") return false;
    return t.value >= 2 && t.value <= 8;
  });
}

// ------------------------------
// 役牌
// ------------------------------
function checkYakuhai(tiles, playerWind, roundWind) {
  let han = 0;

  const counts = {};
  tiles.forEach(t => {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  // 三元牌
  if (counts["dragon-1"] >= 3) han++;
  if (counts["dragon-2"] >= 3) han++;
  if (counts["dragon-3"] >= 3) han++;

  // 自風
  if (counts[`wind-${playerWind}`] >= 3) han++;

  // 場風
  if (counts[`wind-${roundWind}`] >= 3) han++;

  return han;
}

// ------------------------------
// 一盃口・二盃口
// ------------------------------
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
        const key = `${suit}-${arr[i]}`;
        shuntsu[key] = (shuntsu[key] || 0) + 1;
      }
    }

    for (const key in shuntsu) {
      if (shuntsu[key] >= 2) count++;
    }
  }

  if (count >= 2) return 3; // 二盃口
  if (count === 1) return 1; // 一盃口
  return 0;
}

// ------------------------------
// 平和
// ------------------------------
function checkPinfu(tiles, playerWind, roundWind, winTile) {
  // 1. 雀頭が役牌ならピンフ不可
  const counts = {};
  tiles.forEach(t => {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  let pairTile = null;

  for (const key in counts) {
    if (counts[key] === 2) {
      const [suit, value] = key.split("-");
      const v = Number(value);

      // 三元牌
      if (suit === "dragon") return 0;

      // 自風・場風
      if (suit === "wind" && (v === playerWind || v === roundWind)) return 0;

      pairTile = { suit, value: v };
    }
  }

  // 2. 刻子が1つでもあればピンフ不可
  for (const key in counts) {
    if (counts[key] >= 3) return 0;
  }

  // 3. 順子4つかどうか（面子分解で確認）
  if (!isAllShuntsu(tiles)) return 0;

  // 4. 待ちが両面かどうか
  if (!isRyanmenWait(tiles, winTile)) return 0;

  return 1;
}

// 補助関数: 順子が4つあるか判定
function isAllShuntsu(tiles) {
  const arr = tiles.slice().sort((a, b) => a.id - b.id);

  function dfs(list) {
    if (list.length === 0) return true;

    const first = list[0];

    // 順子
    if (first.suit === "man" || first.suit === "pin" || first.suit === "sou") {
      const t2 = list.find(t => t.suit === first.suit && t.value === first.value + 1);
      const t3 = list.find(t => t.suit === first.suit && t.value === first.value + 2);

      if (t2 && t3) {
        const rest = removeSpecificTiles(list, [first, t2, t3]);
        if (dfs(rest)) return true;
      }
    }

    return false;
  }

  return dfs(arr);
}


//補助関数: 両面待ちか判定
function isRyanmenWait(tiles, winTile) {
  // winTile が順子の真ん中なら両面ではない
  // winTile が順子の端（例: 3-4 の 2 or 5）なら両面

  const suit = winTile.suit;
  const v = winTile.value;

  // 数牌以外は両面待ちにならない
  if (suit !== "man" && suit !== "pin" && suit !== "sou") return false;

  const hasLeft  = tiles.some(t => t.suit === suit && t.value === v - 1);
  const hasRight = tiles.some(t => t.suit === suit && t.value === v + 1);

  // 両面待ちの条件：左右どちらかが順子の端になる
  return (hasLeft && tiles.some(t => t.suit === suit && t.value === v - 2)) ||
         (hasRight && tiles.some(t => t.suit === suit && t.value === v + 2));
}




// ------------------------------
// ドラ
// ------------------------------
function countDora(tiles, indicators) {
  let count = 0;

  for (const ind of indicators) {
    const next = nextTile(ind);
    for (const t of tiles) {
      if (t.suit === next.suit && t.value === next.value) count++;
    }
  }

  return count;
}

// ------------------------------
// 三色同刻
// ------------------------------
function checkSanshokuDoukou(tiles) {
  const counts = {};
  tiles.forEach(t => {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  for (let n = 1; n <= 9; n++) {
    if (
      counts[`man-${n}`] >= 3 &&
      counts[`pin-${n}`] >= 3 &&
      counts[`sou-${n}`] >= 3
    ) {
      return 2;
    }
  }

  return 0;
}

// ------------------------------
// 一気通貫
// ------------------------------
function checkIttsuu(tiles) {
  const suits = ["man", "pin", "sou"];

  for (const s of suits) {
    const has123 = tiles.some(t => t.suit === s && t.value === 1) &&
                   tiles.some(t => t.suit === s && t.value === 2) &&
                   tiles.some(t => t.suit === s && t.value === 3);

    const has456 = tiles.some(t => t.suit === s && t.value === 4) &&
                   tiles.some(t => t.suit === s && t.value === 5) &&
                   tiles.some(t => t.suit === s && t.value === 6);

    const has789 = tiles.some(t => t.suit === s && t.value === 7) &&
                   tiles.some(t => t.suit === s && t.value === 8) &&
                   tiles.some(t => t.suit === s && t.value === 9);

    if (has123 && has456 && has789) return 2;
  }

  return 0;
}



// ------------------------------
// 三暗刻
// ------------------------------
function checkSanankou(player, winTile, isRon) {
  let anko = 0;

  // player.melds に「ポン」「チー」「カン」が入っている前提
  // 暗刻 = ポンしていない刻子
  for (const meld of player.melds) {
    if (meld.type === "pon") continue; // 鳴いてるので暗刻ではない
    if (meld.type === "kan") continue; // カンは別扱い
  }

  // 手牌から刻子を数える
  const counts = {};
  for (const t of player.hand) {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  for (const key in counts) {
    if (counts[key] >= 3) {
      // ロン和了の場合、和了牌を含む刻子は暗刻にしない
      if (isRon) {
        const [suit, value] = key.split("-");
        if (winTile.suit === suit && winTile.value == value) continue;
      }
      anko++;
    }
  }

  return anko >= 3;
}


// ------------------------------
// 三槓子
// ------------------------------
function checkSankantsu(player) {
  return player.kanCount >= 3;
}


// ------------------------------
// 七対子
// ------------------------------
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
    else if (c === 1 || c === 3 || c === 4) return 0; // 1枚・3枚以上は不成立
  }

  return pairCount === 7 ? 2 : 0; // 七対子は常に2翻
}


// ------------------------------
// 混老頭
// ------------------------------
function checkHonroutou(tiles) {
  for (const t of tiles) {
    if (t.suit === "man" || t.suit === "pin" || t.suit === "sou") {
      if (t.value !== 1 && t.value !== 9) return false;
    }
  }
  return true;
}


// ------------------------------
// 小三元
// ------------------------------
function checkShousangen(tiles) {
  const counts = {
    1: 0, // 白
    2: 0, // 發
    3: 0  // 中
  };

  for (const t of tiles) {
    if (t.suit === "dragon") {
      counts[t.value]++;
    }
  }

  let koutsu = 0;
  let pair = 0;

  for (let v = 1; v <= 3; v++) {
    if (counts[v] >= 3) koutsu++;
    else if (counts[v] === 2) pair++;
  }

  return koutsu === 2 && pair === 1;
}


// ------------------------------
// 対々和
// ------------------------------
function checkToitoi(tiles) {
  const counts = {};
  tiles.forEach(t => {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  // 刻子が4つ必要
  let koutsu = 0;
  for (const key in counts) {
    if (counts[key] >= 3) koutsu++;
  }

  return koutsu === 4;
}


// ------------------------------
// 混一色
// ------------------------------
function checkHonitsu(tiles) {
  const suits = new Set(tiles.map(t => t.suit));

  // 字牌が含まれ、かつ数牌が1種類のみ
  const hasHonor = suits.has("wind") || suits.has("dragon");

  const numberSuits = [...suits].filter(s => s === "man" || s === "pin" || s === "sou");

  return hasHonor && numberSuits.length === 1;
}


// ------------------------------
// 清一色
// ------------------------------
function checkChinitsu(tiles) {
  const suits = new Set(tiles.map(t => t.suit));

  // 数牌1種類のみ、字牌なし
  if (suits.has("wind") || suits.has("dragon")) return false;

  const numberSuits = [...suits].filter(s => s === "man" || s === "pin" || s === "sou");

  return numberSuits.length === 1;
}


// ------------------------------
// チャンタ
// ------------------------------
function checkChanta(tiles) {
  let has19orHonor = true;

  for (const t of tiles) {
    if (t.suit === "wind" || t.suit === "dragon") continue;
    if (t.value !== 1 && t.value !== 9) {
      has19orHonor = false;
      break;
    }
  }

  return has19orHonor;
}


// ------------------------------
// 純チャン
// ------------------------------
function checkJunchan(tiles) {
  let all19 = true;

  for (const t of tiles) {
    if (t.suit === "wind" || t.suit === "dragon") return false;
    if (t.value !== 1 && t.value !== 9) {
      all19 = false;
      break;
    }
  }

  return all19;
}




// ------------------------------
// 補助関数
// ------------------------------
function sameTile(a, b) {
  return a.suit === b.suit && a.value === b.value;
}

function findTile(tiles, suit, value) {
  return tiles.find(t => t.suit === suit && t.value === value);
}

function removeTiles(tiles, tile, count) {
  const result = tiles.slice();
  let removed = 0;

  for (let i = 0; i < result.length && removed < count; i++) {
    if (sameTile(result[i], tile)) {
      result.splice(i, 1);
      i--;
      removed++;
    }
  }
  return result;
}

function removeSpecificTiles(tiles, list) {
  const result = tiles.slice();
  for (const t of list) {
    const idx = result.findIndex(x => sameTile(x, t));
    if (idx >= 0) result.splice(idx, 1);
  }
  return result;
}
