
import assert from 'assert';
import { v4 as uuid } from 'uuid';

import { User } from '../../components/users/model';
import { Pass } from '../../components/passes/model'
import { Ledger, RecordType, MetaData } from '../../components/ledger/model'

import { Player, PlayerState } from './player'
import { Game, GameState } from './game';
import { failSafe } from './utils';
import { PlayerDTO } from './dto';
import { GameLobby } from './lobby';

import { SocketType, NamespaceType } from '../../socketInterface';

import request from 'request';


class LudoMultiplayer {

    private games:Map<string, Game> = new Map();
    private socketIdToPlayer:Map<string, Player> = new Map();
    private userIdToSocket:Map<number, SocketType> = new Map(); // userId -> Socket
    private gameLobby:GameLobby = new GameLobby();

    constructor(io:NamespaceType){
        this.onSocketEvents(io);
    }

    socketForPlayer(player: Player): SocketType {
        const socket = this.userIdToSocket.get(player.User.id)!
        assert(socket, `Socket Not Found for the player-userid: ${player.User.id}`);
        return socket
    }

    getSockerPlayer(sock:SocketType):Player{
        const socketPlayer = this.socketIdToPlayer.get(sock.id)!
        assert(socketPlayer)
        return socketPlayer;
    }

    toPlayerDto(player:Player):PlayerDTO{
        const socket = this.userIdToSocket.get(player.User.id)!
        return {
            socketId:socket.id,
            userId:player.User.id,
            playerColor:player.PlayerColor, 
            playerIndex:player.PlayerIndex, 
            nickName:player.NickName
        }
    }

    getGame(player:Player):(Game|undefined){
        if(player.State == PlayerState.PLAYING){
            const roomId:string = player.RoomId;
            const game = this.games.get(roomId)
            if(!game){
                console.log(`Ludo Game on roll event -> game with roomId:${roomId} not found.`)
            }
            return game
        }
    }

    onSocketEvents(io:NamespaceType){
        const scope = this        
        io.on('connection', async (sock:SocketType) => {

            scope.onUserConnected(sock)

            sock.on("ludoJoinGame", (gameType:number) => {
                console.log(`sock.on joinGame type:${gameType}`);
                // push player to game lobby.
                const socketPlayer = scope.getSockerPlayer(sock);
                socketPlayer.State = PlayerState.WAITING;
                this.gameLobby.enquePlayer(gameType, socketPlayer);
                const lobbyPlayers = this.gameLobby.dequeuePlayers(gameType);

                if (lobbyPlayers) {
                    // Check if lobby if full.
                    console.log(`Server on joinGame num:${gameType}, player-length:${lobbyPlayers.length}`)
                    const roomId:string = uuid();
                    lobbyPlayers.forEach((player:Player) => {
                        player.RoomId = roomId;
                        player.State = PlayerState.PLAYING
                        player.GameMode = gameType
                    });
                    const game = new Game(roomId, lobbyPlayers);
                    scope.games.set(roomId, game);

                    // prepares the ludo board in all the players
                    const players:PlayerDTO[] = [];
                    game.Player.forEach((player:Player)=>{
                        players.push(scope.toPlayerDto(player));
                        const playerSocket = scope.userIdToSocket.get(player.User.id)!;
                        playerSocket.join(roomId);
                    });

                    
                    io.to(game.RoomId).emit("ludoStartGame", players);
                    game.Player.forEach((player:Player) => {
                        Pass.deductBattery(player.User.id, 1).then((res) => {}).catch((err) => {
                            console.error('Battery deduction error')
                        })
                    });

                    setPlayerIndicator(io, game);
                } else {
                    const waitingPlayers = this.gameLobby.waitingPlayers(gameType);
                    waitingPlayers.forEach(player => {
                        const socket = scope.socketForPlayer(player)
                        socket.emit("ludoWaitForPlayers", gameType - waitingPlayers.length)
                    })
                }
            })
            
            sock.on("ludoRoll", () => {
                const socketPlayer = scope.getSockerPlayer(sock);
                const game = scope.getGame(socketPlayer);
                if(!game) return;

                const currentColor = game.CurrentPlayer.PlayerColor;
                console.log(`sock.on roll PlayerColor:${currentColor}`);
                if(socketPlayer == game.CurrentPlayer){
                    failSafe(()=>{
                        const diceNumber = game.rollDice(socketPlayer); 
                        io.to(game.RoomId).emit("ludoRollTheDice", scope.toPlayerDto(game.CurrentPlayer), diceNumber);
                        console.log("room-id", game.RoomId);

                        const autoMovableGotti = game.AutoMovableGotti;
                        if(autoMovableGotti){
                            scope.gottiClicked(io, game, socketPlayer, autoMovableGotti);
                        }
                        else if(game.MovableGottis.length>0){
                            sock.emit("ludoAddShakeAnimation", game.MovableGottis);
                        }else{
                            game.passTurn(socketPlayer);
                            game.setNextPlayer(socketPlayer);
                            setPlayerIndicator(io, game);
                        }
                    });
                }
            })

            sock.on("ludoGottiClicked", (gottiId:string) => {
                console.log(`sock.on gottiClicked:${gottiId}`);
                const socketPlayer = scope.getSockerPlayer(sock);
                const game = scope.getGame(socketPlayer);
                if(!game){
                    console.error("Ludo Game not found")
                    return
                }
                scope.gottiClicked(io, game, socketPlayer, gottiId);
            })
        
            sock.on("ludoSendMessage", (message:string) => {
                console.log(`sock.on sendMessage:${message}`);
                const socketPlayer = scope.getSockerPlayer(sock);
                const game = scope.getGame(socketPlayer);
                if(!game){
                    console.error("Ludo Game not found")
                    return
                }

                io.to(game.RoomId).emit("ludoShowMessage", scope.toPlayerDto(socketPlayer), message);
            })

            sock.on("ludoFinishedMoving", () => {
                //Called by all player.
                const socketPlayer = scope.getSockerPlayer(sock);
                const game = scope.getGame(socketPlayer);
                if(!game) return;
                console.log(`sock.on finishedMoving socketPlayer:${socketPlayer.PlayerColor}`);
                if(socketPlayer == game.CurrentPlayer){
                    failSafe(()=>{
                        if(game.GameState == GameState.GAME_OVER){
                            scope.gameOver(io, game);
                        }else if(game.GameState == GameState.MOVE_TO_NEXT_PLAYER){
                            game.setNextPlayer(socketPlayer);
                            setPlayerIndicator(io, game);
                        }
                    });
                }
            })
        
            sock.on("disconnect", async () => {
                console.log(`sock.on disconnect-in`);
                const socketPlayer = scope.getSockerPlayer(sock);
                const game = scope.getGame(socketPlayer);
                if(!game) return;
                console.log(`sock.on disconnect socketPlayer:${socketPlayer.PlayerColor}`);
                if (!socketPlayer) return;

                if (socketPlayer.State == PlayerState.PLAYING) {
                    failSafe(()=>{
                        const isCurrentPlayer = game.CurrentPlayer.PlayerIndex == socketPlayer.PlayerIndex;
                        game.playerQuit(socketPlayer, isCurrentPlayer);
                        if(isCurrentPlayer){
                            setPlayerIndicator(io, game);
                        }
                    });

                    io.to(game.RoomId).emit("ludoRemovePlayer", scope.toPlayerDto(socketPlayer));
                    sock.leave(game.RoomId);

                    if(game.GameState==GameState.GAME_OVER){
                        scope.gameOver(io, game);
                    }
                }

                socketPlayer.State = PlayerState.LEFT;
                scope.socketIdToPlayer.delete(sock.id);
                console.log(`sock.on disconnect-out`);
            })
            


            const setPlayerIndicator = (io:NamespaceType, game:Game)=>{
                console.log("setPlayerIndicator-in")
                const currentPlayer = game.CurrentPlayer;  
                game.resetGameTimer(() => {
                    console.log("setPlayerIndicator.resetGameTimer-in")
                    setPlayerIndicator(io, game)
                });
                io.to(game.RoomId).emit("ludoPlayerIndicator", scope.toPlayerDto(currentPlayer));
            }
        })
    }

