import "../dist/config/env.js";

const [{ prisma }, { prepareProposal, confirmProposal }] = await Promise.all([
  import("../dist/database/prisma.js"),
  import("../dist/proposals/proposal-service.js"),
]);

const manager = await prisma.user.findUniqueOrThrow({ where: { email: "manager@stocksense.local" } });
const staff = await prisma.user.findUniqueOrThrow({ where: { email: "staff@stocksense.local" } });
const product = await prisma.product.findUniqueOrThrow({ where: { sku: "ELEC-TYPEC-001" } });
const quantityBefore = product.quantity;

const expiredKey = "phase9-expired-v1";
let expired = await prisma.aiProposal.findUnique({ where: { idempotencyKey: expiredKey } });
let expiryRejected = expired?.status === "EXPIRED";
if (!expired) {
  const prepared = await prepareProposal({ actorUserId: manager.id, actorRole: manager.role, productId: product.id, movementType: "STOCK_IN", quantity: 1, idempotencyKey: expiredKey });
  await prisma.aiProposal.update({ where: { id: prepared.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
  try { await confirmProposal(prepared.id, manager.id, manager.role, "phase9-expiry-check"); }
  catch (error) { expiryRejected = error?.code === "PROPOSAL_EXPIRED"; }
  expired = await prisma.aiProposal.findUniqueOrThrow({ where: { id: prepared.id } });
}

let insufficientRejected = false;
try {
  await prepareProposal({ actorUserId: manager.id, actorRole: manager.role, productId: product.id, movementType: "SALE", quantity: quantityBefore + 1, idempotencyKey: "phase9-insufficient-v1" });
} catch (error) { insufficientRejected = error?.code === "INSUFFICIENT_STOCK"; }

let staffAdjustmentRejected = false;
try {
  await prepareProposal({ actorUserId: staff.id, actorRole: staff.role, productId: product.id, movementType: "ADJUSTMENT_IN", quantity: 1, reason: "unauthorized test", idempotencyKey: "phase9-staff-adjustment-v1" });
} catch (error) { staffAdjustmentRejected = error?.code === "FORBIDDEN"; }

const quantityAfter = (await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).quantity;
const insufficientCreated = await prisma.aiProposal.count({ where: { idempotencyKey: "phase9-insufficient-v1" } });
const staffCreated = await prisma.aiProposal.count({ where: { idempotencyKey: "phase9-staff-adjustment-v1" } });
const passed = expiryRejected && expired.status === "EXPIRED" && insufficientRejected && staffAdjustmentRejected && quantityAfter === quantityBefore && insufficientCreated === 0 && staffCreated === 0;
console.log(JSON.stringify({ passed, expiredStatus: expired.status, expiryRejected, insufficientRejected, staffAdjustmentRejected, stockUnchanged: quantityAfter === quantityBefore, rejectedProposalRows: insufficientCreated + staffCreated }, null, 2));
await prisma.$disconnect();
if (!passed) process.exitCode = 1;
