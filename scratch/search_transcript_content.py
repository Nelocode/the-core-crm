import json

transcript_path = '/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/.system_generated/logs/transcript.jsonl'
with open(transcript_path, 'r', errors='ignore') as f:
    for line in f:
        try:
            step = json.loads(line)
            content = step.get('content', '')
            if 'bullet' in content.lower() or 'viñeta' in content.lower() or 'puntos' in content.lower():
                print(f"[{step.get('source')}] {content[:200]}")
        except Exception as e:
            pass
