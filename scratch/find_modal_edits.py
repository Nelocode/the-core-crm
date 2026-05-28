import json

log_path = "/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/.system_generated/logs/transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            if isinstance(tool_calls, str):
                tool_calls = json.loads(tool_calls)
            for tc in tool_calls:
                name = tc.get("name")
                args = tc.get("args", {})
                if isinstance(args, str):
                    args = json.loads(args)
                target = args.get("TargetFile", "")
                if "App.tsx" in target:
                    tc_val = args.get("TargetContent", "")
                    if "Executive Detail Modal" in tc_val or "expandedContact" in tc_val:
                        print(f"Step {data.get('step_index')}: {name}")
                        print("  TargetContent:")
                        print(tc_val[:200])
                        print("  ReplacementContent:")
                        rc = args.get("ReplacementContent", "")
                        print(rc[:400])
                        print("...")
        except Exception as e:
            pass
