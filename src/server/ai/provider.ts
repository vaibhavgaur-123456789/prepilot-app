import Anthropic from "@anthropic-ai/sdk";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Provider-agnostic interface. Swap the implementation without touching the coach. */
export interface AIService {
  readonly name: string;
  available(): boolean;
  complete(system: string, messages: ChatTurn[]): Promise<string>;
}

export class AIUnavailableError extends Error {}

class AnthropicProvider implements AIService {
  readonly name = "anthropic";
  private client: Anthropic | null = null;

  available() {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async complete(system: string, messages: ChatTurn[]): Promise<string> {
    if (!this.available()) throw new AIUnavailableError("No API key configured");
    this.client ??= new Anthropic({ timeout: 60_000, maxRetries: 2 });
    try {
      // Server-side refusal fallbacks are on by default: a policy decline is re-run on a fallback model in the same call.
      const response = await this.client.beta.messages.create({
        model: process.env.AI_MODEL || "claude-opus-5",
        max_tokens: 4000, // coach answers are deliberately short
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system,
        messages,
      } as Parameters<Anthropic["beta"]["messages"]["create"]>[0] & { fallbacks: "default" });
      const msg = response as Anthropic.Beta.BetaMessage;
      if (msg.stop_reason === "refusal") throw new AIUnavailableError("Declined by the model");
      const text = msg.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (!text) throw new AIUnavailableError("Empty response");
      return text;
    } catch (error) {
      if (error instanceof AIUnavailableError) throw error;
      if (error instanceof Anthropic.AuthenticationError) throw new AIUnavailableError("Invalid API key");
      if (error instanceof Anthropic.RateLimitError) throw new AIUnavailableError("Rate limited");
      if (error instanceof Anthropic.APIError) throw new AIUnavailableError(`API error ${error.status}`);
      throw new AIUnavailableError("Network error");
    }
  }
}

export function getAIService(): AIService | null {
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  if (provider === "anthropic") {
    const p = new AnthropicProvider();
    return p.available() ? p : null;
  }
  return null; // "rule-based" or unknown → the coach uses its deterministic engine
}
