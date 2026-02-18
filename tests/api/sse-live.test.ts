import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";

class TestLiveService extends EventEmitter {
  private connections: Map<string, Set<any>> = new Map();

  constructor() {
    super();
    this.setMaxListeners(0);
  }

  addConnection(weddingId: string, req: any, res: any) {
    if (!this.connections.has(weddingId)) {
      this.connections.set(weddingId, new Set());
    }
    this.connections.get(weddingId)!.add(res);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(": heartbeat\n\n");

    req.on("close", () => {
      this.connections.get(weddingId)?.delete(res);
      if (this.connections.get(weddingId)?.size === 0) {
        this.connections.delete(weddingId);
      }
    });
  }

  broadcast(weddingId: string, type: string, payload: any) {
    const conns = this.connections.get(weddingId);
    if (!conns) return;

    const data = JSON.stringify({ type, payload, timestamp: new Date() });
    const message = `event: message\ndata: ${data}\n\n`;

    conns.forEach((res) => {
      try {
        res.write(message);
      } catch {}
    });
  }

  getConnectionCount(weddingId: string) {
    return this.connections.get(weddingId)?.size || 0;
  }
}

function createMockResponse() {
  const headers: Record<string, string> = {};
  const chunks: string[] = [];
  return {
    headers,
    chunks,
    setHeader(key: string, value: string) {
      headers[key] = value;
    },
    write(chunk: string) {
      chunks.push(chunk);
      return true;
    },
  };
}

function createMockRequest() {
  const emitter = new EventEmitter();
  return {
    on: emitter.on.bind(emitter),
    emit: emitter.emit.bind(emitter),
  };
}

describe("SSE Live Service", () => {
  let service: TestLiveService;

  beforeEach(() => {
    service = new TestLiveService();
  });

  describe("Connection management", () => {
    it("CASE: registers a new SSE connection", () => {
      const req = createMockRequest();
      const res = createMockResponse();

      service.addConnection("wedding-1", req, res);
      expect(service.getConnectionCount("wedding-1")).toBe(1);
    });

    it("CASE: sets correct SSE headers", () => {
      const req = createMockRequest();
      const res = createMockResponse();

      service.addConnection("wedding-1", req, res);

      expect(res.headers["Content-Type"]).toBe("text/event-stream");
      expect(res.headers["Cache-Control"]).toBe("no-cache");
      expect(res.headers["Connection"]).toBe("keep-alive");
    });

    it("CASE: sends initial heartbeat", () => {
      const req = createMockRequest();
      const res = createMockResponse();

      service.addConnection("wedding-1", req, res);
      expect(res.chunks[0]).toBe(": heartbeat\n\n");
    });

    it("CASE: removes connection on close", () => {
      const req = createMockRequest();
      const res = createMockResponse();

      service.addConnection("wedding-1", req, res);
      expect(service.getConnectionCount("wedding-1")).toBe(1);

      req.emit("close");
      expect(service.getConnectionCount("wedding-1")).toBe(0);
    });

    it("CASE: handles multiple connections per wedding", () => {
      const req1 = createMockRequest();
      const res1 = createMockResponse();
      const req2 = createMockRequest();
      const res2 = createMockResponse();

      service.addConnection("wedding-1", req1, res1);
      service.addConnection("wedding-1", req2, res2);

      expect(service.getConnectionCount("wedding-1")).toBe(2);
    });
  });

  describe("Broadcasting", () => {
    it("CASE: broadcasts to all connections for a wedding", () => {
      const req1 = createMockRequest();
      const res1 = createMockResponse();
      const req2 = createMockRequest();
      const res2 = createMockResponse();

      service.addConnection("wedding-1", req1, res1);
      service.addConnection("wedding-1", req2, res2);

      service.broadcast("wedding-1", "contribution", { amount: 5000, donorName: "Paul" });

      expect(res1.chunks.length).toBe(2);
      expect(res2.chunks.length).toBe(2);

      const message1 = res1.chunks[1];
      expect(message1).toContain("event: message");
      expect(message1).toContain('"type":"contribution"');
      expect(message1).toContain('"donorName":"Paul"');
    });

    it("CASE: does not broadcast to other weddings", () => {
      const req1 = createMockRequest();
      const res1 = createMockResponse();
      const req2 = createMockRequest();
      const res2 = createMockResponse();

      service.addConnection("wedding-1", req1, res1);
      service.addConnection("wedding-2", req2, res2);

      service.broadcast("wedding-1", "contribution", { amount: 5000 });

      expect(res1.chunks.length).toBe(2);
      expect(res2.chunks.length).toBe(1);
    });

    it("CASE: handles broadcast to non-existent wedding", () => {
      expect(() => {
        service.broadcast("nonexistent", "test", {});
      }).not.toThrow();
    });

    it("CASE: broadcast message format is valid SSE", () => {
      const req = createMockRequest();
      const res = createMockResponse();

      service.addConnection("wedding-1", req, res);
      service.broadcast("wedding-1", "joke", { text: "Ha ha!" });

      const message = res.chunks[1];
      expect(message).toMatch(/^event: message\ndata: .+\n\n$/);

      const dataLine = message.split("\n")[1];
      const jsonStr = dataLine.replace("data: ", "");
      const parsed = JSON.parse(jsonStr);
      expect(parsed.type).toBe("joke");
      expect(parsed.payload.text).toBe("Ha ha!");
      expect(parsed.timestamp).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    it("CASE: connection cleanup when all clients disconnect", () => {
      const req1 = createMockRequest();
      const res1 = createMockResponse();
      const req2 = createMockRequest();
      const res2 = createMockResponse();

      service.addConnection("wedding-1", req1, res1);
      service.addConnection("wedding-1", req2, res2);

      req1.emit("close");
      req2.emit("close");

      expect(service.getConnectionCount("wedding-1")).toBe(0);
    });

    it("CASE: handles write error gracefully", () => {
      const req = createMockRequest();
      let callCount = 0;
      const res = {
        setHeader: vi.fn(),
        write: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount > 1) {
            throw new Error("Connection reset");
          }
          return true;
        }),
      };

      service.addConnection("wedding-1", req, res);

      expect(() => {
        service.broadcast("wedding-1", "test", {});
      }).not.toThrow();
    });
  });
});
