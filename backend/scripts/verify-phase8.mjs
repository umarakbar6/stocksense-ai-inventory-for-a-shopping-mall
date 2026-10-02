import "../dist/config/env.js";

const [{ prisma }, { prepareProposal, cancelProposal, confirmProposal }] = await Promise.all([
  import("../dist/database/prisma.js"),
  import("../dist/proposals/proposal-service.js"),
]);

const manager = await prisma.user.findUnique({ where: { email: "manager@stocksense.local" } });
const product = await prisma.product.findUnique({ where: { sku: "ELEC-TYPEC-001" } });
const supplier = await prisma.supplier.findUnique({ where: { name: "Ali Traders" } });
if (!manager || !product || !supplier) throw new Error("Seeded Phase 8 acceptance records are missing.");

const cancelledKey = "phase8-at02-cancel-v1";
const confirmedKey = "phase8-at02-confirm-v1";
const priorConfirmed = await prisma.aiProposal.findUnique({ where: { idempotencyKey: confirmedKey } });
if (!priorConfirmed && product.quantity !== 15) throw new Error(`AT-02 requires Type-C Cable at 15 before its first run; found ${product.quantity}.`);
const quantityBeforeRun = product.quantity;

const cancelled = await prepareProposal({ actorUserId: manager.id, actorRole: manager.role, productId: product.id, supplierId: supplier.id, movementType: "STOCK_IN", quantity: 40, idempotencyKey: cancelledKey });
const afterCancel = await cancelProposal(cancelled.id, manager.id);
const quantityAfterCancel = (await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).quantity;

const prepared = await prepareProposal({ actorUserId: manager.id, actorRole: manager.role, productId: product.id, supplierId: supplier.id, movementType: "STOCK_IN", quantity: 40, idempotencyKey: confirmedKey });
const firstConfirm = await confirmProposal(prepared.id, manager.id, manager.role, "phase8-live-check-first");
const secondConfirm = await confirmProposal(prepared.id, manager.id, manager.role, "phase8-live-check-repeat");
const finalProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
const movementCount = await prisma.stockMovement.count({ where: { proposalId: prepared.id } });
const storedMovement = await prisma.stockMovement.findUniqueOrThrow({ where: { proposalId: prepared.id } });

const expectedFinal = firstConfirm.movement.afterQuantity;
const passed = afterCancel.status === "CANCELLED" && quantityAfterCancel === quantityBeforeRun && firstConfirm.proposal.status === "EXECUTED" && secondConfirm.idempotent && finalProduct.quantity === expectedFinal && movementCount === 1 && storedMovement.source === "AI" && storedMovement.actorUserId === manager.id;
console.log(JSON.stringify({ passed, cancelledStatus: afterCancel.status, cancellationChangedStock: quantityAfterCancel !== quantityBeforeRun, proposalPreview: `${prepared.beforeQuantity} -> ${prepared.projectedQuantity}`, finalQuantity: finalProduct.quantity, repeatWasIdempotent: secondConfirm.idempotent, movementCount, movementSource: storedMovement.source, actorVerified: storedMovement.actorUserId === manager.id, proposalId: prepared.id, movementId: firstConfirm.movement.id }, null, 2));
await prisma.$disconnect();
if (!passed) process.exitCode = 1;
