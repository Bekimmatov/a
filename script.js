// --- Sozlamalar ---
let position = 0;
const STEP = 50;
const WIN_LIMIT = 300;

let teamLeft, teamRight;
// Yangi: Toʻgʻri javobni saqlash strukturasi (matn)
let quizAnswers = { left: '', right: '' }; 
let gameActive = false;

// 🇺🇿 Geografiya bo'yicha savollar va javoblar bazasi (FAQAT MATNLI)
const quizDatabase = [
    // --- Matnli Savollar (Rasm ishtirokisiz) ---
    { 
        question: "Qaysi qit'aning shimoliy qismini ekvator kesib o'tadi?", 
        correct: "Janubiy Amerika", 
        options: ["Shimoliy Amerika", "Janubiy Amerika", "Avstraliya", "Yevrosiyo"] 
    },
    { 
        question: "O'simliklar va hayvonlarning quruqlikda tarqalishi asosan nimaga bog'liq?", 
        correct: "iqlimga", 
        options: ["iqlimga", "atmosfera bosimiga", "yer osti suvlariga", "tog' jinslariga"] 
    },
    { 
        question: "Portugaliyaning poytaxtini aniqlang?", 
        correct: "Lissabon", 
        options: ["Madrid", "Porto", "Oslo", "Lissabon"] 
    },
    { 
        question: "Qaysi davlat hududi ikki qit'ada joylashgan?", 
        correct: "Turkiya", 
        options: ["Meksika", "Malavi", "Turkiya", "Keniya"] 
    },
    { 
        question: "Qozog'iston maydoni bo'yicha jahonda nechanchi o'rinda turadi?", 
        correct: "9", 
        options: ["8", "9", "10", "11"] 
    },
    { 
        question: "Namangan viloyatidagi Mingbuloq neft koni qaysi yilda topilgan?", 
        correct: "1992", 
        options: ["1991", "1992", "1993", "1994"] 
    },
    { 
        question: "O'zbekistondagi qaysi qurilish materiallari zaxiralari 85 million kubometrdan oshadi?", 
        correct: "bezakbob toshlar", 
        options: ["marmar", "bezakbob toshlar", "qimmatbaho toshlar", "tabiiy gaz"] 
    },
    { 
        question: "Farg'ona viloyatidagi qaysi shahar turli qurilish materiallari ishlab chiqarish markazi hisoblanadi?", 
        correct: "Quvasoy", 
        options: ["Qo'qon", "Marg'ilon", "Rishton", "Quvasoy"] 
    },
    { 
        question: "Isfayram, Shoximardon, So'x, Isfara daryolari qaysi viloyat hududidan oqib o'tadi?", 
        correct: "Farg'ona", 
        options: ["Qashqadaryo", "Samarqand", "Jizzax", "Farg'ona"] 
    },
    { 
        question: "Tomditog'ning eng baland nuqtasi necha metrga teng?", 
        correct: "922 m", 
        options: ["1054 m", "2230 m", "922 m", "995 m"] 
    },
    { 
        question: "1650-yilda Shimoliy Muz okeanini alohida okean sifatida kim ajratgan?", 
        correct: "B. Varenius", 
        options: ["B. Varenius", "J. Kuk", "A. Chirikov", "Jon Kabot"] 
    },
    { 
        question: "Birinchi 'Hilton Hotels & Resorts' mehmonxonasi qachon va qayerda qurilgan?", 
        correct: "1919-yilda Texasda (AQSh)", 
        options: ["1919-yilda Texasda (AQSh)", "1919-yilda Kaliforniyada (AQSh)", "1929-yilda Floridada (AQSh)", "1919-yilda Parijda (Fransiya)"] 
    },
    { 
        question: "Yuqoridagi ma'lumotlar qaysi iqtisodiy rayonga tegishli? (Tomditog', qorako'l, keskin kontinental iqlim)", 
        correct: "Zarafshon", 
        options: ["Janubiy", "Farg'ona", "Zarafshon", "Quyi Amudaryo"] 
    },
    { 
        question: "Quyidagi daryolarning qaysi biri muzliklar va qor suvi bilan to'yinadi?", 
        correct: "Zarafshon", 
        options: ["Sirdaryo", "Chirchiq", "Zarafshon", "Ohangaron"] 
    },
    { 
        question: "Materik yonbag'ri qaysi chuqurliklar oralig'ida joylashgan?", 
        correct: "200-3000 m", 
        options: ["0-200 m", "200-3000 m", "200-6000 m", "2000-3000 m"] 
    },
    { 
        question: "'Energiya tizimi' atamasiga berilgan to'g'ri ta'rifini aniqlang.", 
        correct: "Turli xildagi elektr stansiyalarining yuqori voltli elektr uzatish liniyalari bilan birlashtirib, bir markazdan boshqarib turilishi", 
        options: ["Barcha turdagi energiyani ishlab chiqarishga mo'ljallangan, o'zaro bog'langan va birgalikda ishlovchi texnologik uskunalar, obyektlar hamda inshootlar majmuasi", "Mamlakat hududidagi barcha elektr uzatish liniyalari (EUL).", "Issiqlik energiyasini ishlab chiqarish, o'zgartirish, uzatish, taqsimlash va iste'mol qilish uchun o'zaro bog'langan obyektlar majmuasi.", "Turli xildagi elektr stansiyalarining yuqori voltli elektr uzatish liniyalari bilan birlashtirib, bir markazdan boshqarib turilishi"] 
    },
    { 
        question: "Bulutlardan qaysi yog'in turlari hosil bo'ladi?", 
        correct: "Qor, yomg'ir", 
        options: ["Shudring, qor", "Qirov, yomg'ir", "Qor, yomg'ir", "Qor, yomg'ir, shudring, do'l"] 
    },
    { 
        question: "O'zbekiston viloyatlarini hududi bo'yicha eng kattasidan boshlab ketma-ket tartibda joylashtiring.", 
        correct: "Buxoro, Qashqadaryo, Toshkent, Farg'ona", 
        options: ["Xorazm, Andijon, Sirdaryo, Namangan", "Farg'ona, Samarqand, Sirdaryo, Andijon", "Buxoro, Qashqadaryo, Toshkent, Farg'ona", "Navoiy, Buxoro, Sirdaryo, Toshkent"] 
    },
    { 
        question: "2018-yilda O'zbekistonda import eksportdan necha dollarga ko'p bo'ldi?", 
        correct: "5,3 mlrd", 
        options: ["3,3 mlrd", "3,1 mlrd", "4,6 mlrd", "5,3 mlrd"] 
    },
    { 
        question: "Quyidagi mamlakatlarni shimoldan janubga to'g'ri ketma-ketlikda joylashgan variantni tanlang.", 
        correct: "Norvegiya, Daniya, Italiya", 
        options: ["Norvegiya, Daniya, Italiya", "Shvetsiya, Ispaniya, Islandiya", "AQSh, Germaniya, Kanada", "Braziliya, Argentina, Mali"] 
    },
    { 
        question: "Toshkent iqtisodiy rayoniga oid ma'lumotlar to'g'ri keltirilgan javobni toping.", 
        correct: "Rayon 100 dan ortiq uzoq va yaqin xorij mamlakatlari bilan savdo aloqalarini olib boradi. Xorijga paxta, ipak, paxtachilik uchun zarur mashina va uskunalar, to'qimachilik mashinalari, kabel, ekskavatorlar, ko'tarma kranlar, elektr energiya, rangli metall konsentratlari, ip gazlamalar eksport qiladi.", 
        options: ["Rayon 100 dan ortiq uzoq va yaqin xorij mamlakatlari bilan savdo aloqalarini olib boradi. Xorijga paxta, ipak, paxtachilik uchun zarur mashina va uskunalar, to'qimachilik mashinalari, kabel, ekskavatorlar, ko'tarma kranlar, elektr energiya, rangli metall konsentratlari, ip gazlamalar eksport qiladi.", "Rayon paxta tolasi va paxta yog'i, quritilgan mevalar, konservalar, paxtadan to'qilgan gazlamalar, mashinalar, neft, sement, shifer, farfor va keramika buyumlari hamda boshqalarni eksport qiladi.", "Iqtisodiy-geografik rayon sanoatini asosan oziq-ovqat va yengil sanoat tarmoqlari tashkil qiladi. Yengil sanoatda paxta tozalash zavodlarning ulushi katta.", "Ushbu rayon iqtisodiyotining asosini qishloq xo'jaligi tashkil etadi. O'zbekistondagi foydalanishga yaroqli yerlarning 6 foizi ushbu rayonga to'g'ri keladi. Hududning qariyb 90 foizi yaylovlardan iborat."] 
    },
    { 
        question: "Navoiy viloyatida joylashgan aholi punktlarini aniqlang (1. Karmana. 2. Iskandar. 3. Langar. 4. Romitan. 5. Qiziltepa. 6. Jondor. 7. Vobkent. 8. Shalqar. 9. Koson. 10. Miraki.)", 
        correct: "1, 3, 5, 8", 
        options: ["1, 3, 5, 8", "3, 5, 8, 9", "2, 3, 4, 7, 8", "1, 3, 5, 6, 8, 9"] 
    },
    { 
        question: "Quyidagi o'simlik va hayvonot dunyosi qaysi kengliklar uchun xos: 'Hududning bir qismida ignabargli, keng bargli, aralash o'rmonlar o'sadi, ularda ko'plab o'rmon hayvonlari va qushlar yashaydi. Qolgan qismida dasht o'simliklari hukmronlik qiladi. Bu yerda hayvonlar orasida kemiruvchilar va qushlar ustunlik qiladi?'", 
        correct: "mo'tadil", 
        options: ["qutbiy", "tropik", "mo'tadil", "ekvatorial"] 
    },
    { 
        question: "2017-yilda nechta viloyatning O'zbekiston yalpi ichki mahsulotidagi ulushi 9% va undan ko'proqni tashkil qilgan?", 
        correct: "2", 
        options: ["2", "4", "6", "1"] 
    },
    { 
        question: "2016-yilgi ma'lumotlarga ko'ra, dunyoda yiliga... mlrd. tonna neft qazib olinadi. Nuqtalar o'rniga mos keluvchi ma'lumotni aniqlang.", 
        correct: "4,3", 
        options: ["1,3", "2,3", "4,3", "5,3"] 
    },
    { 
        question: "2017-yil ma'lumotiga ko'ra, O'zbekiston importida Turkiyaning ulushi necha foizni tashkil etgan?", 
        correct: "5,2", 
        options: ["21,0", "5,2", "9,5", "7,7"] 
    },
    { 
        question: "'Sanoat rayoni' atamasiga berilgan to'g'ri ta'rifini aniqlang.", 
        correct: "Sanoat markazlari, tugunlari va punktlari to'plangan hududlar", 
        options: ["Bu - texnologik jarayon bilan o'zaro bog'langan, ba'zan esa turli ishlab chiqarish sohalariga mansub bo'lgan bir nechta sanoat korxonalarining bitta korxonaga birlashtirilishidir.", "Yirik korxonalarda ishlab chiqarishning konsentratsiyasi", "Sanoat markazlari, tugunlari va punktlari to'plangan hududlar", "Mamlakat va chet el kapitalini, istiqbolli texnologiya va boshqaruv tajribasini jalb etish maqsadida tuziladigan, aniq belgilangan ma'muriy chegaralari va alohida huquqiy tartiboti bo'lgan maxsus ajratilgan hududdir."] 
    },
    { 
        question: "O'zbekistonda suvni ifloslovchi qaysi tarmoq ulushi 18% ni tashkil qiladi?", 
        correct: "sanoat", 
        options: ["sanoat", "qishloq xo'jaligi", "kommunal xizmatlar", "transport tarmoqlari"] 
    },
    { 
        question: "'Fraxt' atamasiga to'g'ri ta'rif berilgan qatorni toping.", 
        correct: "Suv transporti orqali yuk tashish uchun to'lov", 
        options: ["Bu yukga egalik huquqini tasdiqlovchi hujjat", "Suv transportida yuk tashish uchun soliq", "Yo'lovchi tashish yoki kema, samolyot yoki transport vositasini ijaraga olish uchun to'lov", "Suv transporti orqali yuk tashish uchun to'lov"] 
    },
    { 
        question: "Tonga botig'ining chuqurligi bilan Hind okeanining eng chuqur joyi o'rtasidagi farqni aniqlang.", 
        correct: "3 153 m", 
        options: ["4 153 m", "3 153 m", "2 153 m", "1 153 m"] 
    },
    { 
        question: "Sariosiyo tumanidagi ... konida polimetall rudalarni, ya'ni rux, qo'rg'oshin, mis va kumushning katta zaxirasini qayta ishlash bo'yicha yirik loyiha amalga oshirildi. Nuqtalar o'rniga kon nomini yozing.", 
        correct: "Xonjiza", 
        options: ["Xonjiza", "Uchqizil", "Sho'rchi", "Boysun"] 
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
        const redGif = document.getElementById("redWinGif");
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
