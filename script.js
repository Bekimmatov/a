class TugOfWarGame {
  constructor() {
    this.config = {
      step: 50,
      winLimit: 300,
      countdownStart: 3,
      wrongStepFactor: 1 / 3,
      optionsPerQuestion: 4,
      zoom: {
        storageKey: "uzprodevs-ZoomPercent",
        minPercent: 60,
        maxPercent: 150,
        stepPercent: 10,
        defaultPercent: 100,
      },
    };

    this.state = {
      position: 0,
      isActive: false,
      leftTeamName: "",
      rightTeamName: "",
      scores: { left: 0, right: 0 },
      locks: { left: false, right: false },
      currentQuiz: { left: null, right: null },
      startTime: null,
      elapsedTime: 0,
      zoomPercent: this.getSavedZoomPercent(),
      zoomMinPercent: this.config.zoom.minPercent,
      zoomMaxPercent: this.config.zoom.maxPercent,
      questionsLoaded: false,
      devtoolsDetected: false,
    };

    this.quizDatabase = [];
    this.questionOrder = {
      left: [],
      right: [],
      leftIndex: 0,
      rightIndex: 0,
    };
    this.answerCache = new Map();

    this.elements = {};
    this.timerInterval = null;

    this.init();
  }

  fastHash(text) {
    if (this.answerCache.has(text)) {
      return this.answerCache.get(text);
    }
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) + hash + text.charCodeAt(i);
    }
    const result = (hash >>> 0).toString(36);
    this.answerCache.set(text, result);
    return result;
  }

  sanitizeQuestions(data) {
    if (!Array.isArray(data)) return [];

    const out = [];

    for (const item of data) {
      const question = (item?.question ?? "").toString().trim();
      const h = (item?.h ?? "").toString().trim();

      let optionsRaw = Array.isArray(item?.options) ? item.options : [];
      optionsRaw = optionsRaw
        .map((o) => (o ?? "").toString().trim())
        .filter(Boolean);

      if (!question || !h) continue;

      const seen = new Set();
      const uniqueOptions = [];
      for (const o of optionsRaw) {
        if (seen.has(o)) continue;
        seen.add(o);
        uniqueOptions.push(o);
      }

      out.push({
        question,
        h: h,
        options: uniqueOptions,
      });
    }

    return out;
  }

  generateQuiz(side) {
    if (!this.state.isActive) return;

    const problemTextEl = this.elements[`${side}ProblemText`];
    const keypadEl = this.elements[`${side}QuizKeypad`];

    if (!problemTextEl || !keypadEl) return;

    const quiz = this.getNextQuestion(side);
    if (!quiz) {
      problemTextEl.textContent = "Savollar topilmadi";
      keypadEl.innerHTML = "";
      return;
    }

    this.state.currentQuiz[side] = quiz;

    problemTextEl.textContent = quiz.question;
    this.autoFitProblemText(side);

    // Image handling
    const imgEl = this.elements[`${side}ProblemImage`];
    if (imgEl) {
      if (quiz.image) {
        imgEl.src = quiz.image;
        imgEl.style.display = "block";
      } else {
        imgEl.style.display = "none";
        imgEl.src = "";
      }
    }

    const options = this.buildAnswerOptions(quiz);

    keypadEl.innerHTML = "";

    options.forEach((option) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-btn";
      btn.textContent = option;
      btn.setAttribute("data-side", side);

      btn.addEventListener("click", () =>
        this.checkQuizAnswer(side, option, btn)
      );
      btn.addEventListener("touchend", (e) => {
        e.preventDefault();
        btn.click();
      });

      keypadEl.appendChild(btn);
    });

    this.autoFitOptionTexts(side);

    this.updateSideEnabledStates();
  }

  checkQuizAnswer(side, selectedOption, selectedBtn) {
    if (!this.state.isActive) return;
    if (this.state.locks[side]) return;

    this.state.locks[side] = true;
    this.updateSideEnabledStates();

    const keypadEl = this.elements[`${side}QuizKeypad`];
    const problemBox = this.elements[`${side}ProblemBox`];

    keypadEl?.querySelectorAll(".quiz-btn").forEach((b) => (b.disabled = true));

    const currentQuiz = this.state.currentQuiz[side];
    if (!currentQuiz) return;

    const isCorrect = this.fastHash(selectedOption) === currentQuiz.h;

    if (isCorrect) {
      selectedBtn?.classList.add("correct");
      problemBox?.classList.add("correct");

      this.state.scores[side] += 1;
      if (side === "left") this.state.position -= this.config.step;
      else this.state.position += this.config.step;

      this.updateScores();
      this.updateRopePosition();

      this.checkWin();

      setTimeout(() => {
        problemBox?.classList.remove("correct", "wrong");

        this.state.locks[side] = false;
        this.updateSideEnabledStates();

        if (this.state.isActive) {
          this.generateQuiz(side);
        }
      }, 800);

      return;
    }

    selectedBtn?.classList.add("wrong", "shake");
    problemBox?.classList.add("wrong");

    const backStep = this.config.step * this.config.wrongStepFactor;
    if (side === "left") this.state.position += backStep;
    else this.state.position -= backStep;

    this.updateRopePosition();

    this.checkWin();

    setTimeout(() => {
      problemBox?.classList.remove("correct", "wrong");

      this.state.locks[side] = false;
      this.updateSideEnabledStates();

      if (this.state.isActive) {
        this.generateQuiz(side);
      }
    }, 1000);
  }

  resetGame() {
    this.state.position = 0;
    this.state.isActive = false;
    this.state.scores = { left: 0, right: 0 };
    this.state.locks = { left: false, right: false };
    this.state.currentQuiz = { left: null, right: null };

    this.state.startTime = null;
    this.state.elapsedTime = 0;

    this.resetQuestionOrders();

    if (this.elements.leftQuizKeypad)
      this.elements.leftQuizKeypad.innerHTML = "";
    if (this.elements.rightQuizKeypad)
      this.elements.rightQuizKeypad.innerHTML = "";

    this.elements.leftProblemBox?.classList.remove("correct", "wrong");
    this.elements.rightProblemBox?.classList.remove("correct", "wrong");

    this.updateScores();
    this.updateRopePosition();
    this.updateTimerDisplay(true);
    this.updateSideEnabledStates();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    document.querySelectorAll(".confetti").forEach((c) => c.remove());
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.setupSecurityMeasures();
    this.disableCopyPaste();
    this.setupViewControls();

    // Show Custom Question Setup first
    if (this.elements.questionSetupScreen) {
      this.elements.questionSetupScreen.style.display = "flex";
    }

    // Do NOT load questions automatically.
    this.state.questionsLoaded = false;

    // Ensure start button is disabled until questions are added
    if (this.elements.startGameBtn) {
      this.elements.startGameBtn.disabled = true;
    }
  }

  cacheElements() {
    this.elements = {
      startScreen: document.getElementById("startScreen"),
      startGameBtn: document.getElementById("startGameBtn"),
      countdown: document.getElementById("countdown"),
      startModalContent: document.querySelector("#startScreen .modal-content"),

      homeBtn: document.getElementById("homeBtn"),

      teamLeftName: document.getElementById("teamLeftName"),
      teamRightName: document.getElementById("teamRightName"),

      leftTeamHeader: document.getElementById("leftTeamHeader"),
      rightTeamHeader: document.getElementById("rightTeamHeader"),
      leftTeamName: document.getElementById("leftTeamName"),
      rightTeamName: document.getElementById("rightTeamName"),

      leftProblemBox: document.getElementById("leftProblem"),
      rightProblemBox: document.getElementById("rightProblem"),
      leftProblemText: document.getElementById("leftProblemText"),
      rightProblemText: document.getElementById("rightProblemText"),
      leftQuizKeypad: document.getElementById("leftQuizKeypad"),
      rightQuizKeypad: document.getElementById("rightQuizKeypad"),

      leftScore: document.getElementById("leftScore"),
      rightScore: document.getElementById("rightScore"),
      leftCorrectCount: document.getElementById("leftCorrectCount"),
      rightCorrectCount: document.getElementById("rightCorrectCount"),

      ropeContainer: document.getElementById("ropeContainer"),
      ropeVideo: document.getElementById("ropeVideo"),
      winVideoWrap: document.getElementById("win-video"),
      blueWinVideo: document.getElementById("blueWinVideo"),
      redWinVideo: document.getElementById("redWinVideo"),

      winnerDisplay: document.getElementById("winnerDisplay"),
      winnerName: document.getElementById("winnerName"),
      winnerCorrectAnswers: document.getElementById("winnerCorrectAnswers"),
      winnerTime: document.getElementById("winnerTime"),
      winnerMessage: document.getElementById("winnerMessage"),

      gameTimer: document.getElementById("gameTimer"),

      backgroundMusic: document.getElementById("backgroundMusic"),
      victorySound: document.getElementById("victorySound"),

      gameShell: document.querySelector(".game-shell"),
      gameStage: document.getElementById("gameStage"),
      gameBoard: document.getElementById("gameBoard"),

      viewControls: document.getElementById("viewControls"),
      zoomOutBtn: document.getElementById("zoomOutBtn"),
      zoomInBtn: document.getElementById("zoomInBtn"),
      zoomLabel: document.getElementById("zoomLabel"),
      fullscreenBtn: document.getElementById("fullscreenBtn"),

      questionSetupScreen: document.getElementById("questionSetupScreen"),
      customQuestionInput: document.getElementById("customQuestionInput"),
      useDefaultQuestionsBtn: document.getElementById("useDefaultQuestionsBtn"),
      submitQuestionsBtn: document.getElementById("submitQuestionsBtn"),

      leftProblemImage: document.getElementById("leftProblemImage"),
      rightProblemImage: document.getElementById("rightProblemImage"),
    };
  }

  setupEventListeners() {
    this.elements.startGameBtn?.addEventListener("click", () =>
      this.startGame()
    );

    this.elements.homeBtn?.addEventListener("click", () => {
      if (document.referrer && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "https://edugames.uz/game/";
      }
    });

    window.addEventListener("resize", () => {
      this.fitBoardToViewport();
      this.autoFitAllProblemTexts();
      this.autoFitAllOptionTexts();
    });
    window.addEventListener("orientationchange", () => {
      this.fitBoardToViewport();
      this.autoFitAllProblemTexts();
      this.autoFitAllOptionTexts();
    });

    document.addEventListener("fullscreenchange", () =>
      this.updateFullscreenIcon()
    );

    // Custom Question Setup Listeners
    this.elements.useDefaultQuestionsBtn?.addEventListener("click", () => {
      this.useDefaultQuestions();
    });

    this.elements.submitQuestionsBtn?.addEventListener("click", () => {
      this.submitCustomQuestions();
    });

    this.elements.playAgainBtn = document.getElementById("playAgainBtn");
    this.elements.playAgainBtn?.addEventListener("click", () => {
      this.softReset();
    });
  }

  useDefaultQuestions() {
    if (this.elements.questionSetupScreen) {
      this.elements.questionSetupScreen.style.display = "none";
    }

    if (this.elements.startScreen) {
      this.elements.startScreen.style.display = "flex";
    }

    this.resetGame();
    this.fitBoardToViewport();
    this.autoFitAllProblemTexts();
  }

  submitCustomQuestions() {
    const rawText = this.elements.customQuestionInput?.value || "";
    const parsed = this.parseCustomQuestions(rawText);

    if (parsed.length === 0) {
      alert("Hech qanday savol topilmadi. Iltimos formatni tekshiring.");
      return;
    }

    this.quizDatabase = parsed;
    this.state.questionsLoaded = true;
    this.resetQuestionOrders();

    if (this.elements.questionSetupScreen) {
      this.elements.questionSetupScreen.style.display = "none";
    }

    if (this.elements.startScreen) {
      this.elements.startScreen.style.display = "flex";
    }

    this.resetGame();
    this.fitBoardToViewport();
    this.autoFitAllProblemTexts();

    // Enable start button immediately as we have questions
    if (this.elements.startGameBtn) {
      this.elements.startGameBtn.disabled = false;
    }
  }

  softReset() {
    // Go back to the Start Screen (Team Setup)
    if (this.elements.winnerDisplay) this.elements.winnerDisplay.style.display = "none";
    if (this.elements.startScreen) this.elements.startScreen.style.display = "flex";

    // Ensure winner/rope videos are reset
    this.hideWinVideos();
    this.showRopeVideo();

    // Reset game state
    this.resetGame();

    // IMPORTANT: regenerate quiz orders with existing database
    this.resetQuestionOrders();

    this.fitBoardToViewport();
    this.autoFitAllProblemTexts();
  }

  parseCustomQuestions(text) {
    // Fallback: If no '#' present, allow plain text input by prepending a fake header
    if (!text.includes('#')) {
      text = "#AutoQuestion\n" + text;
    }

    const blocks = text.split('#').filter(b => b.trim().length > 0);
    const questions = [];

    for (const block of blocks) {
      // Split by lines, remove CR, trim
      const lines = block
        .replace(/\r/g, '')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      if (lines.length < 1) continue;

      // Line 0 is the "Header" line which might contain the Question and URL
      // Example 1: "savol 1 https://url.com" -> Question is on next line
      // Example 2: "Berilgan xaritada ...? https://url.com" -> Question is IN header

      let headerLine = lines[0];
      let imageUrl = null;

      // Extract URL
      const urlMatch = headerLine.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        imageUrl = urlMatch[0];
        // Remove URL from header line
        headerLine = headerLine.replace(imageUrl, "").trim();
      }

      // Clean up common header prefixes if they exist (e.g. "savol 1", "savol. 38.")
      // Heuristic: Remove specific "savol" patterns or numbers at start if followed by question text
      const headerPrefixMatch = headerLine.match(/^savol\s*[\d.]+\s*/i);
      if (headerPrefixMatch) {
        headerLine = headerLine.replace(headerPrefixMatch[0], "").trim();
      } else {
        // Also try removing just leading digits like "38."
        headerLine = headerLine.replace(/^\d+\.\s*/, "").trim();
      }

      let questionText = "";
      let optionLines = [];

      // If the remaining header line is long enough, assume IT IS the question
      if (headerLine.length > 2) {
        questionText = headerLine;
        optionLines = lines.slice(1);
      } else {
        // Otherwise, question is likely the next line
        if (lines.length > 1) {
          questionText = lines[1];
          optionLines = lines.slice(2);
        }
      }

      const options = [];
      let correctAnswer = null;

      for (const opt of optionLines) {
        // Detect if this is the correct answer
        const isCorrect = opt.startsWith('+');
        let cleanOpt = isCorrect ? opt.substring(1).trim() : opt;

        // Remove typical prefixes like "A)", "B)", "1.", "a)"
        // Regex: Start of string, optional char ([A-Za-z0-9]), followed by . or ) and space
        cleanOpt = cleanOpt.replace(/^[A-Za-z0-9]+[).]\s*/, "");

        // If empty after cleaning, skip
        if (cleanOpt.length === 0) continue;

        if (isCorrect) {
          correctAnswer = cleanOpt;
        }
        options.push(cleanOpt);
      }

      if (questionText && options.length >= 2 && correctAnswer) {
        questions.push({
          question: questionText,
          options: options,
          h: this.fastHash(correctAnswer),
          image: imageUrl
        });
      }
    }

    return questions;
  }

  async loadQuestions() {
    try {
      const res = await fetch("questions.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const sanitized = this.sanitizeQuestions(data);
      if (sanitized.length === 0) throw new Error("Empty questions list");

      this.quizDatabase = sanitized;
      this.state.questionsLoaded = true;
      this.resetQuestionOrders();

      return true;
    } catch (err) {
      console.warn("Questions load failed:", err);
      this.quizDatabase = [];
      this.state.questionsLoaded = false;
      return false;
    }
  }

  resetQuestionOrders() {
    this.questionOrder.left = [];
    this.questionOrder.right = [];
    this.questionOrder.leftIndex = 0;
    this.questionOrder.rightIndex = 0;

    if (this.quizDatabase.length) {
      this.prepareQuestionOrder("left");
      this.prepareQuestionOrder("right");
    }
  }

  prepareQuestionOrder(side) {
    const n = this.quizDatabase.length;
    if (!n) return;

    const indices = Array.from({ length: n }, (_, i) => i);
    this.shuffleArray(indices);

    this.questionOrder[side] = indices;
    this.questionOrder[`${side}Index`] = 0;
  }

  getNextQuestion(side) {
    const n = this.quizDatabase.length;
    if (!n) return null;

    const keyIndex = `${side}Index`;

    if (
      !Array.isArray(this.questionOrder[side]) ||
      this.questionOrder[side].length !== n
    ) {
      this.prepareQuestionOrder(side);
    }

    if (this.questionOrder[keyIndex] >= this.questionOrder[side].length) {
      this.prepareQuestionOrder(side);
    }

    const idx = this.questionOrder[side][this.questionOrder[keyIndex]];
    this.questionOrder[keyIndex] += 1;

    return this.quizDatabase[idx] || null;
  }

  buildAnswerOptions(quiz) {
    const options = [...quiz.options];
    this.shuffleArray(options);
    return options;
  }

  getSavedZoomPercent() {
    const raw = localStorage.getItem(this.config.zoom.storageKey);
    const num = parseInt(raw || "", 10);
    if (!Number.isFinite(num)) return this.config.zoom.defaultPercent;
    return this.clamp(
      num,
      this.config.zoom.minPercent,
      this.config.zoom.maxPercent
    );
  }

  setupViewControls() {
    this.elements.zoomOutBtn?.addEventListener("click", () =>
      this.changeZoom(-this.config.zoom.stepPercent)
    );
    this.elements.zoomInBtn?.addEventListener("click", () =>
      this.changeZoom(this.config.zoom.stepPercent)
    );

    this.elements.zoomLabel?.addEventListener("dblclick", () =>
      this.setZoom(this.config.zoom.defaultPercent)
    );

    this.elements.fullscreenBtn?.addEventListener("click", () =>
      this.toggleFullscreen()
    );

    this.updateZoomControls();
    this.updateFullscreenIcon();
  }

  changeZoom(deltaPercent) {
    const next = this.state.zoomPercent + deltaPercent;
    this.setZoom(next);
  }

  setZoom(percent) {
    const next = this.clamp(
      percent,
      this.state.zoomMinPercent,
      this.state.zoomMaxPercent
    );
    if (next === this.state.zoomPercent) {
      this.updateZoomControls();
      return;
    }

    this.state.zoomPercent = next;
    localStorage.setItem(this.config.zoom.storageKey, String(next));
    this.fitBoardToViewport();
    this.autoFitAllProblemTexts();
    this.autoFitAllOptionTexts();
  }

  updateZoomControls() {
    if (this.elements.zoomLabel) {
      this.elements.zoomLabel.textContent = `${this.state.zoomPercent}%`;
    }

    if (this.elements.zoomOutBtn) {
      this.elements.zoomOutBtn.disabled =
        this.state.zoomPercent <= this.state.zoomMinPercent;
    }

    if (this.elements.zoomInBtn) {
      this.elements.zoomInBtn.disabled =
        this.state.zoomPercent >= this.state.zoomMaxPercent;
    }
  }

  async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen toggle failed:", e);
    }

    this.updateFullscreenIcon();
  }

  updateFullscreenIcon() {
    const btn = this.elements.fullscreenBtn;
    if (!btn) return;

    const icon = btn.querySelector("i");
    if (!icon) return;

    const isFs = !!document.fullscreenElement;

    icon.classList.toggle("fa-expand", !isFs);
    icon.classList.toggle("fa-compress", isFs);

    btn.setAttribute(
      "aria-label",
      isFs ? "Exit fullscreen" : "Enter fullscreen"
    );
  }

  disableCopyPaste() {
    const isInput = (e) => {
      const t = e.target.tagName;
      return t === "INPUT" || t === "TEXTAREA";
    };

    document.addEventListener("copy", (e) => {
      if (!isInput(e)) e.preventDefault();
    });
    document.addEventListener("cut", (e) => {
      if (!isInput(e)) e.preventDefault();
    });
    document.addEventListener("paste", (e) => {
      if (!isInput(e)) e.preventDefault();
    });

    document.addEventListener("selectstart", (e) => {
      if (!isInput(e)) {
        e.preventDefault();
      }
    });

    document.onselectstart = function (e) {
      if (e && isInput(e)) return true;
      return false;
    };

    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    document.body.style.mozUserSelect = "none";
    document.body.style.msUserSelect = "none";
  }

  setupSecurityMeasures() {
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    document.addEventListener(
      "keydown",
      (e) => {
        const key = String(e.key || "").toLowerCase();
        const isF12 = e.key === "F12";
        const isInspectCombo =
          e.ctrlKey &&
          e.shiftKey &&
          (key === "i" || key === "j" || key === "c");
        const isViewSource = e.ctrlKey && (key === "u" || key === "s");

        if (isF12 || isInspectCombo || isViewSource) {
          e.preventDefault();
          e.stopPropagation();
          this.onDevToolsDetected("shortcut");
          return false;
        }
      },
      true
    );

    const checkDebuggerPause = () => {
      const start = performance.now();
      debugger;
      const end = performance.now();

      if (end - start > 100) {
        this.onDevToolsDetected("debugger");
      }
    };

    setInterval(checkDebuggerPause, 2000);
  }

  onDevToolsDetected(reason = "unknown") {
    if (this.state.devtoolsDetected) return;
    this.state.devtoolsDetected = true;

    if (this.state.isActive) {
      this.state.isActive = false;
      this.updateSideEnabledStates();
    }

    this.elements.backgroundMusic?.pause();

    const msg =
      i18n.t("devToolsWarning") || "Developer tools detected! Game paused.";

    if (this.elements.countdown) {
      this.elements.countdown.style.display = "flex";
      this.elements.countdown.classList.remove("go");
      this.elements.countdown.textContent = msg;
    }

    try {
      alert(msg);
    } catch (_) { }

    setTimeout(() => {
      this.state.devtoolsDetected = false;
      if (this.elements.countdown && !this.state.isActive) {
        this.elements.countdown.style.display = "none";
      }
    }, 1500);
  }

  async startGame() {
    if (!this.state.questionsLoaded) {
      await this.loadQuestions();
    }

    if (!this.quizDatabase.length) {
      alert("Savollar yuklanmadi ");
      return;
    }

    const leftName = (this.elements.teamLeftName?.value || "").trim();
    const rightName = (this.elements.teamRightName?.value || "").trim();

    this.state.leftTeamName = leftName || i18n.t("leftTeamDefault");
    this.state.rightTeamName = rightName || i18n.t("rightTeamDefault");

    if (this.elements.leftTeamHeader)
      this.elements.leftTeamHeader.textContent = this.state.leftTeamName;
    if (this.elements.rightTeamHeader)
      this.elements.rightTeamHeader.textContent = this.state.rightTeamName;
    if (this.elements.leftTeamName)
      this.elements.leftTeamName.textContent = this.state.leftTeamName;
    if (this.elements.rightTeamName)
      this.elements.rightTeamName.textContent = this.state.rightTeamName;

    if (this.elements.startScreen)
      this.elements.startScreen.style.display = "none";
    if (this.elements.winnerDisplay)
      this.elements.winnerDisplay.style.display = "none";

    this.hideWinVideos();
    this.showRopeVideo();

    this.resetGame();
    this.startCountdown();
  }

  startCountdown() {
    let count = this.config.countdownStart;

    if (this.elements.countdown) {
      this.elements.countdown.style.display = "flex";
      this.elements.countdown.classList.remove("go");
    }

    if (this.elements.backgroundMusic) {
      this.elements.backgroundMusic.currentTime = 0;
      this.elements.backgroundMusic.play().catch(() => {
        console.log("Audio playback prevented by browser");
      });
    }

    const countdownInterval = setInterval(() => {
      if (!this.elements.countdown) return;

      if (count > 0) {
        this.elements.countdown.textContent = i18n.getCountdown(count);
        count--;
        return;
      }

      this.elements.countdown.textContent = i18n.getCountdown("go");
      this.elements.countdown.classList.add("go");
      clearInterval(countdownInterval);

      setTimeout(() => {
        if (this.elements.countdown)
          this.elements.countdown.style.display = "none";

        this.state.isActive = true;
        this.state.startTime = Date.now();
        this.updateSideEnabledStates();

        this.startTimer();
        this.generateQuiz("left");
        this.generateQuiz("right");
      }, 800);
    }, 1000);
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.state.isActive && this.state.startTime) {
        this.state.elapsedTime = Date.now() - this.state.startTime;
        this.updateTimerDisplay();
      }
    }, 100);
  }

  updateTimerDisplay(forceZero = false) {
    const elapsed = forceZero ? 0 : this.state.elapsedTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const timeStr = `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;

    if (this.elements.gameTimer) {
      this.elements.gameTimer.textContent = timeStr;
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  updateSideEnabledStates() {
    ["left", "right"].forEach((side) => {
      const enabled = this.state.isActive && !this.state.locks[side];
      const keypadEl = this.elements[`${side}QuizKeypad`];

      keypadEl?.querySelectorAll(".quiz-btn").forEach((btn) => {
        btn.disabled = !enabled;
      });
    });
  }

  updateScores() {
    if (this.elements.leftScore)
      this.elements.leftScore.textContent = String(this.state.scores.left);
    if (this.elements.rightScore)
      this.elements.rightScore.textContent = String(this.state.scores.right);

    if (this.elements.leftCorrectCount)
      this.elements.leftCorrectCount.textContent = String(
        this.state.scores.left
      );
    if (this.elements.rightCorrectCount)
      this.elements.rightCorrectCount.textContent = String(
        this.state.scores.right
      );
  }

  updateRopePosition() {
    const maxOffset = 250;
    const clamped = Math.max(
      -maxOffset,
      Math.min(maxOffset, this.state.position)
    );

    if (this.elements.ropeContainer) {
      this.elements.ropeContainer.style.transform = `translate(calc(-50% + ${clamped}px), -50%)`;
    }
  }

  checkWin() {
    if (Math.abs(this.state.position) >= this.config.winLimit) {
      this.endGame();
    }
  }

  endGame() {
    this.state.isActive = false;
    this.updateSideEnabledStates();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const winnerSide = this.state.position < 0 ? "left" : "right";
    const winnerName =
      winnerSide === "left"
        ? this.state.leftTeamName
        : this.state.rightTeamName;
    const winnerScore = this.state.scores[winnerSide];

    if (this.elements.winnerName)
      this.elements.winnerName.textContent = winnerName;
    if (this.elements.winnerCorrectAnswers)
      this.elements.winnerCorrectAnswers.textContent = String(winnerScore);
    if (this.elements.winnerTime)
      this.elements.winnerTime.textContent =
        this.elements.gameTimer?.textContent || "00:00";
    if (this.elements.winnerMessage)
      this.elements.winnerMessage.textContent = i18n.t("winnerMessage");

    if (this.elements.ropeContainer) {
      this.elements.ropeContainer.style.transform = "translate(-50%, -50%)";
    }

    this.hideRopeVideo();
    this.showWinVideo(winnerSide);

    if (this.elements.winnerDisplay) {
      this.elements.winnerDisplay.style.display = "flex";
    }

    this.triggerConfetti();
  }

  hideRopeVideo() {
    if (this.elements.ropeVideo) {
      this.elements.ropeVideo.style.display = "none";
      try {
        this.elements.ropeVideo.pause();
      } catch (_) { }
    }
  }

  showRopeVideo() {
    if (this.elements.ropeVideo) {
      this.elements.ropeVideo.style.display = "block";
      try {
        this.elements.ropeVideo.currentTime = 0;
        this.elements.ropeVideo.play().catch(() => { });
      } catch (_) { }
    }
  }

  hideWinVideos() {
    if (this.elements.winVideoWrap)
      this.elements.winVideoWrap.style.display = "none";

    if (this.elements.blueWinVideo) {
      this.elements.blueWinVideo.style.display = "none";
      try {
        this.elements.blueWinVideo.pause();
      } catch (_) { }
    }

    if (this.elements.redWinVideo) {
      this.elements.redWinVideo.style.display = "none";
      try {
        this.elements.redWinVideo.pause();
      } catch (_) { }
    }
  }

  showWinVideo(winnerSide) {
    if (this.elements.winVideoWrap)
      this.elements.winVideoWrap.style.display = "block";

    const blue = this.elements.blueWinVideo;
    const red = this.elements.redWinVideo;

    if (winnerSide === "left") {
      if (blue) {
        blue.style.display = "block";
        try {
          blue.currentTime = 0;
          blue.play().catch(() => { });
        } catch (_) { }
      }
      if (red) red.style.display = "none";
    } else {
      if (red) {
        red.style.display = "block";
        try {
          red.currentTime = 0;
          red.play().catch(() => { });
        } catch (_) { }
      }
      if (blue) blue.style.display = "none";
    }
  }

  playVictorySound() {
    const a = this.elements.victorySound;
    if (!a) return;

    try {
      a.pause();
      a.currentTime = 0;
      a.play().catch(() => { });
    } catch (_) { }
  }

  triggerConfetti() {
    const colors = ["#0088cc", "#e74c3c", "#f39c12", "#2ecc71", "#9b59b6"];
    const count = 50;
    const arena = document.querySelector(".arena");

    if (!arena) return;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = `${Math.random() * 2 + 2}s`;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;

        arena.appendChild(confetti);

        setTimeout(() => confetti.remove(), 4200);
      }, i * 30);
    }
  }

  autoFitAllProblemTexts() {
    this.autoFitProblemText("left");
    this.autoFitProblemText("right");
  }

  autoFitAllOptionTexts() {
    this.autoFitOptionTexts("left");
    this.autoFitOptionTexts("right");
  }

  autoFitOptionTexts(side) {
    const keypadEl = this.elements[`${side}QuizKeypad`];
    if (!keypadEl) return;

    keypadEl.querySelectorAll(".quiz-btn").forEach((btn) => {
      this.fitTextToBox(btn, btn, 10);
    });
  }

  autoFitProblemText(side) {
    const textEl = this.elements[`${side}ProblemText`];
    const boxEl = this.elements[`${side}ProblemBox`];
    if (!textEl || !boxEl) return;

    this.fitTextToBox(textEl, boxEl, 12);
  }

  fitTextToBox(textEl, boxEl, minPx = 12) {
    textEl.style.fontSize = "";

    const maxPx = Math.max(
      minPx,
      Math.floor(parseFloat(getComputedStyle(textEl).fontSize) || 16)
    );

    if (this.textFits(textEl, boxEl)) return;

    let low = minPx;
    let high = maxPx;
    let best = minPx;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      textEl.style.fontSize = `${mid}px`;

      if (this.textFits(textEl, boxEl)) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    textEl.style.fontSize = `${best}px`;
  }

  textFits(textEl, boxEl) {
    const hOk = textEl.scrollHeight <= boxEl.clientHeight + 1;
    const wOk = textEl.scrollWidth <= boxEl.clientWidth + 1;
    return hOk && wOk;
  }

  fitBoardToViewport() {
    const stage = this.elements.gameStage;
    const board = this.elements.gameBoard;
    const shell = this.elements.gameShell;

    if (!stage || !board || !shell) return;

    stage.style.setProperty("--game-scale", "1");

    const cs = window.getComputedStyle(shell);
    const padX =
      parseFloat(cs.paddingLeft || "0") + parseFloat(cs.paddingRight || "0");
    const padY =
      parseFloat(cs.paddingTop || "0") + parseFloat(cs.paddingBottom || "0");

    const availW = Math.max(0, shell.clientWidth - padX);
    const availH = Math.max(0, shell.clientHeight - padY);

    const baseW = board.offsetWidth || 1;
    const baseH = board.offsetHeight || 1;

    const fitScale = Math.min(availW / baseW, availH / baseH, 1);

    const maxFitScale = Math.min(availW / baseW, availH / baseH);

    const boardMaxPercent = Math.floor(
      (maxFitScale / Math.max(fitScale, 0.0001)) * 100 + 0.0001
    );

    let modalMaxPercent = this.config.zoom.maxPercent;
    const modalOverlay = this.elements.startScreen;
    const modalContent = this.elements.startModalContent;
    const modalVisible = !!(
      modalOverlay && window.getComputedStyle(modalOverlay).display !== "none"
    );

    if (modalVisible && modalContent) {
      const mW = modalContent.offsetWidth || 1;
      const mH = modalContent.offsetHeight || 1;
      const availMW = Math.max(0, window.innerWidth * 0.96);
      const availMH = Math.max(0, window.innerHeight * 0.92);

      const maxModalScale = Math.min(availMW / mW, availMH / mH);
      modalMaxPercent = Math.max(
        this.config.zoom.minPercent,
        Math.floor(maxModalScale * 100)
      );
    }

    const combinedMax = Math.min(
      this.config.zoom.maxPercent,
      boardMaxPercent,
      modalMaxPercent
    );

    this.state.zoomMaxPercent = this.clamp(
      combinedMax,
      this.config.zoom.minPercent,
      this.config.zoom.maxPercent
    );

    this.state.zoomPercent = this.clamp(
      this.state.zoomPercent,
      this.state.zoomMinPercent,
      this.state.zoomMaxPercent
    );
    localStorage.setItem(
      this.config.zoom.storageKey,
      String(this.state.zoomPercent)
    );

    const finalScale = fitScale * (this.state.zoomPercent / 100);

    stage.style.setProperty("--game-scale", finalScale.toFixed(4));

    if (this.elements.startModalContent) {
      this.elements.startModalContent.style.setProperty(
        "--modal-scale",
        (this.state.zoomPercent / 100).toFixed(4)
      );
    }
    this.updateZoomControls();
  }

  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new TugOfWarGame();
});
