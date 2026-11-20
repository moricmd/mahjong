// js/pvpClient.js
import { updateGameLayout } from "./gameUI.js";
import {
  renderPlayerHand,
  renderDiscards,
  updateTableInfo,
  updateTurnIndicator
} from "./UI.js";

/**
 * 対人戦クライアント側のSocketイベントと画面描画を初期化する
 * @param {Socket} socket - Socket.io クライアントインスタンス
 * @param {Object} deps - main.js から渡す依存関数・ゲッター
 * @param {Function} deps.showScreen - 画面切り替え関数
 * @param {Function} deps.getAutoSort - 現在の自動理牌フラグを返す関数
 */
export function initPvPClient(socket, { showScreen, getAutoSort }) {
  // ゲーム開始通知（3人揃って画面切り替え）
  socket.on("gameStart", (data) => {
    console.log("ゲーム開始", data);
    showScreen("game-screen");
  });

  // サーバーからの最新ステート受信＆描画
  socket.on("updateGameState", (state) => {
    console.log("サーバーから状態を受信:", state);
    window.myIndex = state.myIndex;

    const viewPlayers = buildViewPlayers(state);
    renderGameState(socket, state, viewPlayers, getAutoSort());
  });
}

/**
 * 自分の風を基準に、対象プレイヤーの画面上の座席位置を返す
 */
function getSeatPosition(myWind, targetWind) {
  const seatMap = {
    1: { 1: "bottom", 2: "right", 3: "top" },
    2: { 2: "bottom", 3: "right", 1: "left" },
    3: { 3: "bottom", 1: "top", 2: "left" }
  };
  return seatMap[myWind]?.[targetWind] ?? "bottom";
}

/**
 * サーバーの絶対インデックス（0, 1, 2）の情報を、
 * 自分（bottom）を先頭にしたクライアント表示用配列に変換する
 */
function buildViewPlayers(state) {
  const myIndex = state.myIndex;
  const myWind = state.playersInfo[myIndex].wind;
  const viewPlayers = [];

  for (let offset = 0; offset < 3; offset++) {
    const targetIndex = (myIndex + offset) % 3;
    const info = state.playersInfo[targetIndex];

    viewPlayers.push({
      ...info,
      serverIndex: targetIndex,
      relativeIndex: offset,
      position: getSeatPosition(myWind, info.wind),
      hand: offset === 0 ? state.myHand : new Array(info.handCount).fill(null)
    });
  }

  // updateTableInfo が players[0] を自分（bottom）として参照するため先頭に置く
  viewPlayers.sort((a, b) => {
    if (a.position === "bottom") return -1;
    if (b.position === "bottom") return 1;
    return 0;
  });

  return viewPlayers;
}

/**
 * 変換済みの状態をもとに各UIコンポーネントを描画する
 */
function renderGameState(socket, state, viewPlayers, autoSort) {
  // 卓・局・残り山札・風・点数の更新
  updateTableInfo(
    state.round,
    state.kyoku,
    { length: state.wallLength },
    state.wallIndex,
    viewPlayers
  );

  // 自分の手牌描画と打牌送信
  renderPlayerHand(
    viewPlayers[0],
    (tileIndex) => {
      if (state.turn === state.myIndex && state.state === "Discard") {
        socket.emit("playerDiscard", { tileIndex });
      }
    },
    autoSort,
    null
  );

  // 全員の捨て牌描画
  viewPlayers.forEach((p, i) => {
    renderDiscards(i, p.discards, p.position);
  });

  // ターン表示とレイアウト更新
  const relativeTurn = (state.turn - state.myIndex + 3) % 3;
  updateTurnIndicator(relativeTurn, viewPlayers);
  updateGameLayout(viewPlayers);
}