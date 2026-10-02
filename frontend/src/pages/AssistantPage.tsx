import { FormEvent, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Check, CornerDownLeft, DatabaseZap, LockKeyhole, MessageCircleMore, PackageCheck, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";
import { api } from "../lib/api";

type Proposal = { id: string; status: "PENDING" | "CANCELLED" | "EXECUTED" | "EXPIRED" | "REJECTED"; movementType: "STOCK_IN" | "SALE" | "DAMAGED" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"; quantity: number; reason: string | null; beforeQuantity: number; projectedQuantity: number; expiresAt: string; product: { id: string; sku: string; name: string }; supplier: { id: string; name: string } | null; executedMovement: { id: string; beforeQuantity: number; afterQuantity: number; delta: number; occurredAt: string } | null };
type AgentReply = { version: "1.0"; requestId: string; conversationId: string; kind: "answer" | "proposal" | "refusal" | "unavailable"; message: string; citationsToToolResults: string[]; proposal?: Proposal; meta?: { intent: string; tool: string | null } };
type Message = { id: string; sender: "user" | "assistant"; text: string; kind?: AgentReply["kind"]; trace?: string; proposal?: Proposal; proposalBusy?: boolean; proposalError?: string };
const starters = ["Which products are running low?", "How many Type-C cables are in stock?", "Add 40 Type-C cables from Ali Traders"];

export function AssistantPage() {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string>();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ id: "welcome", sender: "assistant", kind: "answer", text: "Hi! I’m connected to your live StockSense data. Ask a question or request a stock change—I’ll always show a review card before anything changes." }]);
  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  async function send(event?: FormEvent, suggested?: string) {
    event?.preventDefault();
    const text = (suggested ?? input).trim();
    if (!text || sending) return;
    setInput(""); setSending(true);
    setMessages((current) => [...current, { id: crypto.randomUUID(), sender: "user", text }]);
    try {
      const reply = await api<AgentReply>("/chat/messages", { method: "POST", body: JSON.stringify({ message: text, ...(conversationId ? { conversationId } : {}) }) });
      setConversationId(reply.conversationId);
      setMessages((current) => [...current, { id: crypto.randomUUID(), sender: "assistant", text: reply.message, kind: reply.kind, trace: reply.citationsToToolResults[0], proposal: reply.proposal }]);
    } catch (error) {
      setMessages((current) => [...current, { id: crypto.randomUUID(), sender: "assistant", kind: "unavailable", text: error instanceof Error ? error.message : "The assistant is unavailable right now." }]);
    } finally { setSending(false); }
  }

  async function actOnProposal(messageId: string, proposalId: string, action: "confirm" | "cancel") {
    setMessages((current) => current.map((item) => item.id === messageId ? { ...item, proposalBusy: true, proposalError: undefined } : item));
    try {
      const result = action === "confirm"
        ? await api<{ proposal: Proposal; movement: Proposal["executedMovement"]; idempotent: boolean }>(`/ai-proposals/${proposalId}/confirm`, { method: "POST", body: "{}" })
        : { proposal: await api<Proposal>(`/ai-proposals/${proposalId}/cancel`, { method: "POST", body: "{}" }) };
      setMessages((current) => current.map((item) => item.id === messageId ? { ...item, proposal: result.proposal, proposalBusy: false, text: action === "confirm" ? "Confirmed. Stock was updated exactly once and the movement was added to history." : "Cancelled. No inventory quantity was changed." } : item));
      if (action === "confirm") await queryClient.invalidateQueries();
    } catch (error) {
      setMessages((current) => current.map((item) => item.id === messageId ? { ...item, proposalBusy: false, proposalError: error instanceof Error ? error.message : "The proposal action failed." } : item));
    }
  }

  return <div className="assistant-layout stagger-in"><section className="assistant-chat panel"><header className="assistant-chat-head"><div className="assistant-orb compact"><Bot size={28}/><span/></div><div><span>Grounded inventory agent</span><h2>StockSense AI</h2></div><em><i/> Live data</em></header><div className="chat-stream" aria-live="polite">{messages.map((message) => <article className={`chat-message ${message.sender} ${message.kind ?? ""}`} key={message.id}><span className="chat-avatar">{message.sender === "assistant" ? <Sparkles size={17}/> : <UserRound size={17}/>}</span><div><p>{message.text}</p>{message.proposal && <div className={`proposal-card ${message.proposal.status.toLowerCase()}`}><header><PackageCheck size={19}/><span><b>{message.proposal.product.name}</b><small>{message.proposal.product.sku}</small></span><em>{message.proposal.status}</em></header><div className="proposal-grid"><span>Action<strong>{message.proposal.movementType.replaceAll("_", " ")}</strong></span><span>Quantity<strong>{message.proposal.quantity}</strong></span><span>Stock preview<strong>{message.proposal.beforeQuantity} → {message.proposal.projectedQuantity}</strong></span><span>Supplier<strong>{message.proposal.supplier?.name ?? "Not required"}</strong></span></div>{message.proposal.reason && <p className="proposal-reason">Reason: {message.proposal.reason}</p>}{message.proposalError && <p className="proposal-error">{message.proposalError}</p>}<footer><small>Expires {new Intl.DateTimeFormat("en-PK", { timeStyle: "short" }).format(new Date(message.proposal.expiresAt))}</small><div><button className="proposal-cancel" disabled={message.proposal.status !== "PENDING" || message.proposalBusy} onClick={() => void actOnProposal(message.id, message.proposal!.id, "cancel")}><X size={14}/> Cancel</button><button className="proposal-confirm" disabled={message.proposal.status !== "PENDING" || message.proposalBusy} onClick={() => void actOnProposal(message.id, message.proposal!.id, "confirm")}><Check size={14}/> {message.proposalBusy ? "Working…" : "Confirm"}</button></div></footer></div>}{message.trace && <small><DatabaseZap size={12}/> Grounded result · {message.trace.slice(0, 8)}</small>}</div></article>)}{sending && <article className="chat-message assistant thinking"><span className="chat-avatar"><Sparkles size={17}/></span><div><b/><b/><b/></div></article>}</div><div className="chat-starters">{starters.map((starter) => <button key={starter} onClick={() => void send(undefined, starter)} disabled={sending}>{starter}</button>)}</div><form className="chat-composer" onSubmit={(event) => void send(event)}><MessageCircleMore size={20}/><input value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder="Ask about inventory or prepare a stock change…" aria-label="Message StockSense AI"/><button disabled={!canSend} aria-label="Send message"><CornerDownLeft size={19}/></button></form></section><aside className="assistant-side"><div className="agent-glow"><Sparkles/><span>Phase 8</span><h3>Review first. Apply once.</h3><p>The agent prepares structured changes. Only your explicit confirmation can update inventory.</p></div><div className="agent-rule"><ShieldCheck/><div><strong>Human confirmed</strong><p>Every proposed change stays pending until you confirm.</p></div></div><div className="agent-rule"><LockKeyhole/><div><strong>Owner and role checked</strong><p>Only the creator can act, with current permissions.</p></div></div><div className="agent-rule"><DatabaseZap/><div><strong>Exactly once</strong><p>Repeated confirmation returns the original movement.</p></div></div></aside></div>;
}
