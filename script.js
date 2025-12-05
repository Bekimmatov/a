// --- Sozlamalar ---
let position = 0;
const STEP = 50;
const WIN_LIMIT = 300;

let teamLeft, teamRight;
// Yangi: Toʻgʻri javobni saqlash strukturasi (matn)
let quizAnswers = { left: '', right: '' }; 
let gameActive = false;

// 🇺🇿 Geografiya bo'yicha savollar va javoblar bazasi (Oʻzbek tilida)
const quizDatabase = [
    // --- Umumiy Geografiya (Davlatlar, Poytaxtlar) ---
    { 
        question: "Qaysi davlat 'Quyosh chiqayotgan yurt' deb nomlanadi?", 
        correct: "Yaponiya", 
        options: ["Xitoy", "Koreya", "Yaponiya", "Tailand", "Hindiston", "Avstraliya"] 
    },
    { 
        question: "Uzunligi boʻyicha dunyodagi eng katta daryo qaysi?", 
        correct: "Nil", 
        options: ["Amzonka", "Volga", "Missisipi", "Nil", "Yanszi", "Kongo"] 
    },
    { 
        question: "Dunyodagi eng baland choʻqqi qaysi?", 
        correct: "Jomolungma (Everest)", 
        options: ["K2", "Kilimanjaro", "Mak-Kinli", "Jomolungma (Everest)", "Elbrus", "Akonkagua"] 
    },
    { 
        question: "Kanadaning poytaxti qaysi shahar?", 
        correct: "Ottava", 
        options: ["Toronto", "Vankuver", "Monreal", "Ottava", "Kalgari", "Kvebek"] 
    },
    { 
        question: "Qaysi qit'a aholi soni bo'yicha eng kichik hisoblanadi (Antarktidani hisobga olmaganda)?", 
        correct: "Avstraliya", 
        options: ["Shimoliy Amerika", "Janubiy Amerika", "Avstraliya", "Yevropa", "Afrika", "Osiyo"] 
    },
    
    // --- Tabiiy Geografiya (Okeanlar, Iqlim) ---
    { 
        question: "Dunyo okeanlarining eng chuqur joyi qayerda joylashgan?", 
        correct: "Mariana botigʻi", 
        options: ["Puerto-Riko botigʻi", "Yava botigʻi", "Mariana botigʻi", "Gʻarbiy Yevropa", "Berring boʻgʻozi", "Qizil dengiz"] 
    },
    { 
        question: "Yer yuzasining necha foizini suv egallaydi?", 
        correct: "Taxminan 71%", 
        options: ["Taxminan 50%", "Taxminan 65%", "Taxminan 71%", "Taxminan 80%", "Taxminan 90%", "Taxminan 55%"] 
    },
    { 
        question: "Quyosh nurlari tik tushadigan joylarga xos boʻlgan iqlim turi?", 
        correct: "Ekvatorial iqlim", 
        options: ["Moʻtadil iqlim", "Subtropik iqlim", "Ekvatorial iqlim", "Subarktik iqlim", "Tropik iqlim", "Kontinental iqlim"] 
    },
    { 
        question: "Yupiter sayyorasi qanday nom bilan mashhur?", 
        correct: "Gaz giganti", 
        options: ["Muz giganti", "Qizil sayyora", "Yer guruhidagi sayyora", "Gaz giganti", "Quyosh", "Kometalar oilasi"] 
    },
    
    // --- Siyosiy Geografiya (Poytaxtlar, hududlar) ---
    { 
        question: "Afrikadagi eng katta davlat qaysi?", 
        correct: "Jazoir", 
        options: ["Sudan", "Nigeriya", "Misr", "Kongo", "Jazoir", "Liviya"] 
    },
    { 
        question: "Yevropadagi 'Appenin yarimoroli'da joylashgan davlat?", 
        correct: "Italiya", 
        options: ["Ispaniya", "Gretsiya", "Turkiya", "Italiya", "Germaniya", "Portugaliya"] 
    },
    { 
        question: "Rossiya Federatsiyasi va AQShni ajratib turuvchi boʻgʻoz?", 
        correct: "Berring boʻgʻozi", 
        options: ["Gibraltar boʻgʻozi", "Sut boʻgʻozi", "Berring boʻgʻozi", "Panama kanali", "Suesh kanali", "Dardanell"] 
    },

    // --- Oʻzbekiston Geografiyasi ---
    { 
        question: "Oʻzbekiston Respublikasining maydoni necha kv.km?", 
        correct: "448,900 kv.km", 
        options: ["300,000 kv.km", "448,900 kv.km", "500,000 kv.km", "400,000 kv.km", "550,000 kv.km", "350,000 kv.km"] 
    },
    { 
        question: "Oʻzbekistondagi eng baland choʻqqi qaysi?", 
        correct: "Hazrati Sulton", 
        options: ["Choʻlponota", "Qorjantov", "Hazrati Sulton", "Beldersoy", "Gʻazalkent", "Toshkent"] 
    }
];

