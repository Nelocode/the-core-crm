with open("/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/scratch/app_diff.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Lines in diff containing key words:")
keywords = ["ContactModal", "Sidebar", "Dashboard", "contacts", "meetings"]
for kw in keywords:
    matches = [i for i, l in enumerate(lines) if kw in l]
    print(f"- '{kw}': {len(matches)} matches")
    if matches:
        print("  Sample matching lines:")
        for idx in matches[:5]:
            print(f"    Line {idx}: {lines[idx].strip()}")
