import type { AiProvider } from "./types";
import { heuristicProvider } from "./heuristicProvider";

/**
 * Factory for the configured AI provider. Only the heuristic provider ships in this MVP;
 * AI_PROVIDER/ANTHROPIC_API_KEY in .env.example are placeholders for wiring a real model
 * behind this same AiProvider interface without touching any calling code.
 */
export function getAiProvider(): AiProvider {
  return heuristicProvider;
}
