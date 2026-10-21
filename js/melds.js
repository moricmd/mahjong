// -------------------------------------------------------------------------
// 牌の並び順定義
// -------------------------------------------------------------------------
const suitOrder = { man: 0, pin: 1, sou: 2, wind: 3, dragon: 4 };
const windOrder = { east: 1, south: 2, west: 3, north: 4 };
const dragonOrder = { white: 1, green: 2, red: 3 };

/**
 * 手牌（配列）を受け取り、ルール通りに並び替えた新しい配列を返す
 */
export function sortTiles(tiles) {
  return [...tiles].sort((a, b) => {
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

// -------------------------------------------------------------------------
// 面子分解（バックトラッキング DFS）
// -------------------------------------------------------------------------

/**
 * 手牌を「雀頭」と「4つの面子」に分解する関数
 * @param {Array} tiles - 門前の手牌配列
 * @param {Array} declaredMelds - 既に副露しているリスト
 */
export function decomposeHand(tiles, declaredMelds = []) {
  const sorted = sortTiles(tiles);
  const pairCandidates = getUniquePairs(sorted);

  for (const pair of pairCandidates) {
    const rest = removeTiles(sorted, pair, 2);
    const melds = dfsDecompose(rest);
    if (melds) {
      return {
        jantou: pair,
        melds: [...melds.map(m => ({ ...m, isOpen: false })), ...declaredMelds]
      };
    }
  }

  return null; // 和了形ではない
}

function dfsDecompose(tiles) {
  if (tiles.length === 0) return [];

  const first = tiles[0];

  // 1. 刻子（3枚同じ）を試す
  const sameCount = tiles.filter(t => t.suit === first.suit && t.value === first.value).length;
  if (sameCount >= 3) {
    const rest = removeTiles(tiles, first, 3);
    const result = dfsDecompose(rest);
    if (result) {
      return [{ type: 'koutsu', suit: first.suit, value: first.value }, ...result];
    }
  }

  // 2. 順子（連続する3枚）を試す（数牌のみ）
  if (first.suit === 'man' || first.suit === 'pin' || first.suit === 'sou') {
    const t2 = tiles.find(t => t.suit === first.suit && t.value === first.value + 1);
    const t3 = tiles.find(t => t.suit === first.suit && t.value === first.value + 2);

    if (t2 && t3) {
      const rest = removeSpecificTiles(tiles, [first, t2, t3]);
      const result = dfsDecompose(rest);
      if (result) {
        return [{ type: 'shuntsu', suit: first.suit, values: [first.value, t2.value, t3.value] }, ...result];
      }
    }
  }

  return null;
}

// -------------------------------------------------------------------------
// 補助ユーティリティ関数
// -------------------------------------------------------------------------

function getUniquePairs(tiles) {
  const pairs = [];
  const checked = new Set();

  for (let i = 0; i < tiles.length - 1; i++) {
    const t1 = tiles[i];
    const t2 = tiles[i + 1];
    
    // 同じ種類の牌が2枚以上連続しているか
    if (t1.suit === t2.suit && t1.value === t2.value) {
      const key = `${t1.suit}_${t1.value}`;
      if (!checked.has(key)) {
        checked.add(key);
        pairs.push(t1);
      }
    }
  }
  return pairs;
}

function removeTiles(tiles, target, count) {
  const rest = [...tiles];
  let removed = 0;
  
  for (let i = rest.length - 1; i >= 0; i--) {
    if (rest[i].suit === target.suit && rest[i].value === target.value) {
      rest.splice(i, 1);
      removed++;
      if (removed === count) break;
    }
  }
  return rest;
}

function removeSpecificTiles(tiles, targets) {
  const rest = [...tiles];
  for (const target of targets) {
    const index = rest.findIndex(t => t.suit === target.suit && t.value === target.value);
    if (index !== -1) {
      rest.splice(index, 1);
    }
  }
  return rest;
}
