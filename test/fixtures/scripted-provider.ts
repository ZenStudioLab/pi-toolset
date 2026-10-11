import { createAssistantMessageEventStream, type AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Test-only, offline provider: a JSON user prompt becomes one real Bash call. */
export default function scriptedProvider(pi: ExtensionAPI): void {
  pi.registerCommand("border-test-theme", {
    description: "Test-only session theme switch",
    handler: async (name, ctx) => {
      const result = ctx.ui.setTheme(name.trim());
      if (!result.success) throw new Error(result.error);
    },
  });
  pi.registerProvider("border-test", {
    api: "border-test-api",
    apiKey: "test-only",
    baseUrl: "http://localhost:1/unused",
    models: [{
      id: "scripted", name: "Offline border test", reasoning: false, input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000, maxTokens: 1024,
    }],
    streamSimple(model, context) {
      const stream = createAssistantMessageEventStream();
      const last = context.messages.at(-1);
      const isCall = last?.role === "user";
      const prompt = last?.role === "user"
        ? typeof last.content === "string" ? last.content : last.content.map((part) => part.type === "text" ? part.text : "").join("")
        : "{}";
      const message: AssistantMessage = {
        role: "assistant", api: model.api, provider: model.provider, model: model.id,
        content: isCall
          ? [{ type: "toolCall", id: `bash-${Date.now()}`, name: "bash", arguments: JSON.parse(prompt) }]
          : [{ type: "text", text: "verified" }],
        stopReason: isCall ? "toolUse" : "stop", timestamp: Date.now(),
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
      };
      stream.push({ type: "done", reason: isCall ? "toolUse" : "stop", message });
      stream.end(message);
      return stream;
    },
  });
}
