// game.js

import { generateTiles, shuffle } from "./tiles.js";
import { Player } from "./player.js";
import { judgeYaku } from "./yaku.js";
import { calcScore } from "./score.js";
import { onRiichi, onCancelRiichi, onPon, onKan, onAnkan, onDaiminkan, onShominkan, onNorth,
         addKanDora,
         canRiichi, canTsumo, canRon, canCallForOpponent, canCallForMe, canNorth
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

        this.openDoraCount = 1;

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

        // ----------
        // デバッグ用: 手牌の操作
        // ----------
        const p = this.players[0];
        p.hand = [
            { suit: "pin", value: 1, red: false, type: "wall" },
            { suit: "pin", value: 1, red: false, type: "wall" },
            { suit: "pin", value: 2, red: false, type: "wall" },
            { suit: "pin", value: 2, red: false, type: "wall" },
            { suit: "pin", value: 3, red: false, type: "wall" },
            { suit: "pin", value: 3, red: false, type: "wall" },
            { suit: "sou", value: 7, red: false, type: "wall" },
            { suit: "sou", value: 8, red: false, type: "wall" },
            { suit: "sou", value: 9, red: false, type: "wall" },
            { suit: "wind", value: 1, red: false, type: "wall" },
            { suit: "wind", value: 1, red: false, type: "wall" },
            { suit: "dragon", value: 1, red: false, type: "wall" },
            { suit: "dragon", value: 1, red: false, type: "wall" },
        ];

        this.players.forEach((_, idx) => this.sortHand(idx));

        this.state = "TurnStart";
        this.step();

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

    step(){

        switch(this.state){

            // ----------
            // ゲーム管理
            // ----------
            // 後で実装
            case "Deal":
                this.deal();
                break;

            case "EndRound":
                this.broadcastGameState();
                break;

            // ----------
            // ターン管理
            // ----------
            case "TurnStart":
                this.onTurnStart();
                break;

            case "Draw":
                this.onDraw();
                break;

            case "CheckTsumo":
                this.tsumoStep();
                break;

            case "Discard":
                this.discardStep();
                break;

            case "CheckRon":
                this.ronStep();
                break;

            case "WaitCall":
                this.callStep();
                break;

            case "NextTurn":
                this.onNextTurn();
                break;

        }
    }

    // ----------
    // TurnStart
    // ----------
    onTurnStart(){

        if(this.wallIndex >= this.wall.length){

            this.state = "EndRound";
            this.step();
            return;
        }

        this.state = "Draw";
        this.step();
    }


    // ----------
    // Draw
    // ----------
    onDraw(){
        const p = this.players[this.turn];
        const tile = this.wall[this.wallIndex++];

        p.draw(tile);

        this.turnCount++;
        this.state = "Discard";
        this.step();
    }


    // ----------
    // CheckTsumo
    // ----------
    onCheckTsumo(){

        const p = this.players[this.turn];
        const lastTile = p.hand[p.hand.length - 1];

        const resultList = {
            isTsumoWin: false,
            lastTile,
            winnerIndex: null,
            yakuResult: null
        };

        // ツモ牌が待ち牌であるか
        const isWaitingTiles = p.isTenpai && 
                               p.waitingTiles.some(w => sameTile(w, lastTile));

        if(!isWaitingTiles){
            console.log("%c[onCheckTsumo] ツモ牌は待ち牌ではない", "color: #4b88c2;");
            return resultList;
        }

        // ----------
        // ツモ和了成立時
        // ----------
        const openDora = this.doraIndicators.slice(0, this.openDoraCount);
        const uraDora = p.isRiichi ? this.uraIndicators.slice(0, this.openDoraCount) : [];  // 裏ドラは立直していた場合に表ドラと同じ枚数だけ開く

        const yakuResult = judgeYaku(
            p,
            p.hand,
            lastTile,
            true,
            this.plalyerWind,
            1,
            openDora,
            uraDora,
            this.wallIndex >= this.wall.length
        );

        if(p.isRiichi){
            yakuResult.han += 1;
            if(p.isIppatsu) yakuResult.han += 1;
        }

        if(!yakuResult || yakuResult.han <= 0){
            console.log("[Reject: onCheckTsumo] ツモ和了していない", "color: #e44848;");
            return resultList;
        }

        resultList.isTsumoWin = true;
        resultList.winnerIndex = this.turn;
        resultList.yakuResult = yakuResult;

        return resultList;

    }

    tsumoStep(){
        console.log("%c[CheckTsumo: tsumoStep] 開始", "color: #4b88c2;");

        const index = this.turn;
        const p = this.players[index];
        const tsumoResult = this.onCheckTsumo();

        // ツモ・立直・副露・北抜きフラグの取得
        const canTsumoWin = tsumoResult.isTsumoWin;
        const canRiichiNow = canRiichi(this, index);
        const selfCall = canCallForMe(this, index);
        const canNorthNow = canNorth(this, index);

        // ツモ和了可能ならPlayerインスタンスに結果を保存する
        if(canTsumoWin){
            p.tsumoResult = tsumoResult;
        } else {
            p.tsumoResult = null;
        }

        // 表示できるアクションボタンがあるか
        const hasAction = canTsumoWin || canRiichiNow || selfCall.canKan || canNorthNow;

        if(hasAction){
            this.availableActionsByPlayer = {
                [index]: {
                    canTsumo: canTsumoWin,
                    canRiichi: canRiichiNow,
                    riichiCandidates: canRiichiNow ? getRiichiCandidates(this, index) : [],
                    canKan: selfCall.canKan,
                    kanCandidates: selfCall.candidates,
                    canNorth: canNorthNow
                }
            };

            console.log(`[WaitUser: tsumoStep] プレイヤー${index}:\n${canTsumoWin ? "ツモ和了できる\n" : ""}${canRiichiNow ? "立直できる\n" : ""}${selfCall.canKan ? "カンできる\n" : ""}${canNorthNow ? "北抜きできる" : ""}`, "color: #ff4794;");

            this.broadcastGameState();
            return;
        }

        // 表示できるものがなければそのまま打牌へ
        this.availableActionsByPlayer = {};
        this.state = "Discard";
        this.step();
    }

    // ----------
    // Discard
    // ----------
    discardStep(tileIndex = null){
        if(this.state !== "Discard"){
            console.log("%c[Reject: discardStep] 打牌できるタイミングではない", "color: #e44848;");
            return;
        } 

        // 一度Discardステートに入り、returnして打牌選択を待つ
        if(tileIndex === null){
            this.broadcastGameState();
            console.log("%c[WaitUser: discardStep] 打牌待ち", "color: #ff4794;");
            return;
        }

        // 捨てる牌が選択されたなら打牌する
        this.onDiscard(tileIndex);
        this.state = "NextTurn";
        this.step();
    }

    onDiscard(tileIndex){

        const p = this.players[this.turn];
        const [discardedTile] = p.hand.splice(tileIndex, 1);
        p.discards.push(discardedTile);
        this.lastDiscarder = this.turn;
    }


    // ----------
    // NextTurn
    // ----------
    onNextTurn(){

        this.turn = (this.turn + 1) % this.players.length;
        this.state = "TurnStart";
        this.step();
    }


    // ----------
    // デバッグ用: 次の自分のツモ牌を指定する
    // ----------
    nextDrawSelect(suit, value, red = false){

        // 次の自分のツモ牌のwallIndexは現在のwallIndexの2つ先になる
        const offset = 2;
        const targetIndex = this.wallIndex + offset;

        // マイナスもしくは山の長さ以上へのアクセスは禁止
        if(targetIndex < 0 || targetIndex >= this.wall.length){
            console.log("%c[Reject: nextDrawSelect] 山の範囲外", "color: #e44848;");
            return false;
        }
    
        const foundIndex = this.wall.findIndex(
            (tile, index) => 
                index >= this.wallIndex &&
            tile &&
            tile.suit === suit &&
            tile.value === value &&
            (red === undefined || tile.red === red)
        );

        // 指定した牌が山に残っていなかった場合
        if(foundIndex === -1){
            console.log(`%c[Reject: nextDrawSelect] 山にsuit: ${suit}, value: ${value}となる牌が見つからない`, "color: #e44848;");
            return false;
        }
        
        // 牌を入れかえる
        [this.wall[targetIndex], this.wall[foundIndex]] = 
        [this.wall[foundIndex], this.wall[targetIndex]];

        console.log(`[nextDrawSelect] 次のツモ牌を${JSON.stringify(this.wall[targetIndex])}に設定, "color: #4b88c2;`);
        return true;



    }

}



