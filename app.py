from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pdf2image import convert_from_bytes
from PIL import Image
import pytesseract
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_email(text):
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else ""

def extract_phone(text):
    match = re.search(r"(\+?\d[\d\s\-]{7,}\d)", text)
    return match.group(0) if match else ""

def extract_age(text):
    match = re.search(r"\b([1-9][0-9]?)\b", text)
    return match.group(1) if match else ""

def extract_name(text):
    lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 3]
    return lines[0] if lines else ""


@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    pdf_bytes = await file.read()

    # pdf to image
    images = convert_from_bytes(pdf_bytes)
    if not images:
        return {}

    # OCR scan first page to extract text 
    text = pytesseract.image_to_string(images[0])

    # extract fields that the forms require  
    data = {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "age": extract_age(text),
        "message": ""
    }

    return data
