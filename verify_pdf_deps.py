from thefuzz import fuzz
from pypdf import PdfReader
import io

# Test Fuzzy
ratio = fuzz.ratio("Cancer", "Cancar")
print(f"Fuzz Ratio 'Cancer' vs 'Cancar': {ratio}")
if ratio > 80:
    print("Fuzzy Logic: OK")
else:
    print("Fuzzy Logic: FAIL")

# Test PyPDF Import
try:
    # Just verify we can instantiate the class or simple check
    print("PyPDF Import: OK")
except Exception as e:
    print(f"PyPDF Fail: {e}")
