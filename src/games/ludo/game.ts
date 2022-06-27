
import { setTimeout } from 'timers';
import assert from 'assert';
import { biasedRandom } from './utils';
import { Player } from './player';
import { CONSTANTS } from './constant';
import { PlayerDTO, TurnResult } from './dto';


export enum GameState {
    DICE_ROLL_NEEDED,
    GOTTI_MOVED_NEEDED,
    MOVE_TO_NEXT_PLAYER,
    GAME_OVER,
  }

  export enum GottiState {
    INSIDE_HOME,
    OUTSIDE_HOME,
    FINISHED,
  }


export class Game {
    private gameState:GameState = GameState.DICE_ROLL_NEEDED;
    private currentPlayerIndex:number;
    private players:Map<number, Player> = new Map();
    public gameReward:number;

    //{ red1: 0, red2: 0, red3: 0, red4: 0 }
    private allGottis:Map<string, number> = new Map();
    private gottiPerState:Map<string, GottiState> = new Map();
    private movableGottis:string[]=[];
    private oppPositions:Map<number, string> = new Map();
    private winner:(Player|undefined);
    private diceNumber:number;
    private diceSixStreak:number=0;
    private roomId:string;
    private timer:NodeJS.Timeout|undefined;

    constructor(roomId:string, players:Player[]) {
        console.log(`Game-in roomId=${roomId}; players.length=${players.length}`);
        assert(players.length>1 && players.length<=4, `players.length should be [2,3,4] but ${players.length}`);

        this.roomId=roomId;
        this.diceNumber = 0;
        //holds opponent positions
        this.oppPositions = new Map();
        let availablePlayers:number[] = [];
        if (players.length == 2) {
            availablePlayers = [0, 2].reverse();
        } else if (players.length == 3) {
            availablePlayers = [0, 2, 3].reverse();
        } else if(players.length == 4) {
            availablePlayers = [0, 1, 2, 3].reverse();
        }
        this.gameReward = players.length * 0.8;

        //contains all the gottis as key and the positions as values red1=32
        this.allGottis = new Map();
        const scope = this;
        players.forEach((player:Player)=>{
            const playerIndex = availablePlayers.pop()!;
            const playerColor = CONSTANTS.DEFAULT_COLORS[playerIndex];
            player.PlayerIndex = playerIndex;
            scope.players.set(playerIndex, player);
            for(let i=0;i<4;i++){
                const gottiId = `${playerColor}-${i}`
                this.gottiPerState.set(gottiId, GottiState.INSIDE_HOME);
                this.allGottis.set(gottiId, 0);
            }
        });
        this.currentPlayerIndex = 0;
    }

    gameTimerCallback = (callback: CallableFunction) => {
        console.log("GameTimer Called")
        this.gameState=GameState.MOVE_TO_NEXT_PLAYER;

        this.currentPlayerIndex = this.nextPlayer(true).PlayerIndex;
        this.gameState = GameState.DICE_ROLL_NEEDED;

        
        callback()
    }

    public setGameTimer(callback: CallableFunction) {
        const scope = this
        scope.timer = setTimeout(scope.gameTimerCallback, 10000, callback);
    }

    public clearGameTimer() {
        if(this.timer){
            clearTimeout(this.timer)
        }
    }

    public resetGameTimer(callback: CallableFunction) {
        if(this.timer){
            this.clearGameTimer()
        }
        this.setGameTimer(callback)
    }

    public get RoomId():string{
        return this.roomId;
    }

    public get Player():Map<number, Player>{
        return this.players;
    }

    public get GottisInside():string[][]{
        const gottis:string[][] = [[],[],[],[]];
        this.gottiPerState.forEach((gottiState:GottiState, gottiId:string)=>{
            if(gottiState==GottiState.INSIDE_HOME){
                const color = gottiId.split("-")[0];
                const playerIndex = CONSTANTS.DEFAULT_COLORS.indexOf(color);
                gottis[playerIndex].push(gottiId);
            }
        });
        return gottis;
    }

    public get AutoMovableGotti():(string|undefined){
        const allMovableGotti = this.MovableGottis;
        const allMovablePosition:Set<number> = new Set();
        const scope = this;
        allMovableGotti.forEach((gottiId:string)=>{
            const position = scope.allGottis.get(gottiId)!;
            allMovablePosition.add(position);
        });
        if(allMovablePosition.size==1){
            return allMovableGotti[0];
        }
    }

