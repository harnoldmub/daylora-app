import { EventEmitter } from "events";
import { type Response } from "express";

class LiveService extends EventEmitter {
    private connections: Map<string, Set<Response>> = new Map();

    constructor() {
        super();
        this.setMaxListeners(0); // Unlimited listeners
    }

    /**
     * Register a new SSE connection for a specific wedding
     */
    addConnection(weddingId: string, req: any, res: Response) {
        if (!this.connections.has(weddingId)) {
            this.connections.set(weddingId, new Set());
        }

        const weddingConnections = this.connections.get(weddingId)!;
        weddingConnections.add(res);

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Initial heartbeat
        res.write(': heartbeat\n\n');

        req.on('close', () => {
            weddingConnections.delete(res);
            if (weddingConnections.size === 0) {
                this.connections.delete(weddingId);
            }
        });
    }

    /**
     * Broadcast an event to all connected clients for a wedding
     */
    broadcast(weddingId: string, type: string, payload: any) {
        const weddingConnections = this.connections.get(weddingId);
        if (!weddingConnections) return;

        const data = JSON.stringify({ type, payload, timestamp: new Date() });
        const message = `event: message\ndata: ${data}\n\n`;

        weddingConnections.forEach(res => {
            try {
                res.write(message);
            } catch (err) {
                console.error("Error writing to SSE connection:", err);
            }
        });
    }
}

export const liveService = new LiveService();
