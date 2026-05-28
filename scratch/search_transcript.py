import os

transcript_path = '/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/.system_generated/logs/transcript.jsonl'
if os.path.exists(transcript_path):
    print("Transcript exists!")
    with open(transcript_path, 'r', errors='ignore') as f:
        for line_num, line in enumerate(f):
            if 'bullet' in line.lower() or 'interest' in line.lower() or 'hobbies' in line.lower():
                print(f"Line {line_num}: contains search term")
else:
    print("Transcript does not exist at", transcript_path)
