import json

log_path = "/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/.system_generated/logs/transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        if "AIBriefingCard" in line:
            try:
                data = json.loads(line)
                if data.get("source") != "MODEL" or "tool_calls" not in data:
                    continue
                tool_calls = data["tool_calls"]
                if isinstance(tool_calls, str):
                    tool_calls = json.loads(tool_calls)
                for tc in tool_calls:
                    args = tc.get("args", {})
                    if isinstance(args, str):
                        args = json.loads(args)
                    target = args.get("TargetFile", "")
                    if "App.tsx" in target:
                        print(f"Step {data.get('step_index')}: {tc.get('name')}")
                        rc = args.get("ReplacementContent", "")
                        print("  RC starts with:", repr(rc[:150]))
                        tc_val = args.get("TargetContent", "")
                        print("  TC starts with:", repr(tc_val[:100]))
            except:
                pass