    private calcMovableGottis(){
        console.log(`Game.playableGotti-in`)
        assert(this.gameState==GameState.GOTTI_MOVED_NEEDED);
        const scope = this;
        const movableGottis:string[] = [];
        console.log(this.allGottis);
        this.allGottis.forEach((position:number, gottiId:string)=>{
            const colorDashNumber = gottiId.split("-");
            if(scope.CurrentPlayer.PlayerColor == colorDashNumber[0]){
                if (position == 0) {
                    if(scope.diceNumber == 6){
                        // If at home and got six move.
                        movableGottis.push(gottiId);
                    }
                } else if (this.isOnFinishLine(position)) {
                    // If can finish then move.
                    movableGottis.push(gottiId);
                }
            }
        });
        console.log(movableGottis);
        console.log(`Game.playableGotti-out ${movableGottis}`)
        this.movableGottis = movableGottis;
    }

    public get MovableGottis():string[]{
        return this.movableGottis;
    }

    public rollDice(player:Player):number{
        console.log(`Game.rollDice-in player:${player}`)
        assert(this.CurrentPlayer.PlayerIndex == player.PlayerIndex);
        assert(this.gameState==GameState.DICE_ROLL_NEEDED);


        this.oppPositions = new Map();
        const myPositions:number[] = [];

        const scope = this;
        this.allGottis.forEach((gottisPosition: number, gottiId: string) => {
            if (gottisPosition > 0 && gottisPosition < 100) {
                const color = gottiId.split("-")[0];
                const playerIndex = CONSTANTS.DEFAULT_COLORS.indexOf(color);
                if (playerIndex == scope.currentPlayerIndex) {
                    myPositions.push(gottisPosition);
                } else {
                    scope.oppPositions.set(gottisPosition, gottiId);
                }
            }
        });


        let allInside = true;
        this.gottiPerState.forEach((gottiState:GottiState, gottiId:string)=>{
            const color = gottiId.split("-")[0];
            const playerIndex = CONSTANTS.DEFAULT_COLORS.indexOf(color);
            if(scope.currentPlayerIndex==playerIndex){
                allInside = gottiState==GottiState.INSIDE_HOME && allInside;
            }
        });

        if (allInside) {
            this.diceNumber = biasedRandom([6], 60)
            //sees if there is any players ahead and tries to cut it
        } else {
            let biases:number[] = [];
            myPositions.forEach(mine => {
                scope.oppPositions.forEach((value:string, key:number)=>{
                    if ((key - mine) <= 6 && (key - mine) > 0) {
                        biases.push(key - mine)
                    }
                });
            })
            //cuts players with 30% chance
            if (biases.length > 0) {
                this.diceNumber = biasedRandom(biases, 30)
            } else {
                this.diceNumber = biasedRandom([6], 20)
            }
        }
        assert(this.diceNumber>=1 && this.diceNumber <= 6, `this.diceNumber should be [1,6] but got ${this.diceNumber}`)
        
        this.gameState=GameState.GOTTI_MOVED_NEEDED
        if(this.diceNumber==6){
            this.diceSixStreak+=1;
        }else{
            this.diceSixStreak=0;
        }

        this.calcMovableGottis();
        console.log(`Game.rollDice-out player:${player}, diceNumber:${this.diceNumber}`)
        return this.diceNumber;
    }

    public setNextPlayer(player:Player){
        assert(this.CurrentPlayer.PlayerIndex == player.PlayerIndex, `It's player ${this.currentPlayerIndex} turn.`);
        assert(this.gameState==GameState.MOVE_TO_NEXT_PLAYER, `Did you forgot to call playTurn? Current gameState is ${this.gameState}.`);
        this.currentPlayerIndex = this.nextPlayer().PlayerIndex;
        this.gameState = GameState.DICE_ROLL_NEEDED;
    }

    public passTurn(player:Player){
        console.log(`Game.passTurn-in player:${player}`)
        assert(this.CurrentPlayer.PlayerIndex == player.PlayerIndex, `It's player ${this.currentPlayerIndex} turn.`);
        assert(this.gameState==GameState.GOTTI_MOVED_NEEDED, `Did you forgot to call rollDice? Current gameState is ${this.gameState}.`);
        assert(this.MovableGottis.length==0, `MovableGottis should be Zero.`);
        this.gameState=GameState.MOVE_TO_NEXT_PLAYER;
    }

