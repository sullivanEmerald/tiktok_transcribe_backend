import {
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: [process.env.FRONTEND_URL, process.env.BASE_URL, 'http://localhost:3001'],
        credentials: true,
    }
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