
import { Server as SocketServer, Socket, Namespace} from "socket.io";
import { Server as HttpServer} from "http";
import { PlayerDTO, TurnResult } from './games/ludo/dto';
import { MetaPlayerDto, MetaActionDto } from './games/meta/dto';
import { User } from './components/users/model';


export interface ServerToClientEvents {
  // META
  metaRegistered: (player:MetaPlayerDto) => void;
  metaStatusActionUpdated: (action:MetaActionDto) => void;
  metaRemoteData: (player:MetaPlayerDto[]) => void;

  // LUDO
  ludoWaitForPlayers: (remaningPlayer:number) => void;
  ludoStartGame: (players:PlayerDTO[]) => void;
  ludoPlayerIndicator: (currentPlayer:PlayerDTO) => void;
  ludoRollTheDice: (currentPlayer:PlayerDTO, diceNumber:number) => void;
  ludoAddShakeAnimation: (movableGottis:string[]) => void;
  ludoMoveGotti: (gottiId:string, turnResult: TurnResult) => void;
  ludoShowMessage: (sender:PlayerDTO, message:string) => void;
  ludoRemovePlayer: (player:PlayerDTO) => void;
  ludoGameOver: (winner:PlayerDTO) => void;
}
  
export interface ClientToServerEvents {
  connection:(socket: SocketType)  => Promise<void>;
  disconnect: ()=> void;

  // META
  metaMove: (player:MetaPlayerDto) => void;
  metaStatusAction: (action:MetaActionDto) => void;

  // LUDO
  ludoRoll: () => void;
  ludoGottiClicked: (gottiId:string) => void;
  ludoSendMessage: (message:string) => void;
  ludoFinishedMoving: () => void;
  ludoJoinGame: (gameType:number) => void;
}
  
export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: User;
}

export type SocketServerType = SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type SocketType = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type NamespaceType = Namespace<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export const createSocket=(server:HttpServer):SocketServerType => {
	const io = new SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
		},
	});
  return io;
}