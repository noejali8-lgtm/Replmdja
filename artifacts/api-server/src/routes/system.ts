import { Router } from "express";
import os from "os";

const router = Router();

let lastCpuInfo = os.cpus();

function getCpuUsage(): number {
  const current = os.cpus();
  let totalIdle = 0, totalTick = 0;
  for (let i = 0; i < current.length; i++) {
    const prev = lastCpuInfo[i];
    const cur  = current[i];
    const prevTotal = Object.values(prev.times).reduce((a, b) => a + b, 0);
    const curTotal  = Object.values(cur.times).reduce((a, b) => a + b, 0);
    const totalDiff = curTotal - prevTotal;
    const idleDiff  = cur.times.idle - prev.times.idle;
    totalTick += totalDiff;
    totalIdle += idleDiff;
  }
  lastCpuInfo = current;
  return totalTick === 0 ? 0 : Math.round((1 - totalIdle / totalTick) * 100);
}

router.get("/stats", (_req, res) => {
  const cpuPercent = getCpuUsage();
  const totalMem   = os.totalmem();
  const freeMem    = os.freemem();
  const usedMem    = totalMem - freeMem;
  const cpus       = os.cpus();

  res.json({
    cpu: {
      usage:  cpuPercent,
      cores:  cpus.length,
      model:  cpus[0]?.model?.split("@")[0]?.trim() ?? "Unknown",
      loadavg: os.loadavg(),
    },
    memory: {
      total:   totalMem,
      used:    usedMem,
      free:    freeMem,
      percent: Math.round((usedMem / totalMem) * 100),
    },
    uptime:   Math.round(os.uptime()),
    platform: os.platform(),
    arch:     os.arch(),
    hostname: os.hostname(),
  });
});

export default router;
