// game.js

import { generateTiles, shuffle } from "./tiles.js";
import { Player } from "./player.js";
import { calcScore } from "./score.js";
import { renderDoraIndicators, renderPlayerHand, renderCPUHand, renderDiscards,
         createTileElement,
         assignSeatsByWind,
         updateMelds, updateNorthTiles,
         updateRelativeScores, updateTurnIndicator, updateCPUHandPosition, updateTableInfo,
         updateFuritenIndicator
        } from "./UI.js";
import { updateGameLayout  } from "./gameUI.js";
import { judgeYaku } from "./yaku.js";
import { calcScore } from "./score.js";
import { chooseDiscardIndex } from "./CPU.js";
import { onRiichi, onCancelRiichi, onPon, onKan, onAnkan, onDaiminkan, onKakan, onNorth,
         addKanDora,
         canRiichi, canTsumo, canRon, canPon, canKan, canAnkan, canDaiminkan, canKakan, canNorth
        } from "./action.js";
import { checkTenpai, isTenpaiNow, getRiichiCandidates,
         checkDiscardFuriten, missedRonFuriten
        } from "./rules.js";

export class Game {

    constructor(roomSockets){

        this.roomSockets = roomSockets;

        this.players = [
            new Player(0, false),
            new Player(1, false),
            new Player(2, false)
        ];

        this.state = "Init";
        this.turn = 0;
        this.turnCount = 0;

        this.wallIndex = 0;  // 次のプレイヤーがツモる牌のカーソル
        this.honba = 0;
        this.kyotaku = 0;

        this.wall = [];
        this.rinshan = [];
        this.doraIndicators = [];
        this.uraIndicators = [];
        this.openDoraCount = 1;

        this.round = 1;
        this.kyoku = 1;
        this.dealer = 0;

        this.lastDiscarder = null;
        this.pendingDiscard = null;
        this.pendingRonResult = null;

        this.initGame();
    }

    // ----------
    // 初期化
    // ----------
    initGame(){

        // 東: 1, 南: 2, 西: 3 に対応
        const winds = [1, 2, 3];

        this.players.forEach((p, idx) => {
            p.wind = winds[idx];
            p.position = ["bottom", "right", "left"][idx];
        });

        this.dealer = 0;          // インデックスが0のプレイヤーは親・起家
        this.turn = this.dealer;  // 親の第一ツモから始める

        this.buildWall();
        this.deal();
    }

    // ----------
    // 山構築
    // ----------
    buildWall(){

        // 牌生成してシャッフルしておく
        const tiles = generateTiles();
        shuffle(tiles);

        // 王牌をtilesの末尾から切り出して作る
        this.rinshan = tiles.splice(-8);  // 嶺上牌は8枚（カン最大4回, 北抜き最大4回）
        this.rinshan.forEach(t => t.type = "rinshan");

        this.doraIndicators = tiles.splice(-5);  // ドラ表示牌は5枚
        this.doraIndicators.forEach(t => t.type = "dora");

        this.uraIndicators = tiles.splice(-5);  // 裏ドラ表示牌は5枚
        this.uraIndicators.forEach(t => t.type = "uraDora");

        this.openDoracount = 1;

        // 残りを山とする
        this.wall = tiles;
        this.wall.forEach(t => t.type = "wall");
        this.wallIndex = 0;
    }

    // ----------
    // 配牌
    // ----------
    deal(){

        // 13枚ずつ配る
        for(let i = 0; i < 13; i++){
            this.players.forEach(p => p.draw(this.wall[this.wallIndex++]));
        }

        this.players.forEach((_, idx) => this.sortHand(idx));

        this.state = "TurnStart";
        this.broadcastGameState();

    }


    // ----------
    // 自動理牌
    // ----------
    sortHand(playerIndex){

        const p = this.players[playerIndex];

        // 並び順の定義
        const windOrder = { 1: 0, 2: 1, 3: 2, 4: 3 };  // 東（value = 1） → 南 → 西 → 北
        const dragonOrder = { 1: 0, 2: 1, 3: 2 };      // 白（value = 1） → 發 → 中
        const suitOrder = { man: 0, pin: 1, sou: 2, wind: 3, dragon: 4 };

        p.hand.sort((a, b) => {

            // 異なる種類の牌は 萬子 → 筒子 → 索子 → 風牌 → 三元牌 の順に並べる
            // まず種類ごとに順に並べる
            if(suitOrder[a.suit] !== suitOrder[b.suit]){
                return suitOrder[a.suit] - suitOrder[b.suit];
            }

            // 数牌を順番に並べる
            if(["man", "pin", "sou"].includes(a.suit)){

                // 値が異なるなら昇順に並べる
                if(a.value !== b.value){
                    return a.value - b.value;
                }

                // 値が同じで、赤ドラなら 通常牌 → 赤ドラ の順に並べる
                return (a.red ? 1 : 0) - (b.red ? 1 : 0);

            }

            // 風牌の場合は 東 → 南 → 西 → 北 の順に並べる
            if(a.suit === "wind") return windOrder[a.value] - windOrder[b.value];

            // 三元牌の場合は 白 → 發 → 中 の順に並べる
            if(a.suit === "dragon") return dragonOrder[a.value] - dragonOrder[b.value];

            return 0;
    
        });
    }

    // ----------
    // プレイヤーの状態の送信
    // ----------
    broadcastGameState(){

        this.roomSockets.forEach((socket, index) => {

            const playerState = {
                myIndex: index,
                myHand: this.players[index].hand,
                turn: this.turn,
                state: this.state,

                playersInfo: this.players.map((p, i) => ({
                    score: p.score,
                    wind: p.wind,
                    isRiichi: p.isRiichi,
                    discards: p.discards,
                    melds: p.melds,
                    handCount: p.hand.length
                })),

                wallLength: this.wall.length,
                wallIndex: this.wallIndex,
                round: this.round,
                kyoku: this.kyoku
            };

            socket.emit("updateGameState", playerState);
        });
    }
}



