import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // Certifique-se de importar seus estilos

const TIME_CHALLENGE = 6; // segundos
const QUANTITY_TIMES = 3; // vezes
const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // Gera um array com todas as letras do alfabeto

const App = () => {
  const [isStart, setIsStart] = useState(false);
  const [currentSequence, setCurrentSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [currentPositionTyping, setCurrentPositionTyping] = useState(0);
  const [currentProgBar, setCurrentProgBar] = useState(100);
  const [timerId, setTimerId] = useState(null);
  const [bestScores, setBestScores] = useState([]);

  const badResultRef = useRef(null);
  const goodResultRef = useRef(null);
  const containerChallengeRef = useRef(null);
  const progBarRef = useRef(null);
  const inputKeysRef = useRef([]);

  const Wrong = new Audio('./sound/errou.mp3');
  const Correct = new Audio('./sound/correto.mp3');
  const Press = new Audio('./sound/pressionou.mp3');
  Wrong.volume = 0.70;
  Correct.volume = 0.70;
  Press.volume = 0.40;

  useEffect(() => {
    const loadBestScores = () => {
      const scores = JSON.parse(localStorage.getItem('bestScores')) || [];
      setBestScores(scores);
    };

    loadBestScores();
  }, []);

  useEffect(() => {
    const handleEventKey = (event) => {
      const letterInput = event.key.toUpperCase();
      if (isStart && LETTERS.includes(letterInput) && userInput.length < 8) {
        const newUserInput = [...userInput, letterInput];
        setUserInput(newUserInput);
        inputKeysRef.current.forEach((e, i) => {
          if (i - 1 === currentPositionTyping) {
            e.classList.add('current_key');
          } else {
            e.classList.remove('current_key');
          }
        });

        if (newUserInput.every((e, i) => e === currentSequence[i])) {
          Press.play();
          inputKeysRef.current[currentPositionTyping].classList.add('key-input-right');
          setCurrentPositionTyping(currentPositionTyping + 1);
          if (newUserInput.length === 8) {
            clearInterval(timerId);
            Correct.play();
            goodResultRef.current.style.display = 'flex';
            containerChallengeRef.current.style.display = 'none';
            handleGameEnd();
          }
        } else {
          Wrong.play();
          handleGameEnd();
        }
      } else {
        if (isStart) {
          Wrong.play();
          handleGameEnd();
          goodResultRef.current.style.display = 'flex';
          containerChallengeRef.current.style.display = 'none';
          startNewSequence();
        }
      }
    };

    window.addEventListener('keydown', handleEventKey);

    return () => {
      window.removeEventListener('keydown', handleEventKey);
    };
  }, [isStart, userInput, currentSequence, currentPositionTyping, timerId]);

  const startNewSequence = () => {
    const newSequence = getCodeSequence();
    setCurrentSequence(newSequence);
    inputKeysRef.current.forEach((key, index) => {
      key.textContent = newSequence[index];
    });
  };

  const getCodeSequence = () => {
    return new Array(8).fill().map(() => getRandomLetter(LETTERS));
  };

  const getRandomLetter = (arr) => {
    const min = 0;
    const max = arr.length - 1;
    return arr[Math.floor(Math.random() * (max - min + 1) + min)];
  };

  const startStopGame = () => {
    setIsStart(!isStart);
    if (!isStart) {
      badResultRef.current.style.display = 'none';
      goodResultRef.current.style.display = 'none';
      containerChallengeRef.current.style.display = 'grid';
      startNewSequence();
      resetChallenge();
      timerBar();
      inputKeysRef.current[0].classList.add('current_key');
    } else {
      resetGame();
    }
  };

  const resetChallenge = () => {
    progBarRef.current.style.backgroundColor = '#a3ef52';
    setCurrentProgBar(100);
    progBarRef.current.style.width = '100%';
    setCurrentPositionTyping(0);
    clearInterval(timerId);
    inputKeysRef.current.forEach(e => e.classList.remove('current_key'));
  };

  const resetGame = () => {
    setCurrentSequence([]);
    setUserInput([]);
    resetChallenge();
    inputKeysRef.current.forEach(key => key.classList.remove('key-input-right'));
    inputKeysRef.current.forEach((key, index) => {
      key.textContent = '';
    });
  };

  const timerBar = () => {
    const id = setInterval(() => {
      setCurrentProgBar((prevProgBar) => {
        if (prevProgBar < 0) {
          clearInterval(id);
          badResultRef.current.style.display = 'flex';
          containerChallengeRef.current.style.display = 'none';
          resetGame();
          return prevProgBar;
        }
        if (prevProgBar > 30 && prevProgBar < 60) {
          progBarRef.current.style.backgroundColor = '#F58002';
        }
        if (prevProgBar <= 30) {
          progBarRef.current.style.backgroundColor = '#FF3E24';
        }
        progBarRef.current.style.width = `${prevProgBar - 1}%`;
        return prevProgBar - 1;
      });
    }, 53);
    setTimerId(id);
  };

  const handleGameEnd = () => {
    // Verifica se o usuário obteve uma pontuação alta e a adiciona ao ranking local
    if (userInput.length === 8 && userInput.every((e, i) => e === currentSequence[i])) {
      const newScore = { date: new Date().toLocaleString(), score: userInput.length };
      const updatedScores = [...bestScores, newScore].sort((a, b) => b.score - a.score).slice(0, 5);
      setBestScores(updatedScores);
      localStorage.setItem('bestScores', JSON.stringify(updatedScores));
    }
  };

  const handleRestart = () => {
    setIsStart(false);
    resetGame();
    startNewSequence();
  };

  return (
    <div className="app">
      <button onClick={startStopGame} className={isStart ? 'button-stop' : 'button-start'}>
        {isStart ? 'Stop' : 'Start'}
      </button>
      <button onClick={handleRestart} className="button-restart">
        Restart
      </button>
      <div className="container_challenge" ref={containerChallengeRef}>
        <div className="container_challenge_title">💣 Digite a sequência correta do código</div>
        <div className="container_challenge_code-input">
          <div className="progressive_bar">
            <div className="current_bar" ref={progBarRef}></div>
          </div>
          <div className="input_row">
            {Array(8).fill().map((_, i) => (
              <div key={i} className="key-input" ref={el => inputKeysRef.current[i] = el}></div>
            ))}
          </div>
        </div>
      </div>
      <div className="bad_result" ref={badResultRef}>
        🔴 Código Errado.
      </div>
      <div className="good_result" ref={goodResultRef}>
        🟢 Código Certo.
      </div>
      <div className="best_scores">
        <h3>Best Scores</h3>
        <ul>
          {bestScores.map((score, index) => (
            <li key={index}>
              <strong>{score.date}</strong>: {score.score}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;