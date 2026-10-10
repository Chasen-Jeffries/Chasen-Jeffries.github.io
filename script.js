(function ($) {
  $(window).on('load hashchange', function(){
    // Hide all content regions
    $('.content-region').hide();

    // Get the current hash or default to the first menu link if no hash
    var region = location.hash.toString() || $('.main-menu a:first').attr('href');
    
    // Show the region that matches the hash
    $(region).show();

    // Highlight the menu link associated with this region
    $('.main-menu a').removeClass('active');
    $('.main-menu a[href="'+ region +'"]').addClass('active');

    // Check if the hash corresponds to 'Professional' or 'Academia' and scroll to it
    if (region === '#professional-section' || region === '#academia-section') {
      scrollToSection(region.substring(1)); // Remove the hash and pass the ID
    }
  });
})(jQuery);

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function toggleAbstract(abstractId) {
    var element = document.getElementById(abstractId);
    if (element.style.display === 'none' || element.style.display === '') {
        element.style.display = 'block';
        document.querySelector(`span[onclick="toggleAbstract('${abstractId}')"]`).innerHTML = 'Abstract &#9650;'; // Change to up arrow when open
    } else {
        element.style.display = 'none';
        document.querySelector(`span[onclick="toggleAbstract('${abstractId}')"]`).innerHTML = 'Abstract &#9660;'; // Revert to down arrow when closed
    }
}

function toggleCoursework(courseworkId) {
    var element = document.getElementById(courseworkId);
    if (element.style.display === 'none' || element.style.display === '') {
        element.style.display = 'block';
        document.querySelector(`span[onclick="toggleCoursework('${courseworkId}')"]`).innerHTML = 'Relevant Coursework &#9650;'; // Change to up arrow when open
    } else {
        element.style.display = 'none';
        document.querySelector(`span[onclick="toggleCoursework('${courseworkId}')"]`).innerHTML = 'Relevant Coursework &#9660;'; // Revert to down arrow when closed
    }
}



/* ===== Crossword Generator ===== */

var cwGrid     = null;
var cwSlots    = null;
var cwSelCell  = null;
var cwSelDir   = "across";
var cwSelSlot  = null;
var cwGenerated = false;
var cwClockInt  = null;
var cwSeconds   = 0;
var cwExtraClues = {};
var cwRevealed  = new Set();

function cwStartClock() {
  cwSeconds = 0;
  cwUpdateClock();
  if (cwClockInt) clearInterval(cwClockInt);
  cwClockInt = setInterval(function() { cwSeconds++; cwUpdateClock(); }, 1000);
}

function cwStopClock() {
  if (cwClockInt) clearInterval(cwClockInt);
}

function cwUpdateClock() {
  var m = Math.floor(cwSeconds / 60);
  var s = cwSeconds % 60;
  document.getElementById("cw-clock").textContent =
    m + ":" + (s < 10 ? "0" : "") + s;
}

function cwFormatTime() {
  var m = Math.floor(cwSeconds / 60);
  var s = cwSeconds % 60;
  return m + " minute" + (m !== 1 ? "s" : "") + " and " + s + " second" + (s !== 1 ? "s" : "");
}

function cwHandleGenerate() {
  if (cwGenerated) {
    document.getElementById("cw-confirm-overlay").classList.add("visible");
  } else {
    cwRunGenerate();
  }
}

function cwConfirmGenerate(yes) {
  document.getElementById("cw-confirm-overlay").classList.remove("visible");
  if (yes) cwRunGenerate();
}

