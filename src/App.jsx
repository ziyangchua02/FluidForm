import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

  // ✅ memoized fields (ESLint fix)
  const fields = useMemo(() => ([
    { id: 'name', prompt: 'What is your full name?', type: 'text', placeholder: 'Jane Doe' },
    { id: 'email', prompt: 'What is your email address?', type: 'email', placeholder: 'you@example.com' },
    { id: 'phone', prompt: 'What is your phone number?', type: 'tel', placeholder: '+1 555 555 5555' },
    { id: 'age', prompt: 'What is your age?', type: 'number', placeholder: '30', min: 0, max: 120 },
    { id: 'message', prompt: 'Please provide your message.', type: 'textarea', placeholder: 'Write your message...' }
  ]), []);

  // ✅ stable readNext
  const readNext = useCallback(() => {
    if (currentFieldIndex < fields.length) {
      setVisibleFields([currentFieldIndex]);
      const utterance = new SpeechSynthesisUtterance(fields[currentFieldIndex].prompt);
      utterance.onend = () => guidedRecognitionRef.current?.start();
      window.speechSynthesis.speak(utterance);
    } else {
      setVisibleFields([5]);
      setIsGuidedMode(false);
    }
  }, [currentFieldIndex, fields]);

  // ✅ stable startGuidedMode
  const startGuidedMode = useCallback(() => {
    setIsGuidedMode(true);
    triggerRecognitionRef.current?.stop();
    setCurrentFieldIndex(0);
    setVisibleFields([0]);
  }, []);

  // ✅ fixed effect (ESLint happy, no infinite loop)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

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

    triggerRecognitionRef.current = triggerRecognition;
    triggerRecognition.start();

    const guidedRecognition = new SpeechRecognition();
    guidedRecognition.lang = 'en-US';

    guidedRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const field = fields[currentFieldIndex];
      setFormData(prev => ({ ...prev, [field.id]: transcript }));
      setCurrentFieldIndex(prev => prev + 1);
    };

    guidedRecognitionRef.current = guidedRecognition;

    const handleDoubleClick = (e) => {
      if (!e.target.matches('input, textarea, button, label')) {
        navigate('/big-question/1');
      }
    };

    document.addEventListener('dblclick', handleDoubleClick);

    return () => {
      triggerRecognition.stop();
      guidedRecognition.stop();
      document.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [isGuidedMode, currentFieldIndex, navigate, startGuidedMode, fields]);

  // ✅ separate effect to speak next prompt
  useEffect(() => {
    if (isGuidedMode) {
      readNext();
    }
  }, [currentFieldIndex, isGuidedMode, readNext]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.values(formData).every(val => val.trim())) {
      alert('Form submitted!');
    } else {
      alert('Please fill all fields');
    }
  };

  const handleTextareaFocus = () => {
    if (!isGuidedMode && !isListening) {
      guidedRecognitionRef.current?.start();
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="body">
            <main className="main">
              <h1 className="h1">Contact form</h1>

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
