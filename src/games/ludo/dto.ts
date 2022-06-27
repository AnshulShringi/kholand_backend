
export type PlayerDTO = {
    socketId: string;
    userId: number;
    playerColor: string;
    playerIndex: number;
    nickName: string;
};

export type TurnResult = {
    path:number[],
    type:string,
    homeGotti:string|undefined,
    killedGotti:string|undefined
}