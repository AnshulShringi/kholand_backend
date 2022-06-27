import assert from 'assert';
import { Player, PlayerState } from './player'
import { Queue } from './queue';


export class GameLobby {
    private gameLobby2Players:Queue<Player> = new Queue<Player>();
    private gameLobby3Players:Queue<Player> = new Queue<Player>();
    private gameLobby4Players:Queue<Player> = new Queue<Player>();

    getQueue(lobbyNumber:number):(Queue<Player>){
        assert(2<=lobbyNumber && lobbyNumber <= 4);
        let lobbyQueue:(Queue<Player>|undefined)=undefined;
        switch(lobbyNumber){
            case 2: 
                lobbyQueue=this.gameLobby2Players; 
                break;
            case 3: 
                lobbyQueue=this.gameLobby3Players; 
                break;
            case 4: 
                lobbyQueue=this.gameLobby4Players; 
                break;
        }
        return lobbyQueue!;
    }

    enquePlayer(lobbyNumber:number, player:Player){
        const queue = this.getQueue(lobbyNumber)!
        player.State = PlayerState.WAITING;
        queue.enqueue(player);
    }

    dequeuePlayers(lobbyNumber:number):(Player[]|undefined){
        const queue = this.getQueue(lobbyNumber)!
        const waitForPlayers = this.waitingPlayers(lobbyNumber);
        const uniquePlayer = new Set<number>();
        if(waitForPlayers.length>=lobbyNumber){
            const players:Player[]=[];
            let i=0;
            while(i<lobbyNumber){
                const p = queue.dequeue()!
                uniquePlayer.add(p.User.id);
                // pop waiting players and remove idle and others.
                if(p.State==PlayerState.WAITING){
                    i+=1;
                    players.push(p)
                }
            }
            assert(uniquePlayer.size==players.length);
            return players;
        }
        return undefined;
    }

    waitingPlayers(lobbyNumber:number):(Player[]){
        const queue = this.getQueue(lobbyNumber)!
        const waitingPlayers:Player[]=[];
        queue.items().forEach((player:Player)=>{
            if(player.State==PlayerState.WAITING){
                waitingPlayers.push(player);
            }
        });
        return waitingPlayers;
    }

}