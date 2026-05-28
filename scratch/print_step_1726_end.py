import json

log_path = "/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/.system_generated/logs/transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        if '"step_index":1726' in line:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            if isinstance(tool_calls, str):
                tool_calls = json.loads(tool_calls)
            for tc in tool_calls:
                args = tc.get("args", {})
                if isinstance(args, str):
                    args = json.loads(args)
                rc = args.get("ReplacementContent", "")
                print("Last 300 chars of RC:")
                print(repr(rc[-300:]))
