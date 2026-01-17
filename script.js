/* =========================
   ELEMENTS
========================= */
const textDisplay = document.getElementById("textDisplay");
const input = document.getElementById("typingInput");
const timeEl = document.getElementById("time");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const resultCard = document.getElementById("resultCard");
const resultDetails = document.getElementById("resultDetails");
const scoreList = document.getElementById("scoreList");
const restartBtn = document.getElementById("restartBtn");
const keyboardEl = document.getElementById("keyboard");
const studentNameInput = document.getElementById("studentName");
const resetScoresBtn = document.getElementById("resetScores");

const customControls = document.getElementById("customControls");
const timeSelect = document.getElementById("timeSelect");
const customTextArea = document.getElementById("customText");
const useCustomBtn = document.getElementById("useCustom");

/* =========================
   STATE VARIABLES
========================= */
let currentLevel = "beginner";
let text = "";
let timeLimit = 60;
let timeLeft, timer, startTime;
let correctChars = 0;
let totalTyped = 0;

/* =========================
   TEXT BANK (RANDOM)
========================= */
const texts = {
    beginner: [
        "cat dog sun pen",
        "this is fun",
        "red blue green",
        "typing is easy",
        "This is a test"
    ],
    medium: [
        "Typing improves accuracy and focus.",
        "Computers help students learn faster.",
        "Practice makes typing better."
    ],
    advanced: [
        "A computer is an electronic device that processes data efficiently.",
        "Typing skill increases productivity and confidence."
    ]
};

/* =========================
   STORAGE KEY (LEVEL-WISE)
========================= */
function getStorageKey() {
    return `typingScores_${currentLevel}`;
}

/* =========================
   KEYBOARD
========================= */
const keys = "qwertyuiopasdfghjklzxcvbnm".split("");

function createKeyboard() {
    keyboardEl.innerHTML = "";
    keys.forEach(k => {
        const key = document.createElement("div");
        key.textContent = k;
        key.className = "key";
        key.dataset.key = k;
        keyboardEl.appendChild(key);
    });
}

/* =========================
   LOAD TEXT
========================= */
function loadText(custom = null) {
    text = custom || texts[currentLevel][Math.floor(Math.random() * texts[currentLevel].length)];
    textDisplay.innerHTML = "";

    text.split("").forEach((char, i) => {
        const span = document.createElement("span");
        span.textContent = char;
        if (i === 0) span.classList.add("active");
        textDisplay.appendChild(span);
    });
}

/* =========================
   TIMER
========================= */
function startTimer() {
    timeLeft = timeLimit;
    timeEl.textContent = `⏱️ ${timeLeft}s`;

    timer = setInterval(() => {
        timeLeft--;
        timeEl.textContent = `⏱️ ${timeLeft}s`;
        updateStats();

        if (timeLeft <= 0) finishTest();
    }, 1000);
}

/* =========================
   STATS
========================= */
function updateStats() {
    const minutes = (Date.now() - startTime) / 60000;
    const wpm = minutes > 0 ? Math.round((totalTyped / 5) / minutes) : 0;
    const accuracy = totalTyped ? Math.round((correctChars / totalTyped) * 100) : 100;

    wpmEl.textContent = `⚡ WPM: ${wpm}`;
    accuracyEl.textContent = `🎯 Accuracy: ${accuracy}%`;
}

/* =========================
   INPUT HANDLER
========================= */
input.addEventListener("input", () => {
    if (!startTime) {
        startTime = Date.now();
        startTimer();
    }

    const chars = textDisplay.querySelectorAll("span");
    const value = input.value.split("");

    totalTyped = value.length;
    correctChars = 0;

    chars.forEach((span, i) => {
        span.classList.remove("correct", "wrong", "active");

        if (value[i] == null) {
            if (i === value.length) span.classList.add("active");
        } else if (value[i] === span.textContent) {
            span.classList.add("correct");
            correctChars++;
        } else {
            span.classList.add("wrong");
        }
    });

    highlightKey(value[value.length - 1]);

    // Finish early if text completed
    if (value.join("") === text) finishTest();
});