// 🔊 Musiqa elementini aniqlash
const backgroundMusic = document.getElementById("background-music");


// =========================================================
// --- HIMOYALASH LOGIKASI (Oʻzgarishsiz qoladi) ---
// =========================================================
document.addEventListener('contextmenu', event => { event.preventDefault(); });
(function() {
    let devtoolsOpen = false;
    let threshold = 160; 

    function checkDevTools() {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;

        if (widthDiff > threshold || heightDiff > threshold || (widthDiff > 20 && heightDiff > 20)) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                gameActive = false;
                backgroundMusic.pause();
                alert("Kod tekshirishga ruxsat yoʻq! Oʻyin toʻxtatildi.");
            }
        } else {
            devtoolsOpen = false;
        }
        setTimeout(checkDevTools, 500);
    }
    checkDevTools();
})();


// Boshlash
document.getElementById("startBtn").onclick = () => {
    if (!gameActive) {
        teamLeft = document.getElementById("nameLeft").value || "1-Jamoa";
        teamRight = document.getElementById("nameRight").value || "2-Jamoa";
        
        document.getElementById("headerLeft").innerText = teamLeft;
        document.getElementById("headerRight").innerText = teamRight;
        
        document.getElementById("startScreen").style.display = "none";
        
        const arenaWinnerDisplay = document.getElementById("arenaWinnerDisplay");
        if (arenaWinnerDisplay) arenaWinnerDisplay.style.display = "none";
        
        const blueGif = document.getElementById("blueWinGif");
        const redGif = document.getElementById("redGif");
        if (blueGif) blueGif.style.display = 'none';
        if (redGif) redGif.style.display = 'none';
        
        position = 0;
        updateRope();
        
        startCountdown();
    }
};

// --- ORTGA SANASHNI BOSHLASH ---
function startCountdown() {
    let count = 3;
    const cd = document.getElementById("countdown");
    cd.style.display = "block";
    cd.classList.remove("go"); 
    
    backgroundMusic.currentTime = 0; 
    backgroundMusic.play().catch(e => {
        console.log("Musiqani boshlashning iloji boʻlmadi.");
    });
    
    let timer = setInterval(() => {
        if(count > 0) {
            cd.innerText = count;
            count--;
        } else {
            cd.innerText = "BOSHLA!";
            cd.classList.add("go"); 
            clearInterval(timer);
            gameActive = true;
            setTimeout(() => {
                cd.style.display = "none";
                generateQuizProblem('left'); 
                generateQuizProblem('right'); 
            }, 800);
        }
    }, 1000);
}

// =========================================================
// --- TEST LOGIKASI ---
// =========================================================

// Massivni aralashtirish funksiyasi (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 🧠 SAVOL TUZISH VA VARIANTLARNI KOʻRSATISH
function generateQuizProblem(side) {
    if (!gameActive) return;

    const problemEl = document.getElementById(side + "Problem");
    const keypadEl = document.getElementById(side + "QuizKeypad");
    
    // Savolni tasodifiy tanlash
    const randomIndex = Math.floor(Math.random() * quizDatabase.length);
    const quiz = quizDatabase[randomIndex];

    // Savolni koʻrsatish
    problemEl.innerText = quiz.question; // Savol.
    quizAnswers[side] = quiz.correct; // Toʻgʻri javobni saqlash

    // Variantlarni aralashtirish
    const shuffledOptions = shuffleArray([...quiz.options]);

    // Variantlarni HTMLga joylash
    keypadEl.innerHTML = ''; 
    shuffledOptions.slice(0, 6).forEach(option => { // Koʻpi bilan 6 variant
        const btn = document.createElement('button');
        btn.classList.add('quiz-btn');
        btn.innerText = option;
        
        // Test tugmasini bosganda javobni tekshirish
        btn.onclick = () => checkQuizAnswer(side, option);
        // Sensorli ekranlar uchun (oldingidek)
        btn.ontouchend = (e) => {
            e.preventDefault();
            checkQuizAnswer(side, option);
        };
        
        keypadEl.appendChild(btn);
    });
}

