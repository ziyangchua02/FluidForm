# FluidForm

FluidForm is a full-stack web app that extracts structured information from uploaded PDF forms using OCR.

#Overview

Frontend: React app for uploading forms and displaying extracted data

Backend: FastAPI service that processes PDFs, performs OCR, and parses key fields

OCR: Uses Tesseract to extract text from scanned documents

#Tech Stack

Frontend: React, React Router

Backend: FastAPI, Python

OCR & Parsing: pytesseract, pdf2image, Pillow

API Communication: REST with CORS added for local development

#Features

Upload PDF forms

Convert PDFs to images

Extract text via OCR

Parse key information (e.g. email)

Simple local development setup

Backend: 
pip install -r requirements.txt
uvicorn app:app --reload

Frontend:

npm install
npm start

Frontend runs on http://localhost:3000 and communicates with the FastAPI backend.

#Status:

Early prototype / experimental build.

Software is live at: [https://fluid-form-two.vercel.app/]








