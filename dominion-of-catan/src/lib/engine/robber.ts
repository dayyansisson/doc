/**
 * Robber module — re-exports and orchestrates robber-related logic.
 * The actual implementation lives in production.ts.
 * This module provides the high-level robber resolution sequences.
 */

export { moveRobber, applyRobberCoinWipe, applyMilitiaSteal } from './production.ts';
