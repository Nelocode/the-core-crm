import re

def find_usages(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # find all lines containing <ContactAvatar
    lines = content.split('\n')
    usages = []
    for i, line in enumerate(lines):
        if '<ContactAvatar' in line:
            # get the line and the next few lines until the tag ends
            block = []
            for j in range(i, min(i+10, len(lines))):
                block.append(f"{j+1}: {lines[j]}")
                if '/>' in lines[j] or '</ContactAvatar>' in lines[j]:
                    break
            usages.append('\n'.join(block))
    return usages

print("=== CURRENT USAGES ===")
for usage in find_usages('/Users/i2carvajal/Documents/Proyectos/The Core/src/App.tsx'):
    print(usage)
    print("-" * 40)

print("\n=== BACKUP USAGES ===")
for usage in find_usages('/Users/i2carvajal/Documents/Proyectos/The Core/TheCoreBack/The Core/src/App.tsx'):
    print(usage)
    print("-" * 40)
