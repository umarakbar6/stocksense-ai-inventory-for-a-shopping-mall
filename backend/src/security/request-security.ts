import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../http/app-error.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const trustedOrigins = new Set([
  env.FRONTEND_ORIGIN,
  ...(env.NODE_ENV !== "production" ? ["http://127.0.0.1:5173", "http://localhost:5173"] : []),
]);

export function isTrustedBrowserRequest(method: string, origin?: string, fetchSite?: string) {
  if (safeMethods.has(method.toUpperCase())) return true;
  if (fetchSite === "cross-site") return false;
  return !origin || trustedOrigins.has(origin);
}

export const enforceTrustedOrigin: RequestHandler = (request, _response, next) => {
  if (!isTrustedBrowserRequest(request.method, request.header("origin"), request.header("sec-fetch-site"))) {
    return next(new AppError(403, "FORBIDDEN", "Cross-site state-changing requests are not allowed."));
  }
  next();
};

type Bucket = { count: number; resetAt: number };
export function rateLimit(options: { windowMs: number; max: number; scope: string }): RequestHandler {
  const buckets = new Map<string, Bucket>();
  return (request, response, next) => {
    const now = Date.now();
    if (buckets.size > 10_000) {
      for (const [storedKey, stored] of buckets) if (stored.resetAt <= now) buckets.delete(storedKey);
      if (buckets.size > 10_000) buckets.delete(buckets.keys().next().value as string);
    }
    const key = `${options.scope}:${request.ip || request.socket.remoteAddress || "unknown"}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    response.setHeader("RateLimit-Limit", options.max);
    response.setHeader("RateLimit-Remaining", Math.max(0, options.max - bucket.count));
    response.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));
    if (bucket.count > options.max) {
      response.setHeader("Retry-After", Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
      return next(new AppError(429, "RATE_LIMITED", "Too many requests. Please wait and try again."));
    }
    next();
  };
}
