import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { authRouter } from "./auth/auth-routes.js";
import { env } from "./config/env.js";
import { errorHandler } from "./http/error-handler.js";
import { requestId } from "./http/request-id.js";
import { inventoryRouter } from "./inventory/inventory-routes.js";
import { productRouter } from "./products/product-routes.js";
import { referenceRouter } from "./reference/reference-routes.js";
import { reportRouter } from "./reports/report-routes.js";
import { chatRouter } from "./agent/chat-routes.js";
import { internalAgentToolRouter } from "./agent/internal-tool-routes.js";
import { proposalRouter } from "./proposals/proposal-routes.js";
import { enforceTrustedOrigin } from "./security/request-security.js";
import { AppError } from "./http/app-error.js";

export const app = express();
const allowedOrigins = new Set([
  env.FRONTEND_ORIGIN,
  ...(env.NODE_ENV !== "production" ? ["http://127.0.0.1:5173", "http://localhost:5173"] : []),
]);

app.disable("x-powered-by");
app.use(helmet());
app.use(requestId);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    callback(new AppError(403, "FORBIDDEN", "Origin is not allowed by StockSense CORS policy."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());
app.use(enforceTrustedOrigin);

app.get("/api/v1/health", (_request, response) => {
  response.json({
    data: {
      service: "stocksense-backend",
      status: "ok",
      phase: 11,
      timezone: env.APP_TIMEZONE,
    },
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/inventory", inventoryRouter);
app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/reference", referenceRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/ai-proposals", proposalRouter);
app.use("/internal/v1/agent-tools", internalAgentToolRouter);

app.use((_request, response) => {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested API route does not exist.",
      requestId: response.locals.requestId,
    },
  });
});

app.use(errorHandler);

