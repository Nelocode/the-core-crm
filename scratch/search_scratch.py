import os

directory = '/Users/i2carvajal/.gemini/antigravity/brain/b051ceda-f8df-495a-9e5e-b894281da78b/scratch'
for filename in os.listdir(directory):
    if filename.endswith('.txt') or filename.endswith('.json') or filename.endswith('.resolved') or filename.endswith('.py'):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', errors='ignore') as f:
            content = f.read()
        if 'bullet' in content.lower() or 'keyinterests' in content.lower():
            print(f"Found in {filename}")