    public playTurn(player:Player, gottiId:string):TurnResult{
        console.log(`Game.playTurn-in player:${player}, gottiId:${gottiId}`)
        assert(this.CurrentPlayer.PlayerIndex == player.PlayerIndex, `It's player ${this.currentPlayerIndex} turn.`);
        assert(this.gameState==GameState.GOTTI_MOVED_NEEDED, `Did you forgot to call rollDice? Current gameState is ${this.gameState}.`);
        assert(this.movableGottis.includes(gottiId), `Wrong gotti played.`);

        let turnType:TurnResult={
            path:[], 
            type:"", 
            homeGotti:undefined, 
            killedGotti:undefined
        };

        const gottiPosition = this.allGottis.get(gottiId)!
        if (gottiPosition == 0) {
            const position = this.getGottiOut(gottiId)
            this.gottiPerState.set(gottiId, GottiState.OUTSIDE_HOME);
            this.allGottis.set(gottiId, position);
            turnType.path.push(position);
            turnType.type="getGottiOut";
        } else {
            turnType.type="moveGotti";
            let currPosition = gottiPosition;
            let finalPos = currPosition + this.diceNumber;
            for (let i = currPosition; i <= finalPos; i++) {
                if (i == 53) {
                    i = 1;
                    finalPos = finalPos % 52;
                }
                turnType.path.push(i);
                if (i == 105 || i == 115 || i == 125 || i == 135) {
                    // TODO: Call if gameFinished.
                    turnType.homeGotti = gottiId;
                    this.gottiPerState.set(gottiId, GottiState.FINISHED);
                }
                const currentPlayerColor = this.CurrentPlayer.PlayerColor;
                if (currentPlayerColor == "red" && i == CONSTANTS.STOP_RED) {
                    finalPos = CONSTANTS.ENTRY_RED + finalPos - i - 1;
                    i = CONSTANTS.ENTRY_RED - 1;
                } else if (currentPlayerColor == "green" && i == CONSTANTS.STOP_GREEN) {
                    finalPos = CONSTANTS.ENTRY_GREEN + finalPos - i - 1;
                    i = CONSTANTS.ENTRY_GREEN - 1;
                } else if (currentPlayerColor == "blue" && i == CONSTANTS.STOP_BLUE) {
                    finalPos = CONSTANTS.ENTRY_BLUE + finalPos - i - 1;
                    i = CONSTANTS.ENTRY_BLUE - 1;
                } else if (currentPlayerColor == "yellow" && i == CONSTANTS.STOP_YELLOW) {
                    finalPos = CONSTANTS.ENTRY_YELLOW + finalPos - i - 1;
                    i = CONSTANTS.ENTRY_YELLOW - 1;
                }
            }
            const newPosition = turnType.path[turnType.path.length - 1];
            this.allGottis.set(gottiId, newPosition);
            //checing final position for any gotti.
            const killedGotti = this.checkKilledGottiId(newPosition);
            if(killedGotti){
                this.gottiPerState.set(killedGotti, GottiState.INSIDE_HOME);
                this.allGottis.set(killedGotti, 0);
                turnType.killedGotti = killedGotti;
            }
        }

        this.gameState = GameState.MOVE_TO_NEXT_PLAYER;
        if(this.isGameFinished()){
            this.gameState = GameState.GAME_OVER;
        }
        console.log(`Game.playTurn-out player:${player}, gottiId:${gottiId}`)
        return turnType;
    }

    public playerQuit(player:Player, isCurrentPlayer:boolean){
        console.log(`playerQuit-in player=${player.PlayerColor}`)
   
        for(let i=0;i<4;i++){
            const playerIndex = player.PlayerIndex;
            const color = player.PlayerColor;
            const gottiId = `${color}-${i}`;
            this.allGottis.delete(gottiId);
            this.gottiPerState.delete(gottiId);
        }
        this.players.delete(player.PlayerIndex);

        if(isCurrentPlayer){
            // Dice roll to next player
            this.currentPlayerIndex = this.nextPlayer().PlayerIndex;
            this.gameState = GameState.DICE_ROLL_NEEDED;
        }
        if(this.isGameFinished()){
            this.gameState = GameState.GAME_OVER;
        }
        console.log(`playerQuit-out player=${player.PlayerColor}`)
    }

    private isGameFinished():(Player|undefined){
        console.log(`Game.isGameFinished-in`)

        if(this.winner){
            return this.winner;
        }

        this.winner = undefined;
        let winnerColor:(string|undefined) = undefined;
        if(this.players.size==1){
            const player:Player = this.players.values().next().value
            winnerColor=player.PlayerColor;
        } else {
            const countPerColor:Map<string, number> = new Map();
            countPerColor.set('red',0);
            countPerColor.set('yellow',0);
            countPerColor.set('green',0);
            countPerColor.set('blue',0);

            this.gottiPerState.forEach((gottiState:GottiState, gottiId:string)=>{
                if(gottiState==GottiState.FINISHED){
                    const color = gottiId.split("-")[0];
                    const frequency = countPerColor.get(color)!;
                    countPerColor.set(color, frequency+1);
                }
            });

            countPerColor.forEach((frequency:number, color:string)=>{
                if(frequency>0){
                    winnerColor=color;
                    return;
                }
            });
        }

        if(winnerColor){
            const playerIndex=CONSTANTS.DEFAULT_COLORS.indexOf(winnerColor);
            this.winner = this.players.get(playerIndex);
        }

        console.log(`Game.isGameFinished-out winner:${winnerColor}`)
        return this.winner;
    }

