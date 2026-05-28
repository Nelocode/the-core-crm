import json

log_path = "/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/.system_generated/logs/transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        if '"step_index":2008' in line or '"step_index":2042' in line:
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
                    if rc.startswith('"') and rc.endswith('"'):
                        rc = json.loads(rc)
                    print("  RC starts with:", repr(rc[:400]))
                    print("  RC ends with:", repr(rc[-400:]))
            except Exception as e:
                print(e)
