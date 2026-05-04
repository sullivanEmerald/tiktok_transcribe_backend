import {
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    cors: true,
})
export class ProgressGateway {
    @WebSocketServer()
    server: Server;


    sendProgress(progress: number, type: 'download' | 'transcribe') {
        this.server.emit(`progress-${type}`, progress);
    }

    sendCompleted(data: any, type: 'download' | 'transcribe') {
        this.server.emit(`completed-${type}`, data);
    }

    sendError(message: string, type: 'download' | 'transcribe') {
        this.server.emit(`error-${type}`, message);
    }
}