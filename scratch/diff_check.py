import difflib

file1 = "/Users/i2carvajal/Documents/Proyectos/TheCoreBack/The Core/src/App.tsx"
file2 = "/Users/i2carvajal/Documents/Proyectos/The Core/src/App.tsx"

with open(file1, "r", encoding="utf-8") as f1, open(file2, "r", encoding="utf-8") as f2:
    lines1 = f1.readlines()
    lines2 = f2.readlines()

print(f"Backup file: {len(lines1)} lines")
print(f"Current file: {len(lines2)} lines")

# Let's count matching/differing lines or print block-level diff
diff = list(difflib.unified_diff(lines1, lines2, fromfile="backup", tofile="current", n=3))

added = 0
deleted = 0
for line in diff:
    if line.startswith("+") and not line.startswith("+++"):
        added += 1
    elif line.startswith("-") and not line.startswith("---"):
        deleted += 1

print(f"Diff stats: +{added} lines, -{deleted} lines")

# Write full diff to a scratch file so we can view it or grep it
with open("/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/scratch/app_diff.txt", "w", encoding="utf-8") as out:
    out.writelines(diff)

print("Diff written to scratch/app_diff.txt")