async function cwRunGenerate() {
  var btn    = document.getElementById("cw-generate-btn");
  var status = document.getElementById("cw-status");

  btn.disabled      = true;
  status.textContent = "Generating puzzle...";
  cwGenerated       = false;
  cwSelCell         = null;
  cwSelSlot         = null;
  cwExtraClues      = {};
  cwRevealed        = new Set();
  cwStopClock();

  document.getElementById("cw-grid-container").innerHTML = "";
  document.getElementById("cw-across-list").innerHTML    = "";
  document.getElementById("cw-down-list").innerHTML      = "";
  cwSetKeyEnabled(false);

  try {
    var result  = await Fill.generate();
    cwGrid      = result.grid;
    cwSlots     = result.slots;
    cwRenderGrid(cwGrid);
    await cwRenderClues(cwSlots);
    cwGenerated        = true;
    status.textContent = "";
    cwSetKeyEnabled(true);
    cwStartClock();
  } catch(err) {
    status.textContent = "Error: " + err.message;
    console.error(err);
  }

  btn.disabled = false;
}

function cwSetKeyEnabled(on) {
  ["cw-btn-check","cw-btn-hint","cw-btn-reveal-letter","cw-btn-reveal-word"]
    .forEach(function(id) { document.getElementById(id).disabled = !on; });
}

function cwRenderGrid(grid) {
  var container = document.getElementById("cw-grid-container");
  container.innerHTML = "";

  for (var r = 0; r < grid.length; r++) {
    var rowEl = document.createElement("div");
    rowEl.className = "cw-grid-row";

    for (var c = 0; c < grid[r].length; c++) {
      var cell   = grid[r][c];
      var cellEl = document.createElement("div");

      if (cell.isBlack) {
        cellEl.className = "cw-cell black";
      } else {
        cellEl.className      = "cw-cell";
        cellEl.dataset.row    = r;
        cellEl.dataset.col    = c;

        if (cell.clueNumber) {
          var numEl       = document.createElement("span");
          numEl.className = "cw-clue-num";
          numEl.textContent = cell.clueNumber;
          cellEl.appendChild(numEl);
        }

        var letterEl       = document.createElement("span");
        letterEl.className = "cw-letter";
        letterEl.textContent = "";
        cellEl.appendChild(letterEl);

        (function(row, col) {
          cellEl.addEventListener("click", function() { cwOnCellClick(row, col); });
        })(r, c);
      }

      rowEl.appendChild(cellEl);
    }
    container.appendChild(rowEl);
  }
}

function cwGetCellEl(r, c) {
  return document.querySelector(".cw-cell[data-row='" + r + "'][data-col='" + c + "']");
}

function cwOnCellClick(r, c) {
  if (!cwGrid[r][c].isBlack) {
    if (cwSelCell && cwSelCell.row === r && cwSelCell.col === c) {
      cwSelDir = cwSelDir === "across" ? "down" : "across";
    } else {
      cwSelCell = { row: r, col: c };
    }
    cwUpdateSelection();
  }
}

function cwUpdateSelection() {
  if (!cwSelCell) return;

  var slot = null;
  for (var i = 0; i < cwSlots.length; i++) {
    var s = cwSlots[i];
    if (s.direction !== cwSelDir) continue;
    for (var j = 0; j < s.cells.length; j++) {
      if (s.cells[j].row === cwSelCell.row && s.cells[j].col === cwSelCell.col) {
        slot = s; break;
      }
    }
    if (slot) break;
  }

  if (!slot) {
    cwSelDir = cwSelDir === "across" ? "down" : "across";
    for (var i = 0; i < cwSlots.length; i++) {
      var s = cwSlots[i];
      if (s.direction !== cwSelDir) continue;
      for (var j = 0; j < s.cells.length; j++) {
        if (s.cells[j].row === cwSelCell.row && s.cells[j].col === cwSelCell.col) {
          slot = s; break;
        }
      }
      if (slot) break;
    }
  }

  cwSelSlot = slot;

  document.querySelectorAll(".cw-cell").forEach(function(el) {
    el.classList.remove("active-slot", "active-cell");
  });

  if (cwSelSlot) {
    cwSelSlot.cells.forEach(function(cell) {
      var el = cwGetCellEl(cell.row, cell.col);
      if (el) el.classList.add("active-slot");
    });
  }

  var activeEl = cwGetCellEl(cwSelCell.row, cwSelCell.col);
  if (activeEl) {
    activeEl.classList.remove("active-slot");
    activeEl.classList.add("active-cell");
  }

  document.querySelectorAll(".cw-clue-list li").forEach(function(li) {
    li.classList.remove("active-clue");
  });

  if (cwSelSlot) {
    var li = document.querySelector("[data-slot-id='" + cwSelSlot.id + "']");
    if (li) { li.classList.add("active-clue"); li.scrollIntoView({ block: "nearest" }); }
  }
}

