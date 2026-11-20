import express from "express";
import http from"http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { Game } from "./js/game.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let waitingPlayers = [];
let currentGame = null;
const socketSessionMap = new Map();



// ----------
// プレイヤーをシャッフルする
// ----------
function shufflePlayer(array){
    for(let i = array.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ----------
// サーバー接続時
// ---------
io.on("connection", (socket) => {
    console.log(`ユーザーが接続: ${socket.id}`);

    // ----------
    // joinMatchMaking: マッチングを開始
    // ----------
    socket.on("joinMatchMaking", () => {
        if(waitingPlayers.includes(socket) || socketSessionMap.has(socket.id)){
            return;
        }
        
        waitingPlayers.push(socket);
        console.log(`プレイヤーを待機中: ${socket.id} （${waitingPlayers.length}/3）`);

        // 3人集まったらマッチング成功
        if(waitingPlayers.length === 3){
            console.log("ゲーム開始");

            shufflePlayer(waitingPlayers);            // 接続した順になっているwaitingPlayersの並びを入れ替える
            const roomSockets = [...waitingPlayers];  // マッチングした3人1組を退避してwaitingPlayersを空にする
            waitingPlayers = [];  // 次の接続を待つ

            // Gameインスタンスの作成
            const game = new Game(roomSockets);
            currentGame = game;

            roomSockets.forEach((socket, index) => {
                socketSessionMap.set(socket.id, { game, playerIndex: index });
                socket.emit("assignIndex", index);
                socket.emit("gameStart");
                console.log(`Socket ID: ${socket.id} -> 割り当てインデックス: ${index}`);  
            });
        }
    });

    // ----------
    // playerDiscard: 打牌時
    // ----------
    socket.on("playerDiscard", (payload) => {

        const session = socketSessionMap.get(socket.id);
        if(!session) return;

        const { game, playerIndex } = session;

        if(game.turn !== playerIndex) return;

        const tileIndex = payload?.tileIndex;
        game.discardStep(tileIndex);
        
    });

    // ----------
    // disconnect: 通信切断時
    // ----------
    socket.on("disconnect", () => {
        console.log(`ユーザーが通信を切断した: ${socket.id}`);
        socketSessionMap.delete(socket.id);
        waitingPlayers = waitingPlayers.filter(s => s !== socket);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`サーバーが起動: http://localhost:${PORT}`);
});