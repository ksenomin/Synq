---
name: pdf
description: Use when the user wants to read or extract text/tables from PDF files, or mentions a .pdf file. PDF reading is the primary focus; other PDF operations (merge, split, create, forms) are optional reference.
---

# PDF Processing Guide

## Overview

This guide covers PDF processing operations with focus on **reading and extracting content** from PDFs. For OpenCode, PDF reading uses Python libraries (pypdf, pdfplumber) and command-line tools. Optional advanced features like creating PDFs, filling forms, or merging are included as reference.

**Tool Mapping for OpenCode:**
- Python code execution → `bash` tool
- Command-line tools → `bash` tool
- File reading → `read` tool

## Quick Start - Reading PDFs

```python
from pypdf import PdfReader

# Read a PDF
reader = PdfReader("document.pdf")
print(f"Pages: {len(reader.pages)}")

# Extract text
text = ""
for page in reader.pages:
    text += page.extract_text()
```

## Python Libraries for Reading

### pypdf - Basic Text Extraction

```python
from pypdf import PdfReader

reader = PdfReader("document.pdf")

# Get number of pages
print(f"Total pages: {len(reader.pages)}")

# Extract text from all pages
text = ""
for i, page in enumerate(reader.pages):
    text += f"--- Page {i+1} ---\n"
    text += page.extract_text()
    text += "\n\n"

print(text)
```

#### Extract Metadata
```python
reader = PdfReader("document.pdf")
meta = reader.metadata
print(f"Title: {meta.title}")
print(f"Author: {meta.author}")
print(f"Subject: {meta.subject}")
print(f"Creator: {meta.creator}")
```

### pdfplumber - Better Text and Table Extraction

**Recommended for:** Text with layout preservation, table extraction

```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        print(f"--- Page {i+1} ---")
        text = page.extract_text()
        print(text)
        print("\n")
```

#### Extract Tables
```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        if tables:
            print(f"Tables on page {i+1}:")
            for j, table in enumerate(tables):
                print(f"Table {j+1}:")
                for row in table:
                    print(row)
                print()
```

#### Advanced Table Extraction with Pandas
```python
import pdfplumber
import pandas as pd

with pdfplumber.open("document.pdf") as pdf:
    all_tables = []
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            if table:
                df = pd.DataFrame(table[1:], columns=table[0])
                all_tables.append(df)

# Combine all tables
if all_tables:
    combined_df = pd.concat(all_tables, ignore_index=True)
    combined_df.to_excel("extracted_tables.xlsx", index=False)
    print(combined_df)
```

## Command-Line Tools for Reading

### pdftotext (poppler-utils)
```bash
# Extract text to file
pdftotext input.pdf output.txt

# Extract text preserving layout
pdftotext -layout input.pdf output.txt

# Extract specific pages
pdftotext -f 1 -l 5 input.pdf output.txt  # Pages 1-5

# Output to stdout (pipe to read tool)
pdftotext input.pdf -
```

### pdfimages - Extract Images
```bash
# Extract all images
pdfimages -j input.pdf output_prefix

# Images saved as output_prefix-000.jpg, output_prefix-001.jpg, etc.
```

## Reading Scanned PDFs (OCR)

```python
# Requires: pip install pytesseract pdf2image
import pytesseract
from pdf2image import convert_from_path

# Convert PDF to images
images = convert_from_path('scanned.pdf')

# OCR each page
text = ""
for i, image in enumerate(images):
    text += f"--- Page {i+1} ---\n"
    text += pytesseract.image_to_string(image)
    text += "\n\n"

print(text)
```

## Quick Reference - Reading Operations

| Task | Best Tool | Code/Command |
|------|-----------|--------------|
| Extract text (simple) | pypdf | `page.extract_text()` |
| Extract text (layout) | pdfplumber | `page.extract_text()` |
| Extract tables | pdfplumber | `page.extract_tables()` |
| CLI text extraction | pdftotext | `pdftotext input.pdf output.txt` |
| Read metadata | pypdf | `reader.metadata` |
| OCR scanned PDF | pytesseract | Convert to image first |
| Extract images | pdfimages | `pdfimages -j input.pdf prefix` |

## Optional Features (Reference Only)

<details>
<summary>Merge PDFs</summary>

```python
from pypdf import PdfWriter, PdfReader

writer = PdfWriter()
for pdf_file in ["doc1.pdf", "doc2.pdf", "doc3.pdf"]:
    reader = PdfReader(pdf_file)
    for page in reader.pages:
        writer.add_page(page)

with open("merged.pdf", "wb") as output:
    writer.write(output)
```

CLI alternative:
```bash
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf
```
</details>

<details>
<summary>Split PDFs</summary>

```python
reader = PdfReader("input.pdf")
for i, page in enumerate(reader.pages):
    writer = PdfWriter()
    writer.add_page(page)
    with open(f"page_{i+1}.pdf", "wb") as output:
        writer.write(output)
```
</details>

<details>
<summary>Create PDFs (reportlab)</summary>

```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

c = canvas.Canvas("hello.pdf", pagesize=letter)
width, height = letter
c.drawString(100, height - 100, "Hello World!")
c.save()
```
</details>

<details>
<summary>Rotate Pages</summary>

```python
reader = PdfReader("input.pdf")
writer = PdfWriter()
page = reader.pages[0]
page.rotate(90)
writer.add_page(page)
with open("rotated.pdf", "wb") as output:
    writer.write(output)
```

CLI:
```bash
qpdf input.pdf output.pdf --rotate=+90:1
```
</details>

<details>
<summary>Add Watermark</summary>

```python
from pypdf import PdfReader, PdfWriter

watermark = PdfReader("watermark.pdf").pages[0]
reader = PdfReader("document.pdf")
writer = PdfWriter()

for page in reader.pages:
    page.merge_page(watermark)
    writer.add_page(page)

with open("watermarked.pdf", "wb") as output:
    writer.write(output)
```
</details>

<details>
<summary>Password Protection</summary>

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("input.pdf")
writer = PdfWriter()

for page in reader.pages:
    writer.add_page(page)

writer.encrypt("userpassword", "ownerpassword")

with open("encrypted.pdf", "wb") as output:
    writer.write(output)
```
</details>

## Common Tasks

### Extract Text from Specific Page Range
```python
from pypdf import PdfReader

reader = PdfReader("document.pdf")
start = 0  # 0-indexed
end = 5    # exclusive

text = ""
for i in range(start, min(end, len(reader.pages))):
    text += f"--- Page {i+1} ---\n"
    text += reader.pages[i].extract_text()
    text += "\n\n"

print(text)
```

### Search for Text in PDF
```python
from pypdf import PdfReader
import re

reader = PdfReader("document.pdf")
pattern = re.compile(r"your search term", re.IGNORECASE)

for i, page in enumerate(reader.pages):
    text = page.extract_text()
    if pattern.search(text):
        print(f"Found on page {i+1}")
        # Print context around match
        for line in text.split('\n'):
            if pattern.search(line):
                print(f"  {line}")
```

## Next Steps

- For advanced usage (pypdfium2, JavaScript pdf-lib), see full reference at https://github.com/anthropics/skills/blob/main/skills/pdf/REFERENCE.md
- For filling PDF forms, see https://github.com/anthropics/skills/blob/main/skills/pdf/FORMS.md
