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
  const winner = game.players[winnerIndex];
  const isChild = (winnerIndex !== game.dealer);
  const role = isChild ? 'child' : 'parent';

  // 符数をテーブルのキーに丸めるヘルパー
  const normalizedFu = normalizeFu(fu);

  let totalWinScore = 0; // 本棒・供託を含まない純粋な和了点数（または支払い総額）

  if (isRon) {
    // ==========================================
    // ロン和了の場合
    // ==========================================
    let baseScore = 0;
    if (han >= 5) {
      baseScore = SCORE_TABLE.ron[role][han];
    } else {
      baseScore = SCORE_TABLE.ron[role][han][normalizedFu] || SCORE_TABLE.ron[role][han][30];
    }

    // 本場（積み棒）の加算（1本につき300点）
    const honbaBonus = game.honba * 300;
    totalWinScore = baseScore;

    // 点数移動
    game.scores[loserIndex] -= (totalWinScore + honbaBonus);
    game.scores[winnerIndex] += (totalWinScore + honbaBonus);

    // 供託（リーチ棒）の回収
    if (game.kyotaku > 0) {
      game.scores[winnerIndex] += game.kyotaku * 1000;
      game.kyotaku = 0;
    }

  } else {
    // ==========================================
    // ツモ和了の場合（3麻ルール）
    // ==========================================
    let paymentDetails;
    if (han >= 5) {
      paymentDetails = SCORE_TABLE.tsumo[role][han];
    } else {
      paymentDetails = SCORE_TABLE.tsumo[role][han][normalizedFu] || SCORE_TABLE.tsumo[role][han][30];
    }

    const honbaBonus = game.honba * 300; // 各自が支払う本場分

    if (!isChild) {
      // ------------------------------------------
      // 親のツモ（残りの子2人から同額をもらう）
      // ------------------------------------------
      const payPerPerson = paymentDetails.child;
      totalWinScore = payPerPerson * 2;

      for (let i = 0; i < 3; i++) {
        if (i === winnerIndex) continue;
        game.scores[i] -= (payPerPerson + honbaBonus);
      }
      game.scores[winnerIndex] += totalWinScore + (honbaBonus * 2);

    } else {
      // ------------------------------------------
      // 子のツモ（3麻ツモ損：親と子で支払額が違う）
      // ------------------------------------------
      const parentIndex = game.dealer;
      const otherChildIndex = [0, 1, 2].find(i => i !== winnerIndex && i !== parentIndex);

      const parentPay = paymentDetails.parent;
      const childPay = paymentDetails.child;
      totalWinScore = parentPay + childPay;

      // 親からの支払い
      game.scores[parentIndex] -= (parentPay + honbaBonus);
      // もう1人の子からの支払い
      game.scores[otherChildIndex] -= (childPay + honbaBonus);

      // 勝者の獲得点数
      game.scores[winnerIndex] += totalWinScore + (honbaBonus * 2);
    }

    // 供託（リーチ棒）の回収
    if (game.kyotaku > 0) {
      game.scores[winnerIndex] += game.kyotaku * 1000;
      game.kyotaku = 0;
    }
  }

  return totalWinScore;
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