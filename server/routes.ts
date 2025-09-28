import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDrawRecordSchema } from "@shared/schema";
import { randomUUID } from "crypto";

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    id: string;
  }
}

interface SessionRequest extends Request {
  session: any & { id?: string };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get session ID or create new one
  app.use((req: SessionRequest, res, next) => {
    if (!req.session.id) {
      req.session.id = randomUUID();
    }
    next();
  });

  // Get draw history for current session
  app.get("/api/draw-history", async (req: SessionRequest, res) => {
    try {
      const sessionId = req.session.id;
      const history = await storage.getDrawHistory(sessionId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching draw history:", error);
      res.status(500).json({ message: "내부 서버 오류가 발생했습니다" });
    }
  });

  // Add new draw record
  app.post("/api/draw-record", async (req: SessionRequest, res) => {
    try {
      const sessionId = req.session.id;
      const recordData = insertDrawRecordSchema.parse({
        ...req.body,
        sessionId,
      });
      
      const record = await storage.addDrawRecord(recordData);
      res.json(record);
    } catch (error) {
      console.error("Error adding draw record:", error);
      res.status(500).json({ message: "추첨 기록 저장에 실패했습니다" });
    }
  });

  // Clear draw history for current session
  app.delete("/api/draw-history", async (req: SessionRequest, res) => {
    try {
      const sessionId = req.session.id;
      await storage.clearDrawHistory(sessionId);
      res.json({ message: "추첨 기록이 삭제되었습니다" });
    } catch (error) {
      console.error("Error clearing draw history:", error);
      res.status(500).json({ message: "기록 삭제에 실패했습니다" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
