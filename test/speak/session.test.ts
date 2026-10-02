import assert from "node:assert/strict";
import { test } from "node:test";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { selectLatestAnswer } from "../../extensions/speak/session.ts";

const user = (text: string) => ({ role: "user", content: text, timestamp: 1 });
const assistant = (content: unknown[], stopReason = "stop") => ({
  role: "assistant",
  content,
  stopReason,
  timestamp: 2,
});
const text = (value: string) => ({ type: "text", text: value });

test("speaks only the ordered text blocks of the latest answer", () => {
  const result = selectLatestAnswer([
    user("question"),
    assistant([
      { type: "thinking", thinking: "private reasoning" },
      text("First part."),
      { type: "toolCall", id: "1", name: "bash", arguments: {} },
      text("Second part."),
    ]),
  ]);
  assert.deepEqual(result, { ok: true, text: "First part.\n\nSecond part." });
});

test("uses the final answer after tool calls, ignoring tool results and custom messages", () => {
  const result = selectLatestAnswer([
    user("run it"),
    assistant([text("I will run it.")], "toolUse"),
    { role: "toolResult", content: [text("tool output")] },
    assistant([text("Done: the build passed.")]),
    { role: "compactionSummary", summary: "ignored" },
  ]);
  assert.deepEqual(result, { ok: true, text: "Done: the build passed." });
});

const unusable: [string, unknown[], string][] = [
  ["an empty conversation", [], "no-turn"],
  ["assistant output with no user turn", [assistant([text("hi")])], "no-turn"],
  ["a user turn with no answer yet", [user("q")], "no-answer"],
  ["an aborted latest answer", [user("q1"), assistant([text("old answer")]), user("q2"), assistant([text("partial")], "aborted")], "not-final"],
  ["an errored latest answer", [user("q"), assistant([text("partial")], "error")], "not-final"],
  ["a truncated latest answer", [user("q"), assistant([text("cut off")], "length")], "not-final"],
  ["a tool-call-only latest answer", [user("q"), assistant([{ type: "toolCall", id: "1", name: "x", arguments: {} }], "toolUse")], "not-final"],
  ["a finished answer with no text", [user("q"), assistant([{ type: "thinking", thinking: "only thoughts" }])], "no-text"],
  ["a new user turn that is still unanswered", [user("q1"), assistant([text("old answer")]), user("q2")], "no-answer"],
];
for (const [name, messages, reason] of unusable)
  test(`reports ${reason} for ${name} and never falls back to an older turn`, () => {
    assert.deepEqual(selectLatestAnswer(messages), { ok: false, reason });
  });

test("only the active branch of a real Pi session is eligible", () => {
  const session = SessionManager.inMemory();
  const firstUser = session.appendMessage(user("question one") as never);
  session.appendMessage(assistant([text("Answer on the original branch.")]) as never);
  session.branch(firstUser);
  session.appendMessage(assistant([text("Answer on the new branch.")]) as never);

  const projected = session.buildSessionProjection();
  assert.deepEqual(selectLatestAnswer(projected.messages), {
    ok: true,
    text: "Answer on the new branch.",
  });
});
