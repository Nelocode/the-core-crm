file = "/Users/i2carvajal/Documents/Proyectos/TheCoreBack/The Core/src/App.tsx"

with open(file, "r", encoding="utf-8") as f:
    content = f.read()

terms = [
    "NetworkMapView",
    "selectedCategory",
    "getCategoryLabel",
    "activeDetailTab",
    "handleInteractionsChange",
    "handleNotesChange",
    "circular",
    "gauge",
    "concentric",
    "glow",
    "Briefing IA",
    "Información",
    "Historial",
    "Reunión",
    "onNotesChange",
    "onInteractionsChange",
    "AIBriefingCard"
]

print("Searching terms in backup App.tsx:")
for term in terms:
    count = content.count(term)
    print(f"- '{term}': found {count} times")
