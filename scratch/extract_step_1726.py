import json

log_path = "/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/.system_generated/logs/transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if data.get("step_index") == 1726:
            tool_calls = data.get("tool_calls", [])
            if isinstance(tool_calls, str):
                tool_calls = json.loads(tool_calls)
            for tc in tool_calls:
                args = tc.get("args", {})
                if isinstance(args, str):
                    args = json.loads(args)
                replacement = args.get("ReplacementContent", "")
                
                with open("/Users/i2carvajal/Documents/Proyectos/The Core/scratch/step1726_rc.txt", "w", encoding="utf-8") as out:
                    out.write(replacement)
                print("Step 1726 RC extracted to scratch/step1726_rc.txt")
                
                target = args.get("TargetContent", "")
                with open("/Users/i2carvajal/Documents/Proyectos/The Core/scratch/step1726_target.txt", "w", encoding="utf-8") as out:
                    out.write(target)
                print("Step 1726 Target extracted to scratch/step1726_target.txt")
