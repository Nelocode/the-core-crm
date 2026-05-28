import json

log_path = "/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/.system_generated/logs/transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        if "Executive Detail Modal" in line or "activeDetailTab" in line or "Dossier" in line:
            try:
                data = json.loads(line)
                if data.get("source") == "MODEL" and "tool_calls" not in data:
                    continue
                tool_calls = data.get("tool_calls", [])
                if isinstance(tool_calls, str):
                    tool_calls = json.loads(tool_calls)
                for tc in tool_calls:
                    if "App.tsx" in tc.get("args", {}).get("TargetFile", ""):
                        print(f"Step {data.get('step_index')}: {tc.get('name')}")
                        rc = tc.get("args", {}).get("ReplacementContent", "")
                        print("  ReplacementContent starts with:", repr(rc[:150]))
                        print("  ReplacementContent ends with:", repr(rc[-150:]))
                        tc_val = tc.get("args", {}).get("TargetContent", "")
                        print("  TargetContent starts with:", repr(tc_val[:100]))
            except Exception as e:
                pass