document.addEventListener("keydown", function(e) {
  if (!cwSelCell || !cwGenerated) return;
  var key = e.key.toUpperCase();

  if (key.length === 1 && key >= "A" && key <= "Z") {
    var el = cwGetCellEl(cwSelCell.row, cwSelCell.col);
    if (el) {
      el.querySelector(".cw-letter").textContent = key;
      el.classList.remove("wrong", "correct");
    }
    cwAdvance();
    cwCheckComplete();

  } else if (e.key === "Backspace") {
    var el = cwGetCellEl(cwSelCell.row, cwSelCell.col);
    if (el && el.querySelector(".cw-letter").textContent !== "") {
      el.querySelector(".cw-letter").textContent = "";
      el.classList.remove("wrong", "correct");
    } else {
      cwRetreat();
    }

  } else if (e.key === "ArrowRight")  { e.preventDefault(); cwSelDir = "across"; cwMove(0,  1); }
    else if (e.key === "ArrowLeft")   { e.preventDefault(); cwSelDir = "across"; cwMove(0, -1); }
    else if (e.key === "ArrowDown")   { e.preventDefault(); cwSelDir = "down";   cwMove(1,  0); }
    else if (e.key === "ArrowUp")     { e.preventDefault(); cwSelDir = "down";   cwMove(-1, 0); }
    else if (e.key === "Tab")         { e.preventDefault(); cwNextSlot(e.shiftKey ? -1 : 1); }
});

function cwAdvance() {
  if (!cwSelSlot) return;
  var idx = cwSelSlot.cells.findIndex(function(c) {
    return c.row === cwSelCell.row && c.col === cwSelCell.col;
  });
  if (idx < cwSelSlot.cells.length - 1) {
    cwSelCell = cwSelSlot.cells[idx + 1];
    cwUpdateSelection();
  }
}

function cwRetreat() {
  if (!cwSelSlot) return;
  var idx = cwSelSlot.cells.findIndex(function(c) {
    return c.row === cwSelCell.row && c.col === cwSelCell.col;
  });
  if (idx > 0) {
    cwSelCell = cwSelSlot.cells[idx - 1];
    cwUpdateSelection();
  }
}

function cwMove(dr, dc) {
  var nr = cwSelCell.row + dr, nc = cwSelCell.col + dc;
  if (nr >= 0 && nr < cwGrid.length && nc >= 0 && nc < cwGrid[0].length && !cwGrid[nr][nc].isBlack) {
    cwSelCell = { row: nr, col: nc };
    cwUpdateSelection();
  }
}

function cwNextSlot(dir) {
  if (!cwSelSlot) return;
  var sorted = cwSlots.slice().sort(function(a,b) { return a.clueNumber - b.clueNumber; });
  var idx    = sorted.findIndex(function(s) { return s.id === cwSelSlot.id; });
  var next   = sorted[(idx + dir + sorted.length) % sorted.length];
  cwSelDir   = next.direction;
  cwSelCell  = next.cells[0];
  cwUpdateSelection();
}

async function cwRenderClues(slots) {
  var acrossList = document.getElementById("cw-across-list");
  var downList   = document.getElementById("cw-down-list");
  var sorted     = slots.slice().sort(function(a,b) { return a.clueNumber - b.clueNumber; });

  for (var i = 0; i < sorted.length; i++) {
    var slot = sorted[i];
    if (!slot.word) continue;

    var allClues      = await WordIndex.getClues(slot.length, slot.word);
    slot.allClues     = allClues;
    var clue          = allClues.length > 0 ? allClues[0] : "???";

    var li            = document.createElement("li");
    li.dataset.slotId = slot.id;
    li.innerHTML      = "<span>" + slot.clueNumber + ".</span>" + clue;

    (function(s) {
      li.addEventListener("click", function() {
        cwSelDir  = s.direction;
        cwSelCell = s.cells[0];
        cwUpdateSelection();
      });
    })(slot);

    if (slot.direction === "across") acrossList.appendChild(li);
    else downList.appendChild(li);
  }
}

