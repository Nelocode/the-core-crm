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

# Write all hunk summaries to a file so we can view it
with open("/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/scratch/hunks_summary.txt", "w", encoding="utf-8") as out:
    for idx, hunk in enumerate(hunks):
        header = hunk[0].strip()
        added_lines = [l for l in hunk if l.startswith("+") and not l.startswith("+++")]
        deleted_lines = [l for l in hunk if l.startswith("-") and not l.startswith("---")]
        out.write(f"\nHunk {idx+1}: {header}\n")
        out.write(f"  Removed {len(deleted_lines)} lines, Added {len(added_lines)} lines\n")
        out.write("  Removed:\n")
        for l in deleted_lines:
            out.write(f"    {l}")
        out.write("  Added:\n")
        for l in added_lines:
            out.write(f"    {l}")
        out.write("-" * 80 + "\n")

print("Hunks summary written to scratch/hunks_summary.txt")
