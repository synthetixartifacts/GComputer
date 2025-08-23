/**
 * Type definitions for API server
 * Provides type-safe Express request/response handlers
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type {
  TestFilters,
  TestInsert,
  TestUpdate,
  ProviderFilters,
  ProviderInsert,
  ProviderUpdate,
  ModelFilters,
  ModelInsert,
  ModelUpdate,
  AgentFilters,
  AgentInsert,
  AgentUpdate,
} from './db/types.js';

/**
 * Typed async request handler
 */
export type AsyncRequestHandler<
  TParams = Record<string, string>,
  TQuery = Record<string, string>,
  TBody = unknown,
  TResponse = unknown
> = (
  req: Request<TParams, TResponse, TBody, TQuery>,
  res: Response<TResponse>,
  next: NextFunction
) => Promise<void>;

/**
 * Error response type
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  timestamp: string;
  path?: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

/**
 * Count response
 */
export interface CountResponse {
  count: number;
}

/**
 * Request param types
 */
export interface IdParam {
  id: string;
}

export interface DiscussionIdParam {
  discussionId: string;
}

/**
 * Query types with proper typing
 */
export interface LimitQuery {
  limit?: string;
}

/**
 * Async handler wrapper with proper error handling
 */
export function asyncHandler<
  TParams = Record<string, string>,
  TQuery = Record<string, string>,
  TBody = unknown,
  TResponse = unknown
>(
  fn: AsyncRequestHandler<TParams, TQuery, TBody, TResponse>
): RequestHandler<TParams, TResponse, TBody, TQuery> {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Type guard for validating numeric ID params
 */
export function parseIdParam(id: string): number {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) {
    throw new Error('Invalid ID parameter');
  }
  return parsed;
}

/**
 * Type guard for validating limit query param
 */
export function parseLimitQuery(limit: string | undefined): number | undefined {
  if (!limit) return undefined;
  const parsed = parseInt(limit, 10);
  if (isNaN(parsed) || parsed < 0) {
    throw new Error('Invalid limit parameter');
  }
  return parsed;
}