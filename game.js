document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const mainMenu = document.getElementById('main-menu');
    const gameScreen = document.getElementById('game-screen');
    const gameBoard = document.getElementById('gameBoard');
    const movesDisplay = document.getElementById('moves');
    const timeDisplay = document.getElementById('time');
    const restartBtn = document.getElementById('restart');
    const menuBtns = document.querySelectorAll('.menu-btn');
    const backToMenuBtn = document.getElementById('back-to-menu');
    
    // Sonidos
    const flipSound = new Audio('sounds/giro.mp3');
    const matchSound = new Audio('sounds/merge.mp3');
    const errorSound = new Audio('sounds/error.mp3');
    const menuSound = new Audio('sounds/menu.mp3');
    
    // Configurar sonido del menú
    menuSound.loop = true; // El sonido se repite
    menuSound.volume = 0.3; // Volumen más bajo para música de fondo
    
    // Variables del juego
    let cards = [];
    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let moves = 0;
    let timer;
    let seconds = 0;
    let currentLevel = 'easy';
    const levels = {
        easy: { pairs: 8, columns: 4 },
        medium: { pairs: 10, columns: 5 },
        hard: { pairs: 18, columns: 6 }
    };
    const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦄'];
    
    // Inicializar juego
    function initGame() {
        // Detener la música del menú cuando comienza el juego
        menuSound.pause();
        menuSound.currentTime = 0;
        
        // Limpiar tablero y resetear variables
        gameBoard.innerHTML = '';
        moves = 0;
        seconds = 0;
        movesDisplay.textContent = moves;
        timeDisplay.textContent = seconds;
        clearInterval(timer);
        
        // Configurar nivel actual
        const levelConfig = levels[currentLevel];
        
        // Crear pares de cartas
        const selectedEmojis = emojis.slice(0, levelConfig.pairs);
        cards = [...selectedEmojis, ...selectedEmojis];
        
        // Barajar cartas
        cards = shuffleArray(cards);
        
        // Configurar grid
        gameBoard.style.gridTemplateColumns = `repeat(${levelConfig.columns}, 100px)`;
        
        // Crear elementos de cartas
        cards.forEach((emoji, index) => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.emoji = emoji;
            card.dataset.index = index;
            card.addEventListener('click', flipCard);
            gameBoard.appendChild(card);
        });
        
        // Iniciar temporizador
        timer = setInterval(() => {
            seconds++;
            timeDisplay.textContent = seconds;
        }, 1000);
    }
    
    // Barajar array (Fisher-Yates algorithm)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Reproducir sonido
    function playSound(sound) {
        // Clonar el sonido para permitir reproducción simultánea
        const soundClone = sound.cloneNode();
        soundClone.volume = 0.5; // Ajustar volumen
        soundClone.play();
    }
    
    // Voltear carta
    function flipCard() {
        if (lockBoard) return;
        if (this === firstCard) return;
        if (this.classList.contains('matched')) return;
        
        // Reproducir sonido de giro
        playSound(flipSound);
        
        this.classList.add('flipped');
        this.textContent = this.dataset.emoji;
        
        if (!hasFlippedCard) {
            // Primera carta
            hasFlippedCard = true;
            firstCard = this;
            return;
        }
        
        // Segunda carta
        secondCard = this;
        moves++;
        movesDisplay.textContent = moves;
        checkForMatch();
    }
    
    // Verificar coincidencia
    function checkForMatch() {
        const isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;
        
        if (isMatch) {
            // Reproducir sonido de coincidencia
            playSound(matchSound);
            disableCards();
        } else {
            unflipCards();
        }
    }
    
    // Deshabilitar cartas coincidentes
    function disableCards() {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        
        resetBoard();
    }
    
    // Volver a voltear cartas no coincidentes
    function unflipCards() {
        lockBoard = true;
        
        // Esperar un momento para que el jugador vea las cartas antes de voltearlas
        setTimeout(() => {
            // Reproducir sonido de error justo antes de voltear las cartas
            playSound(errorSound);
            
            // Pequeña pausa para que el sonido se reproduzca antes de voltear
            setTimeout(() => {
                firstCard.classList.remove('flipped');
                secondCard.classList.remove('flipped');
                firstCard.textContent = '';
                secondCard.textContent = '';
                
                resetBoard();
            }, 200); // Esperar 200ms después del sonido
        }, 800); // Esperar 800ms para que el jugador vea las cartas
    }
    
    // Reiniciar tablero después de cada turno
    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
        
        // Verificar si el juego ha terminado
        if (document.querySelectorAll('.card:not(.matched)').length === 0) {
            clearInterval(timer);
            
            // Usar SweetAlert para mostrar mensaje de victoria
            setTimeout(() => {
                let difficultyText = '';
                switch(currentLevel) {
                    case 'easy': difficultyText = 'fácil'; break;
                    case 'medium': difficultyText = 'medio'; break;
                    case 'hard': difficultyText = 'difícil'; break;
                }
                
                Swal.fire({
                    title: '¡Felicidades!',
                    html: `Has completado el nivel <strong>${difficultyText}</strong> en:<br>
                          <b>${moves}</b> movimientos<br>
                          <b>${seconds}</b> segundos`,
                    icon: 'success',
                    confirmButtonText: 'Volver al menú',
                    showCancelButton: true,
                    cancelButtonText: 'Jugar de nuevo',
                }).then((result) => {
                    if (result.isConfirmed) {
                        showMainMenu();
                    } else {
                        initGame();
                    }
                });
            }, 300);
        }
    }
    
    // Mostrar menú principal
    function showMainMenu() {
        clearInterval(timer);
        mainMenu.classList.remove('hidden');
        gameScreen.classList.add('hidden');
        
        // Reproducir música del menú
        menuSound.play().catch(error => {
            console.log('La reproducción automática fue bloqueada por el navegador. Por favor, habilita la reproducción automática o haz clic para continuar.');
        });
    }
    
    // Iniciar juego con nivel seleccionado
    function startGame(level) {
        currentLevel = level;
        mainMenu.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        initGame();
    }
    
    // Event Listeners para botones del menú
    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            startGame(btn.dataset.level);
        });
    });
    
    // Event listener para reiniciar juego
    restartBtn.addEventListener('click', initGame);
    
    // Event listener para volver al menú
    backToMenuBtn.addEventListener('click', showMainMenu);
    
    // Mostrar el menú principal al cargar la página
    showMainMenu();
    
    // Agregar botón de sonido en el menú principal para iniciar reproducción (solución para políticas de autoplay)
    const soundToggle = document.createElement('button');
    soundToggle.id = 'sound-toggle';
    soundToggle.classList.add('sound-btn');
    soundToggle.innerHTML = '🔊';
    soundToggle.title = 'Activar/Desactivar sonido';
    mainMenu.appendChild(soundToggle);
    
    // Event listener para botón de sonido
    soundToggle.addEventListener('click', () => {
        if (menuSound.paused) {
            menuSound.play();
            soundToggle.innerHTML = '🔊';
        } else {
            menuSound.pause();
            soundToggle.innerHTML = '🔇';
        }
    });
});