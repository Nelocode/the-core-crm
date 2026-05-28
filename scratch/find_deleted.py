with open("/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/scratch/app_diff.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

deleted_blocks = []
current_block = []
for line in lines:
    if line.startswith("@@"):
        if current_block:
            deleted_blocks.append(current_block)
            current_block = []
    elif line.startswith("-") and not line.startswith("---"):
        current_block.append(line)

print(f"Total deleted blocks: {len(deleted_blocks)}")
for idx, block in enumerate(deleted_blocks):
    print(f"\nBlock {idx+1}: {len(block)} lines removed")
    # Print the lines in this block
    for l in block[:20]:
        print(f"  {l.strip()}")
    if len(block) > 20:
        print("  ...")
