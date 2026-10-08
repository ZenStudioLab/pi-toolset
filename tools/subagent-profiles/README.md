# subagent-profiles

Generates the pi-subagents preset profiles in `~/.pi/agent/profiles/pi-subagents/*.json` from one seed file.

| File | Role |
| --- | --- |
| `presets.seed.mjs` | The seed: model aliases and presets. Edit this to change profiles. |
| `generate.mjs` | Generator: reads the seed and writes one JSON profile per preset. |
| `gen-subagent-profiles.md` | The `/gen-subagent-profiles` pi prompt (symlinked into `~/.pi/agent/prompts/`). |

Generated profiles carry a `$generatedBy` marker. Never hand-edit them; change the seed and regenerate.

## Prompt usage

```
/gen-subagent-profiles           # check only: list stale profiles and unmanaged files
/gen-subagent-profiles apply     # regenerate and write the profiles
/gen-subagent-profiles show      # list every profile with its agents, models, and thinking levels
/gen-subagent-profiles edit      # open presets.seed.mjs (the seed) in Emacs
/gen-subagent-profiles usage     # open this README in Emacs
```

## CLI usage

Run from the `pi-toolset` root:

```
node tools/subagent-profiles/generate.mjs [--seed <file>] [--out <dir>] [--check]
```

- `--check` writes nothing; it reports stale profiles and exits 1 if any exist.
- `--seed` takes a `.mjs`/`.js` module (default export) or a `.json` file shaped `{ presets: { ... } }`.
- `--out` defaults to `~/.pi/agent/profiles/pi-subagents`.

Output is `written: ...` / `stale: ...` / `up to date: N profiles`, plus `unmanaged (not in seed): ...` for JSON files in the output folder that no preset produces.

## Seed format

```js
presets: {
  base:  { defaultModel: "provider/model", asyncByDefault: false,
           agents: { oracle: { model, thinking, fast } } },
  child: { extends: "base", agents: { worker: { model: "provider/other" } } },
}
```

- `extends` inherits a preset; `agents` merge per role and per field.
- A role without `model` uses the resolved preset's `defaultModel`.
- `defaultModel` is required after inheritance. Preset names match `[A-Za-z0-9][\w.-]*`.
- A preset cannot mix `claude-bridge/` and `anthropic/` models; the generator rejects it.

## After generating

Load a profile with `/subagents-load-profile <name>` (user settings) or `/load-sub-agents <name>` (project settings). Verify the live mapping with `/subagents-models`.

To view one profile in pi, type `/subagents-show-profile` and press Tab to pick a name from the list. It prints the agents, models, and thinking levels without calling any model. With no name, it prints every profile. `/subagents-check-profile <name>` also suggests names, but it probes each model, so it is slower.
