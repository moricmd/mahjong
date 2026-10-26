// js/score.js
import { SCORE_TABLE } from './scoreTable.js';

/**
 * 点数計算と点数移動を行う関数
 * @param {Game} game - game.js のインスタンス (this を渡す)
 * @param {Number} winnerIndex - 和了したプレイヤーのインデックス (0〜2)
 * @param {Number|null} loserIndex - 放銃したプレイヤーのインデックス (ロンの場合のみ。ツモの場合は null)
 * @param {Boolean} isRon - trueならロン、falseならツモ
 * @param {Number} han - 翻数
 * @param {Number} fu - 符数
 */

export function calcScore(game, winnerIndex, loserIndex, isRon, han, fu) {
  const isChild = (winnerIndex !== game.dealer);
  const role = isChild ? 'child' : 'parent';

  // 符数をテーブルのキーに丸めるヘルパー
  const normalizedFu = normalizeFu(fu);

  // 積み棒と供託
  const honbaBonus = game.honba * 300;
  const kyotakuBonus = game.kyotaku * 1000;

  let gainScore = 0;
  let baseScore = 0;

  if (isRon) {
    // ==========================================
    // ロン和了の場合
    // ==========================================

    if (han >= 5) {
      baseScore = SCORE_TABLE.ron[role][han];
    } else {
      baseScore = SCORE_TABLE.ron[role][han][normalizedFu] || SCORE_TABLE.ron[role][han][30];
    }

    const payScore = baseScore + honbaBonus;
    gainScore = payScore + kyotakuBonus;

    // 点数移動
    game.players[loserIndex].score -= payScore;
    game.players[winnerIndex].score += gainScore;

  } else {
    // ==========================================
    // ツモ和了の場合（3麻ルール）
    // ==========================================
    if (han >= 5) {
      baseScore = SCORE_TABLE.tsumo[role][han];
    } else {
      baseScore = SCORE_TABLE.tsumo[role][han][normalizedFu] || SCORE_TABLE.tsumo[role][han][30];
    }

    if (!isChild) {
      // ------------------------------------------
      // 親のツモ（残りの子2人から同額をもらう）
      // ------------------------------------------
      const payChild = baseScore.child + honbaBonus;

      for (let i = 0; i < 3; i++) {
        if (i !== winnerIndex) {
          game.players[i].score -= payChild;
        }
      }

      // 子2人分 + 積み棒(2人分) + 供託
      gainScore = (payChild * 2) + kyotakuBonus;
      game.players[winnerIndex].score += gainScore;

    } else {
      // ------------------------------------------
      // 子のツモ（3麻ツモ損：親と子で支払額が違う）
      // ------------------------------------------
      const parentIndex = game.dealer;
      const childIndex = [0, 1, 2].find(i => i !== winnerIndex && i !== parentIndex);

      const payParent = baseScore.parent + honbaBonus;
      const payChild = baseScore.child + honbaBonus;

      game.players[parentIndex].score -= payParent;
      game.players[childIndex].score -= payChild;

      // 親と子からの徴収分 + 供託
      gainScore = payParent + payChild + kyotakuBonus;
      game.players[winnerIndex].score += gainScore;
    }
  }

  // 供託のリセット
  game.kyotaku = 0;

  return gainScore;
}

/**
 * テーブルに存在する有効な符数に丸める関数
 */
function normalizeFu(fu) {
  const validFus = [25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
  if (validFus.includes(fu)) return fu;
  
  for (const f of validFus) {
    if (fu <= f) return f;
  }
  return 110;
}