import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth-middleware.js";
import { asyncHandler } from "../http/async-handler.js";
import { cancelProposal, confirmProposal, getOwnedProposal } from "./proposal-service.js";
import { rateLimit } from "../security/request-security.js";

const idSchema = z.string().uuid();
export const proposalRouter = Router();
proposalRouter.use(requireAuth);
proposalRouter.use(rateLimit({ windowMs: 60_000, max: 60, scope: "proposal" }));

proposalRouter.get("/:id", asyncHandler(async (request, response) => {
  response.json({ data: await getOwnedProposal(idSchema.parse(request.params.id), request.user!.id) });
}));

proposalRouter.post("/:id/cancel", asyncHandler(async (request, response) => {
  response.json({ data: await cancelProposal(idSchema.parse(request.params.id), request.user!.id) });
}));

proposalRouter.post("/:id/confirm", asyncHandler(async (request, response) => {
  response.json({ data: await confirmProposal(idSchema.parse(request.params.id), request.user!.id, request.user!.role, response.locals.requestId) });
}));
