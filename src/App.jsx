import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, RefreshCw, Flame, List, Edit2, Trash2, ChevronLeft, Save, Download, Upload } from 'lucide-react';
import { defaultQuestions } from './questions';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [view, setView] = useState('play'); // 'play', 'add', 'manage'
  
  // States for Add/Edit
  const [newQuestionText, setNewQuestionText] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');
  
  const [seenIndices, setSeenIndices] = useState(new Set());
  const fileInputRef = useRef(null);

  // Initialize questions from local storage or defaults on first load
  useEffect(() => {
    const savedQuestions = localStorage.getItem('yoNuncaQuestions');
    if (savedQuestions) {
      setQuestions(JSON.parse(savedQuestions));
    } else {
      setQuestions(defaultQuestions);
      localStorage.setItem('yoNuncaQuestions', JSON.stringify(defaultQuestions));
    }
  }, []);

  // Pick a random question when questions array is ready and currentQuestion is null
  useEffect(() => {
    if (questions.length > 0 && currentQuestion === null && view === 'play') {
      pickNextQuestion();
    }
  }, [questions, currentQuestion, view]);

  const saveToStorage = (updatedQuestions) => {
    setQuestions(updatedQuestions);
    localStorage.setItem('yoNuncaQuestions', JSON.stringify(updatedQuestions));
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
    saveToStorage([...questions, formattedText]);
    setNewQuestionText('');
    setView('play');
  };

  const handleDelete = (index) => {
    if(window.confirm("¿Estás seguro de que quieres borrar esta frase?")) {
      const updated = questions.filter((_, i) => i !== index);
      saveToStorage(updated);
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
    saveToStorage(updated);
    setEditingIndex(null);
    setEditText('');
    
    if (currentQuestion === questions[index]) {
       setCurrentQuestion(formattedText);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(questions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yo-nunca-preguntas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedQuestions = JSON.parse(event.target.result);
        if (Array.isArray(importedQuestions) && importedQuestions.length > 0 && typeof importedQuestions[0] === 'string') {
          if (window.confirm(`Se han encontrado ${importedQuestions.length} frases. Esto sobrescribirá tus frases actuales. ¿Continuar?`)) {
            saveToStorage(importedQuestions);
            setSeenIndices(new Set());
            setCurrentQuestion(null);
            alert("Frases importadas correctamente.");
          }
        } else {
          alert("El archivo no tiene un formato válido de preguntas.");
        }
      } catch (err) {
        alert("Error al leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

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
            {view === 'manage' ? (
              <div className="header-actions">
                <button className="icon-btn small" onClick={handleExport} aria-label="Exportar" title="Exportar JSON">
                  <Download size={18} />
                </button>
                <button className="icon-btn small" onClick={handleImportClick} aria-label="Importar" title="Importar JSON">
                  <Upload size={18} />
                </button>
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{display: 'none'}} 
                />
              </div>
            ) : (
              <div style={{width: 44}}></div>
            )}
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
             <textarea
                className="textarea-custom"
                placeholder="Ej: he enviado un mensaje a mi ex estando de fiesta..."
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