// 📝 JAVOBNI TEKSHIRISH (Xato boʻlganda yangi savol chiqadi)
function checkQuizAnswer(side, selectedOption) {
    if (!gameActive) return;

    const keypadEl = document.getElementById(side + "QuizKeypad");
    const problemEl = document.getElementById(side + "Problem");
    const isCorrect = (selectedOption === quizAnswers[side]);
    
    // Barcha tugmalarni vaqtinchalik oʻchirish (qayta bosishni oldini olish uchun)
    keypadEl.querySelectorAll('.quiz-btn').forEach(btn => btn.disabled = true);
    
    // Javobni belgilash
    let selectedBtn = null;
    keypadEl.querySelectorAll('.quiz-btn').forEach(btn => {
        if (btn.innerText === selectedOption) {
            selectedBtn = btn;
        }
    });

    if (isCorrect) {
        // --- TOʻGʻRI JAVOB LOGIKASI ---
        if (selectedBtn) {
            selectedBtn.style.backgroundColor = "#4caf50"; // Yashil
            selectedBtn.style.color = "white";
        }
        
        problemEl.style.backgroundColor = "#2e7d32"; // Toʻq yashil
        
        // Arqonni siljitish
        if(side === 'left') position -= STEP;
        else position += STEP;
        
        updateRope();

        setTimeout(() => {
            // Animatsiyadan keyin qayta boshlash
            problemEl.style.backgroundColor = (side === 'left' ? '#3f51b5' : '#b42444'); // Eski rangni qaytarish
            keypadEl.querySelectorAll('.quiz-btn').forEach(btn => btn.disabled = false); // Tugmalarni yoqish
            generateQuizProblem(side);
            checkWin();
        }, 800);

    } else {
        // --- XATO JAVOB LOGIKASI (YANGI) ---
        if (selectedBtn) {
            selectedBtn.classList.add("shake-input");
            selectedBtn.style.backgroundColor = "#e53935"; // Qizil
            selectedBtn.style.color = "white";
        }
        
        // ❌ ARQONNI ORTGA SILJITISH (1/3 qadam)
        if(side === 'left') position += (STEP / 3); 
        else position -= (STEP / 3);
        updateRope();
        
        setTimeout(() => {
            // Eski rangni qaytarish
            if (selectedBtn) {
                selectedBtn.classList.remove("shake-input");
                selectedBtn.style.backgroundColor = "#e0f7fa";
                selectedBtn.style.color = "black";
            }
            keypadEl.querySelectorAll('.quiz-btn').forEach(btn => btn.disabled = false); // Tugmalarni yoqish
            
            // 🔥 DARHOL YANGI SAVOL CHIQARISH
            generateQuizProblem(side); 
            checkWin(); 
        }, 1000);
    }
}


// --- updateRope va checkWin logikasi oʻzgarishsiz qoladi ---
function updateRope() {
    const container = document.getElementById("imageContainer");
    container.style.transform = `translateX(calc(-50% + ${position}px))`;
}

function checkWin() {
    if(Math.abs(position) >= WIN_LIMIT) {
        gameActive = false;
        backgroundMusic.pause();

        const arenaWinnerDisplay = document.getElementById("arenaWinnerDisplay");
        const winnerNameEl = document.getElementById("winnerNameArena");
        const blueGif = document.getElementById("blueWinGif");
        const redGif = document.getElementById("redWinGif");

        let winner = position < 0 ? teamLeft : teamRight;
        
        if (winnerNameEl) winnerNameEl.innerText = winner;
        
        // GIF RASMNI TANLASH LOGIKASI
        if (position < 0) {
            if (blueGif) blueGif.style.display = 'block';
            if (redGif) redGif.style.display = 'none';
        } else {
            if (blueGif) blueGif.style.display = 'none';
            if (redGif) redGif.style.display = 'block';
        }
        
        if (arenaWinnerDisplay) arenaWinnerDisplay.style.display = "flex";
        if (arenaWinnerDisplay) triggerConfetti(arenaWinnerDisplay); 
    }
}

// --- KONFETTI (SALYUT) ANIMATSIYASI (ARENA ICHIDA) ---
function triggerConfetti(container) {
    const colors = ['#f44336', '#2196f3', '#ffeb3b', '#4caf50', '#9c27b0'];
    const count = 30; 
    
    container.querySelectorAll('.confetti-arena').forEach(c => c.remove()); 

    const arenaRect = container.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
        const c = document.createElement('div');
        c.classList.add('confetti-arena');
        
        c.style.top = `-5px`; 
        c.style.left = `${Math.random() * arenaRect.width}px`; 
        c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        const size = Math.random() * 8 + 4;
        c.style.width = `${size}px`;
        c.style.height = `${size}px`;
        c.style.opacity = '1';

        container.appendChild(c);

        const duration = Math.random() * 1.5 + 2; 
        c.style.transition = `transform ${duration}s linear, opacity 0.5s linear ${duration - 0.5}s`;
        
        const endX = Math.random() * arenaRect.width * 0.8 - arenaRect.width * 0.4; 
        const endY = arenaRect.height + 10; 
        
        c.style.transform = `translate(${endX}px, ${endY}px) rotate(${Math.random() * 360}deg)`;

        setTimeout(() => {
            c.remove();
        }, duration * 1000);
    }
}