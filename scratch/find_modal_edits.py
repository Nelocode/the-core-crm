import re

file_path = '/Users/i2carvajal/Documents/Proyectos/The Core/src/App.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all occurrences of contact.something
matches = re.finditer(r'contact\.[a-zA-Z0-9_?.]*', content)

print("--- Occurrences of contact.<something> in App.tsx ---")
seen = set()
for m in matches:
    match_str = m.group(0)
    if match_str not in seen:
        seen.add(match_str)
        # Find line number
        line_no = content.count('\n', 0, m.start()) + 1
        print(f"Line {line_no:4d}: {match_str}")
