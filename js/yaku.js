// yaku.js

// ------------------------------
// 役判定のメイン関数
// ------------------------------
export function judgeYaku(handTiles, winTile, isTsumo, playerWind = 1, roundWind = 1) {
  const tiles = [...handTiles];

  const yakuList = [];
  let han = 0;

  // ------------------------------
  // 1. 和了形チェック（最小構成）
  // ------------------------------
  const isWinning = checkWinningShape(tiles);
  if (!isWinning) {
    return { han: 0, yakuList: [] };
  }

  // ------------------------------
  // 2. 役判定（最小構成）
  // ------------------------------

  // ツモ
  if (isTsumo) {
    yakuList.push("門前清自摸和");
    han += 1;
  }

  // タンヤオ
  if (isTanyao(tiles)) {
    yakuList.push("断么九");
    han += 1;
  }

  // 役牌（風牌・三元牌）
  const yakuhaiHan = checkYakuhai(tiles, playerWind, roundWind);
  if (yakuhaiHan > 0) {
    yakuList.push("役牌");
    han += yakuhaiHan;
  }

  return { han, yakuList };
}

// ------------------------------
// 和了形チェック（最小）
// 今は「七対子」「国士無双」は未実装
// 面子分解の枠組みだけ作る
// ------------------------------
function checkWinningShape(tiles) {
  tiles.sort((a, b) => a.id - b.id);

  // 雀頭候補を全探索
  for (let i = 0; i < tiles.length - 1; i++) {
    if (sameTile(tiles[i], tiles[i + 1])) {
      const remaining = tiles.slice();
      remaining.splice(i, 2);

      if (checkMelds(remaining)) {
        return true;
      }
    }
  }
  return false;
}

// ------------------------------
// 面子分解（順子・刻子）
// ------------------------------
function checkMelds(tiles) {
  if (tiles.length === 0) return true;

  const first = tiles[0];

  // 刻子チェック
  const same = tiles.filter(t => sameTile(t, first));
  if (same.length >= 3) {
    const rest = removeTiles(tiles, first, 3);
    if (checkMelds(rest)) return true;
  }

  // 順子チェック（数牌のみ）
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
// タンヤオ判定
// ------------------------------
function isTanyao(tiles) {
  return tiles.every(t => {
    if (t.suit === "wind" || t.suit === "dragon") return false;
    return t.value >= 2 && t.value <= 8;
  });
}

// ------------------------------
// 役牌判定（風牌・三元牌）
// ------------------------------
function checkYakuhai(tiles, playerWind, roundWind) {
  let han = 0;

  const counts = {};
  tiles.forEach(t => {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  // 三元牌（白=1, 發=2, 中=3）
  for (let v = 1; v <= 3; v++) {
    if (counts[`dragon-${v}`] >= 3) han++;
  }

  // 自風
  if (counts[`wind-${playerWind}`] >= 3) han++;

  // 場風
  if (counts[`wind-${roundWind}`] >= 3) han++;

  return han;
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
