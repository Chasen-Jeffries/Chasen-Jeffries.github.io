// word_index.js
// Loads clue files on demand by word length and builds a fast lookup index

const WordIndex = (() => {

  // ── State ──────────────────────────────────────────────────────────────────
  let index  = {};
  let loaded = new Set();

  // ── Load a single length's clue file on demand ────────────────────────────
  async function loadLength(length) {
    if (loaded.has(length)) return;
    if (length < 3 || length > 15) return;

    const response = await fetch(`crossword/data/clues/clues_${length}.json`);
    const clues    = await response.json();

    index[length] = {
      words:      [],
      byPosition: {},
      clues:      {}
    };

    for (const [word, wordClues] of Object.entries(clues)) {
      index[length].words.push(word);
      index[length].clues[word] = wordClues;

      for (let pos = 0; pos < word.length; pos++) {
        const key = `${pos}:${word[pos]}`;
        if (!index[length].byPosition[key]) {
          index[length].byPosition[key] = [];
        }
        index[length].byPosition[key].push(word);
      }
    }

    loaded.add(length);
    console.log(`Length ${length} loaded: ${index[length].words.length} words`);
  }

  // ── Query: all words of a given length matching known constraints ───────────
  async function getWords(length, constraints = []) {
    if (length < 3 || length > 15) return [];
    await loadLength(length);

    if (!index[length]) return [];

    if (constraints.length === 0) {
      return [...index[length].words];
    }

    let candidates = null;

    for (const { pos, letter } of constraints) {
      const key  = `${pos}:${letter}`;
      const hits = index[length].byPosition[key] || [];

      if (candidates === null) {
        candidates = new Set(hits);
      } else {
        candidates = new Set(hits.filter(w => candidates.has(w)));
      }

      if (candidates.size === 0) return [];
    }

    return [...candidates];
  }

  // ── Get clues for a word ───────────────────────────────────────────────────
  async function getClues(length, word) {
    if (length < 3 || length > 15) return [];
    await loadLength(length);
    return index[length]?.clues[word] || [];
  }

  // ── Reset between puzzles ──────────────────────────────────────────────────
  function reset() {
    index  = {};
    loaded = new Set();
  }

  return { getWords, getClues, reset };

})();
