---
description: Check or regenerate pi-subagents preset profiles from the ZenStudioLab seed
argument-hint: "[apply|show|edit|usage]"
---

Profiles in `~/.pi/agent/profiles/pi-subagents/*.json` are generated from `tools/subagent-profiles/presets.seed.mjs`. Run the generator from `/mnt/8CE085C2E085B2CE/Src/Tools/ZenStudioLab/pi-toolset`. Never hand-edit a generated profile, and edit the seed only when asked.

If `$1` is `edit`: run `setsid -f emacs /mnt/8CE085C2E085B2CE/Src/Tools/ZenStudioLab/pi-toolset/tools/subagent-profiles/presets.seed.mjs >/dev/null 2>&1`, confirm Emacs was launched, and stop. Do not edit the file yourself.


If `$1` is `show`: run `node -e 'const fs=require("fs"),p=require("path"),os=require("os");const d=p.join(os.homedir(),".pi/agent/profiles/pi-subagents");for(const f of fs.readdirSync(d).filter(f=>f.endsWith(".json")).sort()){const s=JSON.parse(fs.readFileSync(p.join(d,f),"utf8")).subagents;console.log(`${f.replace(/\.json$/,"")}  default=${s.defaultModel}  asyncByDefault=${s.asyncByDefault}`);for(const [r,o] of Object.entries(s.agentOverrides))console.log(`  ${r.padEnd(11)} ${o.model}  thinking=${o.thinking}${o.fast?"  fast":""}`)}'`, show its output as the report with one line per profile and one indented line per agent (agent, model, thinking level), and stop. Do not write files.

If `$1` is `usage`: run `setsid -f emacs /mnt/8CE085C2E085B2CE/Src/Tools/ZenStudioLab/pi-toolset/tools/subagent-profiles/README.md >/dev/null 2>&1`, confirm Emacs was launched, and stop.

If `$1` is not `apply`, check only:

1. Run `node tools/subagent-profiles/generate.mjs --check`.
2. Report which profiles are stale and any `unmanaged` files. Do not write. Ask whether to apply.

If `$1` is `apply`:

1. Run `node tools/subagent-profiles/generate.mjs`.
2. Report the profiles written. Then point to `/subagents-load-profile <name>` (user settings) or `/load-sub-agents <name>` (project settings), and `/subagents-models` to verify the live mapping.
