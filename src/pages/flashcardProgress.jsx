/**
 * Title: LearnLink Flashcard Progress Bar
 * Author: Eric Nakayama
 * Class: CPSC 491
 *
 * Description:
 * This Node.js script uses a generic flashcard progress tracker with
 * navigation and progress bar support. The Flashcard data is injected
 * externally record the user's study progress. Cursor state handling
 * is also included.
 */

// ---------- STATE ----------
let flashcards = [];    // injected from outside
let currentIndex = 0;

// ---------- DOM ELEMENTS -----------
const cardFront = document.getElementById("card-front");
const cardBack = document.getElementById("card-back");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

// ---------- INITIAL CURSOR SETUP ----------
function initializeCursor() {
    if (cardFront) cardFront.style.cursor = "pointer";
    if (cardBack) cardBack.style.cursor = "pointer";
    updateButtonCursor();
}

// ---------- CORE FUNCTIONS -----------
function setFlashcards(cardData) {
    flashcards = cardData || [];
    currentIndex = 0;
    renderCard();
}

function renderCard() {
    if (flashcards.length == 0) {
        cardFront.textContent = "";
        cardBack.textContent = "";
        progressBar.style.width = "0%";
        progressText.textContent = "0 / 0";
        updateButtonCursor();
        return;
    }

    cardFront.textContent = flashcards[currentIndex].front;
    cardBack.textContent = flashcards[currentIndex].back;

    updateProgress();
    updateButtonCursor();
}

function updateProgress() {
    const percent =
        ((currentIndex + 1) / flashcards.length) * 100;

    progressBar.style.width = percent + "%";
    progressText.textContent =
        `${currentIndex + 1} / ${flashcards.length}`;
}

function updateButtonCursor() {
    if (!prevBtn || !nextBtn) return;

    if (currentIndex == 0) {
        prevBtn.style.cursor = "not-allowed";
    } else {
        prevBtn.style.cursor = "pointer";
    }

    if (currentIndex == flashcards.length - 1 || flashcards.length == 0) {
        nextBtn.style.cursor = "not-allowed";
    } else {
        nextBtn.style.cursor = "pointer";
    }
}

function nextCard() {
    if (currentIndex < flashcards.length - 1) {
        currentIndex++;
        renderCard();
    }
}

function prevCard() {
    if (currentIndex > 0) {
        currentIndex--;
        renderCard();
    }
}

// ---------- INITIALIZE -----------
initializeCursor();

// ---------- OPTIONAL EXPORT -------------
export {
    setFlashcards,
    nextCard,
    prevCard
};