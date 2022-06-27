import assert from 'assert';
import { User } from '../../components/users/model';
import { CONSTANTS } from './constant';


export enum PlayerState {
    WAITING,
    PLAYING,
    LEFT,
    IDLE
  }

export class Player {
    private gameMode:number;
    private profileUrl:string;
    private playerState:PlayerState = PlayerState.IDLE;
    private user:User;
    private playerIndex:number;
    private roomId: (string|undefined) = undefined;

    constructor(user:User) {
        assert(user, 'user is required');
        this.gameMode = -1;
        this.profileUrl = '';
        this.playerState = PlayerState.IDLE;
        this.user = user
        this.playerIndex=-1;
    }

    set State(playerState:PlayerState){
        this.playerState=playerState;
    }

    get State():PlayerState{
        return this.playerState;
    }

    get NickName(): string{
        return this.user.nickname??"No-Name";
    }

    get PublicAddress(): string {
        return this.user.publicAddress
    }

    get User(): User {
        return this.user
    }

    get PlayerColor():string{
        return CONSTANTS.DEFAULT_COLORS[this.playerIndex];
    }

    get RoomId(): string {
        if(this.roomId == undefined)console.log("RoomId for player: ", this, " not yet initialized")
        return this.roomId!
    }

    set RoomId(roomId: string){
        this.roomId = roomId
    }

    get PlayerIndex(): number {
        if(this.playerIndex == -1)console.log("PlayerIndex for player: ", this, " not yet initialized")
        return this.playerIndex
    }

    set PlayerIndex(playerIndex: number){
        this.playerIndex = playerIndex
    }

    get GameMode(): number {
        if(this.gameMode == -1)console.log("GameMode for player: ", this, " not yet initialized")
        return this.gameMode
    }

    set GameMode(gameMode: number){
        this.gameMode = gameMode
    }

}