    gottiClicked(io:NamespaceType, game:Game, socketPlayer:Player, gottiId:string){
        const scope=this;
        if(
            socketPlayer == game.CurrentPlayer && 
            game.GameState==GameState.GOTTI_MOVED_NEEDED && 
            game.MovableGottis.includes(gottiId)){
            failSafe(()=>{
                const turnResult = game.playTurn(socketPlayer, gottiId);
                io.to(game.RoomId).emit("ludoMoveGotti", gottiId, turnResult);
            });
        }
    }

    onUserConnected = (sock:SocketType) => {
        console.log(`onUserConnected-in`);
        const user:User =sock.data.user!;
        const prevSocket = this.userIdToSocket.get(user.id);
        if(prevSocket){
            console.log("removing previous connection");
            prevSocket.disconnect(true);
            const prevPlayer = this.socketIdToPlayer.get(prevSocket.id);
            if(prevPlayer){
                prevPlayer.State=PlayerState.LEFT;
            }
        }

        const player = new Player(user);
        this.userIdToSocket.set(player.User.id, sock);
        this.socketIdToPlayer.set(sock.id, player);
    }

    gameOver = (io:NamespaceType, game:Game) => {
        const scope = this;
        const winner = game.Winner!;
        io.to(game.RoomId).emit("ludoGameOver", scope.toPlayerDto(winner));
        game.Player.forEach((player:Player)=>{
            player.State = PlayerState.IDLE;
        });

        failSafe(()=>{
            Ledger.record(winner.User.id, game.gameReward, RecordType.GAME_REWARD, MetaData.LUDO)
            .then((res) => {})
            .catch((err) => {
                console.log("Rewarding error")
            })

            const formData = {
                content: `${winner.NickName}(${winner.PublicAddress}) just won ${game.gameReward} KHO tokens by playing crypto ludo.`
            };
            request.post({url:'https://discord.com/api/webhooks/975365276214382644/Ytgx9zoo1Pi1I-9QtQi-pvve6PddRJunIeSblaPuViQrm8ZGlEkuADPw0GRL4ZcRAHIN', formData: formData}, function optionalCallback(err, httpResponse, body) {
                if (err) {
                  return console.error('Discord Webhook error:', err);
                }
                console.log('Discord webhook call successful: ', body);
            });


            
        })
        scope.games.delete(winner.RoomId);
    }
}

export default LudoMultiplayer;