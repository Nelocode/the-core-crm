with open("/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/scratch/app_diff.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

hunks = []
current_hunk = []
for line in lines:
    if line.startswith("@@"):
        if current_hunk:
            hunks.append(current_hunk)
        current_hunk = [line]
    elif current_hunk:
        current_hunk.append(line)
if current_hunk:
    hunks.append(current_hunk)

print(f"Total hunks: {len(hunks)}")

for idx, hunk in enumerate(hunks):
    header = hunk[0].strip()
    added_lines = [l for l in hunk if l.startswith("+") and not l.startswith("+++")]
    deleted_lines = [l for l in hunk if l.startswith("-") and not l.startswith("---")]
    print(f"\nHunk {idx+1}: {header}")
    print(f"  Removed {len(deleted_lines)} lines, Added {len(added_lines)} lines")
    # Print the first few removed and added lines
    if deleted_lines:
        print("  - Removed sample:")
        for l in deleted_lines[:3]:
            print(f"    {l.strip()}")
    if added_lines:
        print("  + Added sample:")
        for l in added_lines[:3]:
            print(f"    {l.strip()}")
