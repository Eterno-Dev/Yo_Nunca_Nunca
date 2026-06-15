import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, RefreshCw, Flame, List, Edit2, Trash2, ChevronLeft, Save } from 'lucide-react';
import { defaultQuestions } from './questions';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [view, setView] = useState('play'); // 'play', 'add', 'manage'
  const [isLoading, setIsLoading] = useState(true);
  
  // States for Add/Edit
  const [newQuestionText, setNewQuestionText] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');
  
  const [seenIndices, setSeenIndices] = useState(new Set());

  // Firestore connection
  useEffect(() => {
    const docRef = doc(db, 'game', 'state');
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setQuestions(data.questions || []);
      } else {
        // Initialize if document doesn't exist
        setDoc(docRef, { questions: defaultQuestions });
        setQuestions(defaultQuestions);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error al conectar con Firebase:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Pick a random question when questions array is ready and currentQuestion is null
  useEffect(() => {
    if (!isLoading && questions.length > 0 && currentQuestion === null && view === 'play') {
      pickNextQuestion();
    }
  }, [questions, currentQuestion, view, isLoading]);

  const saveToFirebase = async (updatedQuestions) => {
    try {
      const docRef = doc(db, 'game', 'state');
      await setDoc(docRef, { questions: updatedQuestions }, { merge: true });
    } catch (error) {
      console.error("Error guardando en Firebase:", error);
      alert("Hubo un error al guardar. Comprueba que activaste Firebase Firestore en Modo Prueba.");
    }
  };

  const pickNextQuestion = useCallback(() => {
    if (questions.length === 0) {
      setCurrentQuestion("¡No hay frases! Añade algunas para empezar.");
      return;
    }

    setIsAnimating(true);

    setTimeout(() => {
      let availableIndices = questions.map((_, i) => i).filter(i => !seenIndices.has(i));
      
      if (availableIndices.length === 0) {
        setSeenIndices(new Set());
        availableIndices = questions.map((_, i) => i);
      }

      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      
      setCurrentQuestion(questions[randomIndex]);
      setSeenIndices(prev => new Set(prev).add(randomIndex));
      setIsAnimating(false);
    }, 400);
  }, [questions, seenIndices]);

  const formatQuestion = (text) => {
    let formattedText = text.trim();
    if (!formattedText.toLowerCase().startsWith("yo nunca nunca")) {
      formattedText = `Yo nunca nunca ${formattedText}`;
    }
    if (!formattedText.endsWith(".")) {
      formattedText += ".";
    }
    return formattedText;
  };

  const handleSaveNewQuestion = () => {
    if (!newQuestionText.trim()) return;
    const formattedText = formatQuestion(newQuestionText);
    saveToFirebase([...questions, formattedText]);
    setNewQuestionText('');
    setView('play');
  };

  const handleDelete = (index) => {
    if(window.confirm("¿Estás seguro de que quieres borrar esta frase para TODO EL MUNDO?")) {
      const updated = questions.filter((_, i) => i !== index);
      saveToFirebase(updated);
      setSeenIndices(new Set());
      if (currentQuestion === questions[index]) {
        setCurrentQuestion(null);
      }
    }
  };

  const startEditing = (index, text) => {
    setEditingIndex(index);
    setEditText(text);
  };

  const handleSaveEdit = (index) => {
    if (!editText.trim()) return;
    const formattedText = formatQuestion(editText);
    const updated = [...questions];
    updated[index] = formattedText;
    saveToFirebase(updated);
    setEditingIndex(null);
    setEditText('');
    
    if (currentQuestion === questions[index]) {
       setCurrentQuestion(formattedText);
    }
  };

  if (isLoading) {
    return (
      <div className="app-container" style={{justifyContent: 'center', alignItems: 'center'}}>
        <RefreshCw size={40} className="spin" color="white" />
        <p style={{marginTop: '20px', color: 'white'}}>Conectando a la nube...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        {view === 'play' ? (
          <>
            <div className="logo">Nunca Nunca</div>
            <div className="header-actions">
              <button className="icon-btn" onClick={() => setView('manage')} aria-label="Gestionar frases">
                <List size={22} />
              </button>
              <button className="icon-btn" onClick={() => setView('add')} aria-label="Añadir frase">
                <Plus size={24} />
              </button>
            </div>
          </>
        ) : (
          <>
            <button className="icon-btn" onClick={() => setView('play')} aria-label="Volver">
              <ChevronLeft size={24} />
            </button>
            <div className="logo" style={{fontSize: '20px'}}>
              {view === 'manage' ? 'Gestionar Frases' : 'Nueva Frase'}
            </div>
            <div style={{width: 44}}></div>
          </>
        )}
      </header>

      {/* Main Content Area */}
      <main className="main-content" style={{ display: view === 'play' ? 'flex' : 'none' }}>
        <div className={`card ${isAnimating ? 'animating' : ''}`}>
          <div className="card-subtitle">
            <Flame size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Nivel Extremo
          </div>
          {currentQuestion ? (
            <h1 className="question-text">{currentQuestion}</h1>
          ) : (
            <p className="empty-state">Preparando los chupitos...</p>
          )}
        </div>
        <div className="controls">
          <button className="btn-next" onClick={pickNextQuestion} disabled={isAnimating || questions.length === 0}>
            Siguiente <RefreshCw size={20} className={isAnimating ? 'spin' : ''} />
          </button>
        </div>
      </main>

      {/* Manage View */}
      {view === 'manage' && (
        <div className="manage-view">
          <div className="list-container">
            {questions.map((q, index) => (
              <div key={index} className="list-item">
                {editingIndex === index ? (
                  <div className="edit-mode">
                    <textarea 
                      className="textarea-custom" 
                      style={{minHeight: '80px', marginBottom: '10px', fontSize: '14px'}}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="edit-actions">
                      <button className="btn-action save" onClick={() => handleSaveEdit(index)}>
                        <Save size={18} /> Guardar
                      </button>
                      <button className="btn-action cancel" onClick={() => setEditingIndex(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="list-text">{q}</p>
                    <div className="list-actions">
                      <button className="icon-btn small" onClick={() => startEditing(index, q)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-btn small danger" onClick={() => handleDelete(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {questions.length === 0 && (
              <p className="empty-state" style={{marginTop: '40px'}}>No hay frases guardadas.</p>
            )}
          </div>
        </div>
      )}

      {/* Add View */}
      {view === 'add' && (
        <div className="add-view">
          <div className="card" style={{minHeight: 'auto', padding: '30px'}}>
             <h2 className="modal-title" style={{marginBottom: '20px'}}>Escribe tu frase</h2>
             <div className="prefix-text">Yo nunca nunca...</div>
             <textarea
                className="textarea-custom"
                placeholder="he enviado un mensaje a mi ex estando de fiesta..."
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                autoFocus
             />
             <button className="btn-save" onClick={handleSaveNewQuestion}>
                Guardar Frase
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
