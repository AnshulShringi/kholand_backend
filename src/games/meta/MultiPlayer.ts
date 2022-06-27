import { User } from "../../components/users/model";
import { SocketType, NamespaceType } from '../../socketInterface';
import { MetaPlayerDto, MetaActionDto } from './dto';


export class MultiPlayer {

    private io:NamespaceType;
    private publicAddressMap: Map<string, string> = new Map();
    private clients: Map<string, MetaPlayerDto> = new Map();

    constructor(io:NamespaceType) {
        this.io = io;
        this.init();
    }

    getRandomCharacterId(): string{
        const gender = ['m', 'f'];
        const loadlCharacterId = `${gender[this.getRandomIntForCharacter(2)]}_${this.getRandomIntForCharacter(11)+1}`
        return loadlCharacterId
    }

    getRandomIntForCharacter(max:number){
        return Math.floor(Math.random() * max);
    }

    getRandomInt(max:number){
        return 5 + Math.floor(Math.random() * (max-5));
    }

    init(){
        const scope = this;
        const io = this.io;
        const clients = this.clients;
        //Socket setup
        io.on('connection', async (socket:SocketType)=>{
            console.log(`User ${socket.id} connected.`);
            const user: User = socket.data.user!

            console.log("User Connected", user)

            //TODO: Get status from database
            const clientValue: MetaPlayerDto = {
                id: socket.id,
                position: {
                    x:0,
                    y:0,
                    z:0
                }
                ,
                rotation: {
                    x:0,
                    y:0,
                    z:0
                },
                state: 'idle',
                status: 'chess',
                publicAddress: user.publicAddress,
                characterId: user.characterId ?? scope.getRandomCharacterId(),
                statusVisible: true
            };
            
            clients.set(user.publicAddress, clientValue);
            scope.publicAddressMap.set(socket.id, clientValue.publicAddress);

            const player:MetaPlayerDto = {
                id: socket.id,
                characterId:clientValue.characterId,
                publicAddress: clientValue.publicAddress,
                status:clientValue.status,
                state: clientValue.state,
                position: clientValue.position,
                rotation: {x:0, y:0, z:0},
                statusVisible:false
            };
            
            socket.emit('metaRegistered', player);

            socket.on('metaMove', (player:MetaPlayerDto)=>{
                const publicAddress = player.publicAddress;
                if(publicAddress && clients.has(publicAddress)){
                    const clientValue:MetaPlayerDto = clients.get(publicAddress)!;
                    clientValue.position = player.position;
                    clientValue.rotation = player.rotation;
                    clientValue.state = player.state;
                    clientValue.status = player.status;
                    clients.set(publicAddress, clientValue);
                }
            });

            //Handle the disconnection
            socket.on('disconnect', ()=>{
                //Delete this client from the object
                const publicAddress = scope.publicAddressMap.get(socket.id);
                console.log(`disconnect publicAddress:${publicAddress}`)
                clients.delete(publicAddress!);
            });

            // status action
            socket.on('metaStatusAction', (action:MetaActionDto) => {
                console.log("statusAction", action);
                io.emit('metaStatusActionUpdated', action);
            });

        });
    }

    syncData(){
        let validClient:MetaPlayerDto[] = [];
		for (let [key, value] of this.clients) {
			if(value && value && value.position && value.rotation){
				validClient.push(value);
			}
		}

		if(validClient.length>0){ 
			this.io.emit('metaRemoteData', validClient);
		}
    }
}