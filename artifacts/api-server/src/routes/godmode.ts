import { Router, type Request, type Response } from "express";
import { db, godmodeRaces } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/races", async (_req: Request, res: Response) => {
  try {
    const races = await db
      .select()
      .from(godmodeRaces)
      .orderBy(desc(godmodeRaces.createdAt))
      .limit(100);
    res.json({ races });
  } catch (err) {
    console.error("godmode/races GET:", err);
    res.status(500).json({ error: "Failed to fetch races" });
  }
});

router.post("/races", async (req: Request, res: Response) => {
  try {
    const { prompt, winnerId, winnerName, winnerScore, scores, elapsed, previews } = req.body;
    if (!prompt || !winnerId || !winnerName) {
      res.status(400).json({ error: "prompt, winnerId, winnerName are required" });
      return;
    }
    const [race] = await db
      .insert(godmodeRaces)
      .values({
        prompt: String(prompt).slice(0, 1000),
        winnerId: String(winnerId),
        winnerName: String(winnerName),
        winnerScore: Number(winnerScore) || 0,
        scores: scores ?? {},
        elapsed: elapsed ?? {},
        previews: previews ?? {},
      })
      .returning();
    res.json({ race });
  } catch (err) {
    console.error("godmode/races POST:", err);
    res.status(500).json({ error: "Failed to save race" });
  }
});

router.delete("/races/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const { eq } = await import("drizzle-orm");
    await db.delete(godmodeRaces).where(eq(godmodeRaces.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete race" });
  }
});

export default router;
