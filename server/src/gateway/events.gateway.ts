import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization?.replace('Bearer ', '') ?? '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.userId = payload.sub as string;
      client.data.orgId = payload.orgId as string;
      client.data.role = payload.role as string;

      // Tham gia room theo orgId — broadcasts sẽ gửi tới cả org
      void client.join(`org:${payload.orgId}`);
      // Tham gia room cá nhân
      void client.join(`user:${payload.sub}`);

      this.logger.log(`Client connected: ${client.id} (user ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { ts: Date.now() });
  }

  // ── Broadcast helpers (called from other services) ───────────────────────

  /** Phát sự kiện tới toàn bộ user trong cùng org */
  broadcastToOrg(orgId: string, event: string, data: unknown) {
    this.server.to(`org:${orgId}`).emit(event, data);
  }

  /** Phát sự kiện tới một user cụ thể */
  broadcastToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // ── Domain events ────────────────────────────────────────────────────────

  emitApprovalUpdate(orgId: string, payload: {
    workflowId: string;
    documentId: string;
    documentType: string;
    status: string;
    approverId?: string;
  }) {
    this.broadcastToOrg(orgId, 'approval:updated', payload);
  }

  emitInvoiceStatusChange(orgId: string, payload: {
    invoiceId: string;
    invoiceNumber: string;
    status: string;
  }) {
    this.broadcastToOrg(orgId, 'invoice:status_changed', payload);
  }

  emitPoStatusChange(orgId: string, payload: {
    poId: string;
    poNumber: string;
    status: string;
  }) {
    this.broadcastToOrg(orgId, 'po:status_changed', payload);
  }

  emitBudgetAlert(orgId: string, payload: {
    allocationId: string;
    costCenterId: string;
    message: string;
  }) {
    this.broadcastToOrg(orgId, 'budget:alert', payload);
  }

  emitGrnUpdate(orgId: string, payload: {
    grnId: string;
    grnNumber: string;
    status: string;
  }) {
    this.broadcastToOrg(orgId, 'grn:updated', payload);
  }
}