function cwCheckPuzzle() {
  if (!cwGrid || !cwSlots) return;
  document.querySelectorAll(".cw-cell").forEach(function(el) {
    el.classList.remove("wrong", "correct");
  });
  cwSlots.forEach(function(slot) {
    if (!slot.word) return;
    slot.cells.forEach(function(cell, i) {
      var el = cwGetCellEl(cell.row, cell.col);
      if (!el) return;
      var typed = el.querySelector(".cw-letter").textContent.toUpperCase();
      if (typed === "") return;
      el.classList.add(typed === slot.word[i] ? "correct" : "wrong");
    });
  });
}

function cwGiveHint() {
  if (!cwSelSlot || !cwSelSlot.allClues) return;
  var clues  = cwSelSlot.allClues;
  var slotId = cwSelSlot.id;
  var li     = document.querySelector("[data-slot-id='" + slotId + "']");

  if (clues.length <= 1) {
    if (li) li.innerHTML = "<span>" + cwSelSlot.clueNumber + ".</span>" + clues[0] +
      " <em style='color:#999; font-size:12px;'>(no other hints)</em>";
    return;
  }

  if (cwExtraClues[slotId] === undefined) cwExtraClues[slotId] = 1;
  var idx     = cwExtraClues[slotId] % clues.length;
  var showIdx = idx === 0 ? 1 : idx;
  if (li) li.innerHTML = "<span>" + cwSelSlot.clueNumber + ".</span>" + clues[showIdx];
  cwExtraClues[slotId] = showIdx + 1;
}

function cwRevealLetter() {
  if (!cwSelCell || !cwSelSlot) return;
  var idx = cwSelSlot.cells.findIndex(function(c) {
    return c.row === cwSelCell.row && c.col === cwSelCell.col;
  });
  if (idx === -1) return;
  var el = cwGetCellEl(cwSelCell.row, cwSelCell.col);
  if (el) {
    el.querySelector(".cw-letter").textContent = cwSelSlot.word[idx];
    el.classList.remove("wrong");
    el.classList.add("correct");
    cwRevealed.add(cwSelCell.row + "," + cwSelCell.col);
  }
  cwAdvance();
  cwCheckComplete();
}

function cwRevealWord() {
  if (!cwSelSlot) return;
  cwSelSlot.cells.forEach(function(cell, i) {
    var el = cwGetCellEl(cell.row, cell.col);
    if (el) {
      el.querySelector(".cw-letter").textContent = cwSelSlot.word[i];
      el.classList.remove("wrong");
      el.classList.add("correct");
      cwRevealed.add(cell.row + "," + cell.col);
    }
  });
  cwCheckComplete();
}

function cwCheckComplete() {
  if (!cwSlots) return;
  for (var i = 0; i < cwSlots.length; i++) {
    var slot = cwSlots[i];
    if (!slot.word) continue;
    for (var j = 0; j < slot.cells.length; j++) {
      var el = cwGetCellEl(slot.cells[j].row, slot.cells[j].col);
      if (!el) return;
      if (el.querySelector(".cw-letter").textContent.toUpperCase() !== slot.word[j]) return;
    }
  }
  cwStopClock();
  cwGenerated = false;
  document.getElementById("cw-congrats-time").textContent = "You solved it in " + cwFormatTime() + "!";
  document.getElementById("cw-congrats-overlay").classList.add("visible");
}

function cwCloseCongrats() {
  document.getElementById("cw-congrats-overlay").classList.remove("visible");
}
