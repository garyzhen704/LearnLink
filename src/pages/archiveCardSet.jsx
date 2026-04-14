/**
 * Title: LearnLink Flashcard Archive
 * Author: Eric Nakayama
 * Class: CPSC 491
 *
 * Description:
 * This Node.jsx script uses a feature to archive Flashcard Sets
 * that were uploaded in the past. The user can always unarchive
 * that selected Flashcard set if they need in for certain classes
 * in the future.
 */

let flashcardSets = [];

// Archive a flashcard set by ID
function archiveSet(id) {
    const index = flashcardSets.findIndex(set => set.id == id);
    if (index == -1) return;

    flashcardSets[index].archived = true;
}

// Optional: unarchive a set
function unarchiveSet(id) {
    const index = flashcardSets.findIndex(set => set.id == id);
    if (index == -1) return;

    flashcardSets[index].archived = false;
}

// Get only active (non-archived) sets
function getActiveSets() {
    return flashcardSets.filter(set => !set.archived);
}

// Get archived sets
function getArchivedSets() {
    return flashcardSets.filter(set => set.archived);
}