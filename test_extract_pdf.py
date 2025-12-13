from reportlab.pdfgen import canvas
import requests
import os

# 1. Generate Mock PDF
pdf_filename = "mock_medical_report.pdf"
c = canvas.Canvas(pdf_filename)
c.drawString(100, 800, "Medical Laboratory Report")
c.drawString(100, 780, "Patient Name: John Doe")
c.drawString(100, 760, "Patient Age: 55 years old")
c.drawString(100, 740, "Smoking History: 20 Pack Years")
c.drawString(100, 720, "Radon Exposure: High Level Detected")
c.drawString(100, 700, "Notes: Patient shows signs of fatigue.")
c.save()

print(f"✅ Generated {pdf_filename}")

# 2. Upload to Server
url = "http://127.0.0.1:8000/extract-pdf"
files = {'file': open(pdf_filename, 'rb')}
data = {'type': 'lung'}

print(f"🚀 Sending request to {url}...")
try:
    response = requests.post(url, files=files, data=data)
    if response.status_code == 200:
        print("✅ Server Response Success!")
        print(response.json())
    else:
        print(f"❌ Server Error {response.status_code}: {response.text}")
except Exception as e:
    print(f"❌ Connection Failed: {e}")