    public get Winner():(Player|undefined){
        return this.winner;
    }

    public get AvailablePlayers():number[]{
        const available:number[] = [];
        this.players.forEach((player:Player)=>{
            available.push(player.PlayerIndex);
        });
        available.sort();
        return available;
    }

    public get GameState():GameState{
        return this.gameState;
    }

    public nextPlayer(callFromTimer: boolean = false):Player{
        console.log(`Game.setNextPlayer-in playerIndex=${this.currentPlayerIndex}`) 
        assert(this.players.size>0);

        if(this.diceSixStreak>0 && this.diceSixStreak<3 && callFromTimer==false){
            return this.CurrentPlayer;
        }
        this.diceSixStreak=0;

        let found=false;
        let nextlayerIndex = this.currentPlayerIndex;
        for(let i=1; i<=4 && !found;i++){
            nextlayerIndex = (this.currentPlayerIndex + i) % 4;
            const color = CONSTANTS.DEFAULT_COLORS[nextlayerIndex];
            for(let i=0;i<4;i++){
                const gottiId = `${color}-${i}`;
                found = this.allGottis.has(gottiId);
            }
        }

        assert(found);
        assert(this.players.has(nextlayerIndex));
        if(this.players.size>1){
            assert(nextlayerIndex!=this.currentPlayerIndex);
        }else if(this.players.size==1){
            const lastPlayer:Player = this.players.values().next().value;
            assert(nextlayerIndex==lastPlayer.PlayerIndex);
        }
        console.log(`Game.setNextPlayer-out playerIndex=${nextlayerIndex}`)
        return this.players.get(nextlayerIndex)!;
    }

    get CurrentPlayer():Player{
        return this.players.get(this.currentPlayerIndex)!;
    }

    private isOnFinishLine(currentGottiPosition:number) {
        console.log(`isOnFinishLine-in currentGottiPosition:${currentGottiPosition}`);
        const newPos = currentGottiPosition + this.diceNumber;
        let canFinish = true;
        if (currentGottiPosition >= 100) {
            canFinish = (
                (currentGottiPosition >= 100 && newPos <= 105) || 
                (currentGottiPosition >= 110 && newPos <= 115) || 
                (currentGottiPosition >= 120 && newPos <= 125) || 
                (currentGottiPosition >= 130 && newPos <= 135)
            )
        }
        console.log(`isOnFinishLine-out canFinish:${canFinish}`);
        return canFinish;
    }

    private getGottiOut(gottiId:string):number {
        //Called behind lock moveGotti
        console.log(`getGottiOut-in gottiId:${gottiId}`)
        let position = 0;
        if (gottiId.startsWith("red")) position = CONSTANTS.START_RED
        else if (gottiId.startsWith("green")) position = CONSTANTS.START_GREEN
        else if (gottiId.startsWith("blue")) position = CONSTANTS.START_BLUE
        else if (gottiId.startsWith("yellow")) position = CONSTANTS.START_YELLOW
        console.log(`getGottiOut-out gottiId:${gottiId}, position:${position}`)
        return position;
    }

    //returns the killed gotti name or the powerUp name or 0 for nothing
    private checkKilledGottiId(fd:number):(string|undefined) {
        if (!CONSTANTS.STAR_POSITIONS.includes(fd)) {
            if (this.oppPositions.has(fd)) {
                const killedGottiId = this.oppPositions.get(fd)!;
                return killedGottiId;
            } 
        }
        return undefined;
    }

    /*
    async gameController() {
        const scope = this;
        // TODO: block six count not more than 3.
        // if (this.movementAmount != 6) this.sixCount = 0;
        // else this.sixCount++;
        
        const movableGottis:string[] = this.findMovableGottis();
        await this.CurrentPlayer.addShakeAnimation(movableGottis);
        this.movableGottis = movableGottis;
        //waiting for the calculations to be sent from the client to the server
        if (movableGottis.length == 0){
            this.playerIndicator();
        }else if (movableGottis.length == 1) {
            // auto move
            await this.moveGotti(movableGottis[0]);
        } else {
            let movableGottisPositions:number[] = [];
            movableGottis.forEach((gottiId:string) => {
                const gottisPosition = scope.allGottis.get(gottiId)!;
                movableGottisPositions.push(gottisPosition);
            })
            if (this.gottisOutside[this.playerIndex].length == 0) {
                await this.moveGotti(movableGottis[0]);
            } else if (movableGottisPositions.every((val, i, arr) => val === arr[0])) {
                // Auto move if all moveable gotti in same position.
                await this.moveGotti(movableGottis[0])
            }
        }
    }
    */
}

