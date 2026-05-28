import json

log_path = "/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/.system_generated/logs/transcript.jsonl"

steps_to_inspect = [1726, 1730]

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        step_idx = data.get("step_index")
        if step_idx in steps_to_inspect:
            print(f"\n=================== STEP {step_idx} ===================")
            tool_calls = data.get("tool_calls", [])
            if isinstance(tool_calls, str):
                tool_calls = json.loads(tool_calls)
            for tc in tool_calls:
                print(f"Tool: {tc.get('name')}")
                args = tc.get("args", {})
                if isinstance(args, str):
                    args = json.loads(args)
                target = args.get("TargetContent", "")
                replacement = args.get("ReplacementContent", "")
                print(f"Target lines range: {args.get('StartLine')} - {args.get('EndLine')}")
                print("--- TARGET ---")
                print(target)
                print("--- REPLACEMENT ---")
                print(replacement)
