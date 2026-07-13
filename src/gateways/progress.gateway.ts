// import {
//     WebSocketGateway,
//     WebSocketServer,
//     OnGatewayConnection,
//     OnGatewayDisconnect,
// } from '@nestjs/websockets';
// import { Logger } from '@nestjs/common';
// import { Server, Socket } from 'socket.io';

// export type JobEventType = 'download' | 'transcribe';

// @WebSocketGateway({
//     cors: {
//         origin: [process.env.FRONTEND_URL, process.env.BASE_URL, 'http://localhost:3001'],
//         credentials: true,
//     },
//     namespace: '/jobs', // ✅ explicit namespace avoids collisions
// })
// export class ProgressGateway {
//     @WebSocketServer()
//     server: Server;

//     private readonly logger = new Logger(ProgressGateway.name);

//     // handleConnection(client: Socket) {
//     //     const jobId = client.handshake.query.jobId as string;
//     //     if (jobId) client.join(jobId);
//     // }

//     // handleConnection(client: Socket) {
//     //     const jobId = client.handshake.query.jobId as string;

//     //     if (!jobId) {
//     //         this.logger.warn(`Client ${client.id} connected without jobId`);
//     //         client.disconnect();
//     //         return;
//     //     }

//     //     client.join(jobId);
//     //     this.logger.log(`Client ${client.id} joined room ${jobId}`);
//     // }

//     // handleDisconnect(client: Socket) {
//     //     this.logger.log(`Client ${client.id} disconnected`);
//     // }

//     // sendProgress(jobId: string, progress: number, type: JobEventType) {
//     //     this.server.to(jobId).emit(`progress-${type}`, progress);
//     // }

//     // sendCompleted(jobId: string, data: unknown, type: JobEventType) {
//     //     this.server.to(jobId).emit(`completed-${type}`, data);
//     // }

//     // sendError(jobId: string, message: string, type: JobEventType) {
//     //     this.server.to(jobId).emit(`error-${type}`, { message });
//     // }
// }