import { type Response } from "express";

class SupportChatService {
  private userConnections = new Map<string, Set<Response>>();
  private adminConnections = new Set<Response>();

  private setupSse(req: any, res: Response, onClose: () => void) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(": connected\n\n");

    const heartbeat = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 20_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      onClose();
    });
  }

  addUserConnection(userId: string, req: any, res: Response) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    const connections = this.userConnections.get(userId)!;
    connections.add(res);

    this.setupSse(req, res, () => {
      connections.delete(res);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    });
  }

  addAdminConnection(req: any, res: Response) {
    this.adminConnections.add(res);
    this.setupSse(req, res, () => {
      this.adminConnections.delete(res);
    });
  }

  private emit(targets: Iterable<Response>, event: string, payload: unknown) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of Array.from(targets)) {
      try {
        res.write(message);
      } catch {
        // Ignore broken SSE pipes; close handler cleans up.
      }
    }
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    const targets = this.userConnections.get(userId);
    if (!targets) return;
    this.emit(targets, event, payload);
  }

  emitToAdmins(event: string, payload: unknown) {
    if (this.adminConnections.size === 0) return;
    this.emit(this.adminConnections, event, payload);
  }
}

export const supportChatService = new SupportChatService();
