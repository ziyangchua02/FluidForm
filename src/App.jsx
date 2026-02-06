import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './styles.css';
import BigQuestion from './BigQuestion';

function App() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    message: ''
  });

  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [visibleFields, setVisibleFields] = useState([0, 1, 2, 3, 4, 5]);

  const triggerRecognitionRef = useRef(null);
  const guidedRecognitionRef = useRef(null);
  const messageTextareaRef = useRef(null);

  // placeholder text lol
  const fields = [
    { id: 'name', prompt: 'What is your full name?', type: 'text', placeholder: 'Jane Doe' },
    { id: 'email', prompt: 'What is your email address?', type: 'email', placeholder: 'you@example.com' },
    { id: 'phone', prompt: 'What is your phone number?', type: 'tel', placeholder: '+1 555 555 5555' },
    { id: 'age', prompt: 'What is your age?', type: 'number', placeholder: '30', min: 0, max: 120 },
    { id: 'message', prompt: 'Please provide your message.', type: 'textarea', placeholder: 'Write your message...' }
  ];

  // voice part, can consider as AI i guess

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const triggerRecognition = new SpeechRecognition();
      triggerRecognition.continuous = true;
      triggerRecognition.interimResults = false;
      triggerRecognition.lang = 'en-US';

      triggerRecognition.onstart = () => setIsListening(true);
      triggerRecognition.onend = () => {
        setIsListening(false);
        if (!isGuidedMode) triggerRecognition.start();
      };

      triggerRecognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        if (
          transcript.includes('i need help') ||
          transcript.includes('help reading the form')
        ) {
          startGuidedMode();
        }
      };

      triggerRecognition.onerror = (e) => console.error('Trigger error:', e.error);
      triggerRecognitionRef.current = triggerRecognition;
      triggerRecognition.start();

      const guidedRecognition = new SpeechRecognition();
      guidedRecognition.continuous = false;
      guidedRecognition.interimResults = false;
      guidedRecognition.lang = 'en-US';

      guidedRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const field = fields[currentFieldIndex];
        setFormData(prev => ({ ...prev, [field.id]: transcript }));
        setCurrentFieldIndex(prev => prev + 1);
        readNext();
      };

      guidedRecognition.onerror = (e) => console.error('Guided error:', e.error);
      guidedRecognitionRef.current = guidedRecognition;
    }

    const handleDoubleClick = (e) => {
      if (!e.target.matches('input, textarea, button, label')) {
        navigate('/big-question/1');
      }
    };

    document.addEventListener('dblclick', handleDoubleClick);

    return () => {
      triggerRecognitionRef.current?.stop();
      guidedRecognitionRef.current?.stop();
      document.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [isGuidedMode, currentFieldIndex]);

  // guides u through the form step by step - like holding hands so sweet

  const startGuidedMode = () => {
    setIsGuidedMode(true);
    triggerRecognitionRef.current?.stop();
    setCurrentFieldIndex(0);
    setVisibleFields([0]);
    readNext();
  };

  const readNext = () => {
    if (currentFieldIndex < fields.length) {
      setVisibleFields([currentFieldIndex]);
      const utterance = new SpeechSynthesisUtterance(fields[currentFieldIndex].prompt);
      utterance.onend = () => guidedRecognitionRef.current?.start();
      window.speechSynthesis.speak(utterance);
    } else {
      setVisibleFields([5]);
      setIsGuidedMode(false);
    }
  };

  // upload pdf to cheat ur way thru

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const pdfFormData = new FormData();
    pdfFormData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/extract', {
        method: 'POST',
        body: pdfFormData
      });

      const extracted = await res.json();

      setFormData(prev => ({
        ...prev,
        name: extracted.name || '',
        email: extracted.email || '',
        phone: extracted.phone || '',
        age: extracted.age || '',
        message: extracted.message || ''
      }));

      window.speechSynthesis.speak(
        new SpeechSynthesisUtterance('Form filled from document.')
      );
    } catch (err) {
      console.error(err);
      alert('Failed to extract data from PDF');
    }
  };

  // form handling lor boring stuff 

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.values(formData).every(val => val.trim())) {
      const utterance = new SpeechSynthesisUtterance(formData.message);
      utterance.onend = () => alert('Form submitted!');
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Please fill all fields');
    }
  };

  const handleTextareaFocus = () => {
    if (!isGuidedMode && !isListening) {
      guidedRecognitionRef.current?.start();
    }
  };

  // the html part so u can see the form duh

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="body">
            <main className="main">
              <h1 className="h1">Contact form</h1>
              <p className="p">
                Say "I need help reading the form" or upload a PDF to auto-fill.
              </p>

              {/* PDF UPLOAD */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Upload PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="pdf-input"
                  id="pdfInput"
                />
                <button
                  type="button"
                  className="button"
                  onClick={() => document.getElementById('pdfInput').click()}
                >
                  Choose PDF File
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="formDiv"
                    style={{ display: visibleFields.includes(index) ? 'block' : 'none' }}
                  >
                    <label className="label" htmlFor={field.id}>
                      {field.id.charAt(0).toUpperCase() + field.id.slice(1)}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        className="input"
                        id={field.id}
                        name={field.id}
                        rows="4"
                        required
                        placeholder={field.placeholder}
                        value={formData[field.id]}
                        onChange={handleInputChange}
                        onFocus={handleTextareaFocus}
                        ref={messageTextareaRef}
                      />
                    ) : (
                      <input
                        className="input"
                        id={field.id}
                        name={field.id}
                        type={field.type}
                        required
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        value={formData[field.id]}
                        onChange={handleInputChange}
                      />
                    )}
                  </div>
                ))}

                <div style={{ display: visibleFields.includes(5) ? 'block' : 'none' }}>
                  <button className="button" type="submit">
                    Submit
                  </button>
                </div>
              </form>
            </main>
          </div>
        }
      />
      <Route path="/big-question/:index" element={<BigQuestion />} />
    </Routes>
  );
}

export default App;
