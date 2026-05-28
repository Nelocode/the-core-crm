file = "/Users/i2carvajal/Documents/Proyectos/TheCoreBack/The Core/src/App.tsx"

with open(file, "r", encoding="utf-8") as f:
    content = f.read()

terms = [
    "n8nService",
    "ocr",
    "OCR",
    "isRecording",
    "liveTranscript",
    "mediaRecorderRef",
    "ContactModal",
    "ImportWizardModal",
    "import_excel",
    "CSV",
    "processMeetingAudio",
    "n8n",
    "automatic",
    "Google",
    "apple",
    "calendar",
    "CalendarView",
    "MeetingAssistantTab",
    "NetworkMapView"
]

print("Searching more terms in backup App.tsx:")
for term in terms:
    count = content.count(term)
    print(f"- '{term}': found {count} times")