/* =========================
   KEYBOARD HIGHLIGHT
========================= */
function highlightKey(char) {
    document.querySelectorAll(".key").forEach(k => k.classList.remove("active"));
    if (!char) return;
    const key = document.querySelector(`.key[data-key="${char.toLowerCase()}"]`);
    if (key) key.classList.add("active");
}

/* =========================
   FINISH TEST
========================= */
function finishTest() {
    clearInterval(timer);
    input.disabled = true;
    updateStats();

    const minutes = (Date.now() - startTime) / 60000;
    const wpm = minutes > 0 ? Math.round((totalTyped / 5) / minutes) : 0;
    const accuracy = Math.round((correctChars / totalTyped) * 100) || 0;
    const name = studentNameInput.value.trim() || "Anonymous";

    resultDetails.innerHTML = `
        <strong>Name:</strong> ${name}<br>
        <strong>Level:</strong> ${currentLevel}<br>
        <strong>WPM:</strong> ${wpm}<br>
        <strong>Accuracy:</strong> ${accuracy}%<br>
        <strong>Time:</strong> ${timeLimit}s
    `;

    resultCard.classList.remove("hidden");

    saveScore({ name, wpm, accuracy });
    loadScores();
}

/* =========================
   SCOREBOARD (LEVEL-WISE)
========================= */
function saveScore(score) {
    const key = getStorageKey();
    const scores = JSON.parse(localStorage.getItem(key)) || [];
    scores.push(score);
    localStorage.setItem(key, JSON.stringify(scores));
}

function loadScores() {
    const key = getStorageKey();
    const scores = JSON.parse(localStorage.getItem(key)) || [];

    scores.sort((a, b) => {
        if (b.wpm === a.wpm) return b.accuracy - a.accuracy;
        return b.wpm - a.wpm;
    });

    scoreList.innerHTML = "";

    if (scores.length === 0) {
        scoreList.innerHTML = "<li>No records yet</li>";
        return;
    }

    scores.slice(0, 10).forEach((s, i) => {
        const li = document.createElement("li");
        li.textContent = `#${i + 1} ${s.name} — ${s.wpm} WPM (${s.accuracy}%)`;
        scoreList.appendChild(li);
    });
}

/* =========================
   RESET SCOREBOARD (LEVEL)
========================= */
resetScoresBtn.onclick = () => {
    const confirmReset = confirm(
        `Reset scoreboard for ${currentLevel.toUpperCase()} level?`
    );

    if (confirmReset) {
        localStorage.removeItem(getStorageKey());
        loadScores();
    }
};

/* =========================
   LEVEL SWITCH
========================= */
document.querySelectorAll(".level").forEach(btn => {
    btn.onclick = () => {
        document.querySelector(".level.active").classList.remove("active");
        btn.classList.add("active");

        currentLevel = btn.dataset.level;
        customControls.classList.toggle("hidden", currentLevel !== "custom");
        timeLimit = currentLevel === "custom" ? Number(timeSelect.value) : 60;

        restart();
        loadScores();
    };
});

/* =========================
   CUSTOM MODE
========================= */
useCustomBtn.onclick = () => {
    if (customTextArea.value.trim()) {
        restart(customTextArea.value.trim());
    }
};

timeSelect.onchange = () => {
    timeLimit = Number(timeSelect.value);
    restart();
};

/* =========================
   RESTART
========================= */
function restart(custom = null) {
    clearInterval(timer);
    startTime = null;
    correctChars = 0;
    totalTyped = 0;

    input.value = "";
    input.disabled = false;

    resultCard.classList.add("hidden");

    timeEl.textContent = `⏱️ ${timeLimit}s`;
    wpmEl.textContent = "⚡ WPM: 0";
    accuracyEl.textContent = "🎯 Accuracy: 100%";

    loadText(custom);
}

restartBtn.onclick = () => restart();

/* =========================
   INIT
========================= */
createKeyboard();
loadText();
loadScores();