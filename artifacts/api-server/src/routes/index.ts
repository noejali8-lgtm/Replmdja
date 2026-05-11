import { Router, type IRouter } from "express";
import healthRouter from "./health";
import anthropicRouter from "./anthropic/index";
import openrouterRouter from "./openrouter";
import agentsRouter from "./agents";
import swarmRouter from "./swarm";
import memoryRouter from "./memory";
import workersRouter from "./workers";
import pluginsRouter from "./plugins";
import providersRouter from "./providers";
import securityRouter from "./security";
import federationRouter from "./federation";
import goapRouter from "./goap";
import mcpRouter from "./mcp";
import multiChatRouter from "./multi-chat";
import godmodeRouter from "./godmode";
import runRouter from "./run";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/anthropic", anthropicRouter);
router.use("/openrouter", openrouterRouter);
router.use("/agents", agentsRouter);
router.use("/swarm", swarmRouter);
router.use("/memory", memoryRouter);
router.use("/workers", workersRouter);
router.use("/plugins", pluginsRouter);
router.use("/providers", providersRouter);
router.use("/security", securityRouter);
router.use("/federation", federationRouter);
router.use("/goap", goapRouter);
router.use("/mcp", mcpRouter);
router.use("/multi-chat", multiChatRouter);
router.use("/godmode", godmodeRouter);
router.use("/run", runRouter);

export default router;
