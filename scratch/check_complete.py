import json

log_path = "/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/.system_generated/logs/transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        if '"step_index":1726' in line or '"step_index":1730' in line:
            try:
                data = json.loads(line)
                step_idx = data.get("step_index")
                tool_calls = data.get("tool_calls", [])
                if isinstance(tool_calls, str):
                    tool_calls = json.loads(tool_calls)
                for tc in tool_calls:
                    args = tc.get("args", {})
                    if isinstance(args, str):
                        args = json.loads(args)
                    print(f"Step {step_idx}: {tc.get('name')}")
                    rc = args.get("ReplacementContent", "")
                    tc_val = args.get("TargetContent", "")
                    print(f"  ReplacementContent length: {len(rc)}")
                    print(f"  TargetContent length: {len(tc_val)}")
                    # Let's check if it ends with double quote and has no truncation suffix
                    print(f"  Ends with double quote: {rc.endswith(chr(34))}")
            except Exception as e:
                print(f"Error parsing JSON for step {step_idx}: {e}")
