const translations = {
  uz: {
    pageTitle: "Arqon Tortish: Geografiya",
    gameSubtitle: "To'g'ri javob — arqon siz tomonga tortiladi.\nNoto'g'ri javob — arqon raqib tomonga siljiydi va darhol yangi savol chiqadi.",
    modalTitle: "JAMOALARNI TAYYORLANG",
    team1Label: "1-JAMOA (KO'K)",
    team2Label: "2-JAMOA (QIZIL)",
    teamPlaceholder: "Jamoa nomi",
    startBtn: "O'yinni boshlash",
    playAgain: "Qayta o'ynash",
    homeBtn: "Home",
    leftTeamDefault: "1-Jamoa",
    rightTeamDefault: "2-Jamoa",
    winnerMessage: "G'olib bo'ldi!",
    correctAnswers: "to'g'ri javob",
    time: "vaqt",
    devToolsWarning: "Developer tools aniqlandi! O'yin to'xtatildi.",
    countdown: { 3: "3", 2: "2", 1: "1", go: "BOSHLANDI!" }
  },
  ru: {
    pageTitle: "Перетягивание каната: География",
    gameSubtitle: "Правильный ответ — канат тянется к вашей стороне.\nНеправильный — к сопернику, и сразу появляется новый вопрос.",
    modalTitle: "ПОДГОТОВЬТЕ КОМАНДЫ",
    team1Label: "КОМАНДА 1 (СИНЯЯ)",
    team2Label: "КОМАНДА 2 (КРАСНАЯ)",
    teamPlaceholder: "Название команды",
    startBtn: "Начать игру",
    playAgain: "Играть снова",
    homeBtn: "Home",
    leftTeamDefault: "Команда 1",
    rightTeamDefault: "Команда 2",
    winnerMessage: "Победила!",
    correctAnswers: "правильных ответов",
    time: "время",
    devToolsWarning: "Обнаружены инструменты разработчика! Игра остановлена.",
    countdown: { 3: "3", 2: "2", 1: "1", go: "НАЧАЛИ!" }
  },
  en: {
    pageTitle: "Tug of War: Geography",
    gameSubtitle: "Correct answer pulls the rope toward your team.\nWrong answer pulls it toward the opponent and a new question appears immediately.",
    modalTitle: "PREPARE YOUR TEAMS",
    team1Label: "TEAM 1 (BLUE)",
    team2Label: "TEAM 2 (RED)",
    teamPlaceholder: "Team name",
    startBtn: "Start game",
    playAgain: "Play again",
    homeBtn: "Home",
    leftTeamDefault: "Team 1",
    rightTeamDefault: "Team 2",
    winnerMessage: "Winner!",
    correctAnswers: "correct answers",
    time: "time",
    devToolsWarning: "Developer tools detected! Game paused.",
    countdown: { 3: "3", 2: "2", 1: "1", go: "GO!" }
  }
};

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('gameLang') || 'uz';
    this.init();
  }

  init() {
    this.setupLanguageButtons();
    this.updateLanguage(this.currentLang);
  }

  setupLanguageButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.updateLanguage(btn.getAttribute('data-lang'));
      });
      if (btn.getAttribute('data-lang') === this.currentLang) {
        btn.classList.add('active');
      }
    });
  }

  updateLanguage(lang) {
    if (!translations[lang]) return;

    this.currentLang = lang;
    localStorage.setItem('gameLang', lang);
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    this.translatePage();
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  translatePage() {
    const t = translations[this.currentLang];

    document.title = t.pageTitle;

    const setContent = (id, text, upper = false) => {
      const el = document.getElementById(id);
      if (el) el.textContent = upper ? text.toUpperCase() : text;
    };

    setContent('pageTitle', t.pageTitle);
    setContent('gameTitle', t.pageTitle, true);
    setContent('gameSubtitle', t.gameSubtitle);
    setContent('modalTitle', t.modalTitle);
    setContent('team1Label', t.team1Label);
    setContent('team2Label', t.team2Label);
    setContent('startBtnText', t.startBtn, true);
    setContent('playAgainText', t.playAgain, true);
    setContent('homeBtnText', t.homeBtn, true);
    setContent('winnerMessage', t.winnerMessage);
    setContent('correctAnswersLabel', t.correctAnswers);
    setContent('timeLabel', t.time);

    const setPlaceholder = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.placeholder = text;
    };

    setPlaceholder('teamLeftName', t.teamPlaceholder);
    setPlaceholder('teamRightName', t.teamPlaceholder);
  }

  t(key) {
    return translations[this.currentLang]?.[key] || key;
  }

  getCountdown(num) {
    return translations[this.currentLang]?.countdown?.[num] || String(num);
  }
}

const i18n = new I18n();