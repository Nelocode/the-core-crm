with open("/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/scratch/app_diff.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Diff chunks matching ContactModal or similar:")
in_hunk = False
hunk_lines = []
for line in lines:
    if line.startswith("@@"):
        if any("ContactModal" in hl or "ContactCard" in hl for hl in hunk_lines):
            print("".join(hunk_lines[:30]))
            if len(hunk_lines) > 30:
                print(f"... ({len(hunk_lines)-30} more lines)\n")
        hunk_lines = [line]
    else:
        hunk_lines.append(line)

if any("ContactModal" in hl or "ContactCard" in hl for hl in hunk_lines):
    print("".join(hunk_lines[:30]))
    if len(hunk_lines) > 30:
        print(f"... ({len(hunk_lines)-30} more lines)\n")
