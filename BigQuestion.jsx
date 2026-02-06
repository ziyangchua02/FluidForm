import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './styles.css';

// this is created to enlarge the questions and make it one at a time for better focus 

const fields = [
  { id: 'name', prompt: 'What is your full name?', type: 'text', placeholder: 'Jane Doe' },
  { id: 'email', prompt: 'What is your email address?', type: 'email', placeholder: 'you@example.com' },
  { id: 'phone', prompt: 'What is your phone number?', type: 'tel', placeholder: '+1 555 555 5555' },
  { id: 'age', prompt: 'What is your age?', type: 'number', placeholder: '30', min: 0, max: 120 },
  { id: 'message', prompt: 'Please provide your message.', type: 'textarea', placeholder: 'Write your message...' }
];

function BigQuestion() {
  const { index } = useParams();
  const questionIndex = parseInt(index) - 1; 
  const navigate = useNavigate();
  const [answer, setAnswer] = useState('');

  const currentField = fields[questionIndex];
  
  // Clear the local answer whenever the route index changes so the
  // input/textarea is empty for the next question.
  useEffect(() => {
    setAnswer('');
  }, [index]);

  const handleNext = () => {
    if (questionIndex < fields.length - 1) {
      navigate(`/big-question/${questionIndex + 2}`); 
    } else {
      navigate('/');
    }
  };

  if (!currentField) {
    return <div>Question not found</div>;
  }

  return (
    <div className="big-question">
      <h1>{currentField.prompt}</h1>
      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        {currentField.type === 'textarea' ? (
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={currentField.placeholder}
            required
            autoFocus
            rows="4"
          />
        ) : (
          <input
            type={currentField.type}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={currentField.placeholder}
            min={currentField.min}
            max={currentField.max}
            required
            autoFocus
          />
        )}
        <button type="submit">{questionIndex < fields.length - 1 ? 'Next' : 'Finish'}</button>
      </form>
    </div>
  );
}

export default BigQuestion;