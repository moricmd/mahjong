// CPU.js
export function chooseDiscardIndex(hand) {
  // 1. 役牌（白・發・中）は残す
  const dragonTiles = hand.filter(t => t.suit === "dragon");
  if (dragonTiles.length === 1) {
    const tile = dragonTiles[0];
    if (!isUsefulTile(hand, tile)) {
      return hand.indexOf(tile);
    }
  }

  // 2. 孤立牌を優先して捨てる
  const isolated = hand.filter(t => !isUsefulTile(hand, t));
  if (isolated.length > 0) {
    return hand.indexOf(isolated[0]);
  }

  // 3. それでもなければ一番左を捨てる
  return 0;
}


// ------------------------------
// 孤立牌判定
// ------------------------------
export function isUsefulTile(hand, tile) {
  // 風牌・三元牌
  if (tile.suit === "wind" || tile.suit === "dragon") {
    const count = hand.filter(t => t.suit === tile.suit && t.value === tile.value).length;
    return count >= 2; // 対子なら useful
  }

  // 数牌
  const v = tile.value;

  const hasLeft  = hand.some(t => t.suit === tile.suit && t.value === v - 1);
  const hasRight = hand.some(t => t.suit === tile.suit && t.value === v + 1);
  const hasPair  = hand.some(t => t.suit === tile.suit && t.value === v && t !== tile);

  return hasLeft || hasRight || hasPair;
}
