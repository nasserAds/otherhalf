import { OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
declare class SignalDto {
    targetUserId: string;
    data: Record<string, unknown>;
}
declare class MicStateDto {
    isMicOn: boolean;
}
export declare class VoiceGateway implements OnGatewayDisconnect {
    server: Server;
    private activeByRoom;
    private roomByUser;
    onJoin(client: Socket): void;
    onLeave(client: Socket): void;
    onSignal(client: Socket, body: SignalDto): void;
    onMicState(client: Socket, body: MicStateDto): void;
    handleDisconnect(client: Socket): void;
    private removeFromVoice;
    private requireRoom;
}
export {};
