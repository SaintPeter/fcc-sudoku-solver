const textArea = document.getElementById('text-input');

const WIDTH = 9;
const HEIGHT = 9;
let puzzle;

document.addEventListener('DOMContentLoaded', () => {
  // Load a simple puzzle into the text area
  textArea.value = '..9..5.1.85.4....2432......1...69.83.9.....6.62.71...9......1945....4.37.4.3..6..';
  puzzle = new Puzzle(textArea.value)
  puzzle.writeToDOM();
});

document.addEventListener('keydown', docKeydownListener);
textArea.addEventListener('input', textAreaInputHandler)
document.addEventListener('input', docInputEventHandler);


// Handle matrix input
function docKeydownListener(e) {
  if (isCell(e.target)) {
    // Ignore certain control characters
    const whitelist = {"Tab": 1, "Backspace": 1, "Delete": 1};
    if (whitelist.hasOwnProperty(e.key)) {
      return;
    }

    // Only allow updates from numeric entries
    if (e.key.match(/[^1-9]/)) {
      e.preventDefault();
    } else {
      e.target.value = "";
    }
  }
}

function textAreaInputHandler() {
  trySetPuzzle();
}

function trySetPuzzle() {
  if (textArea.value.length === WIDTH * HEIGHT) {
    puzzle = new Puzzle(textArea.value);
    puzzle.writeToDOM()
    setError( "");
  } else {
    setError( "Error: Expected puzzle to be 81 characters long.");
  }
}

function docInputEventHandler(e) {
  if (isCell(e.target)) {
    puzzle.updateAddress(e.target.id, e.target.value);
    textArea.value = puzzle.exportString();
  }
}

// Checks to see if a target is one of the cells
// in the puzzle matrix
function isCell(target) {
  return target.tagName === "INPUT"
    && target.classList.length
    && target.classList[0] === 'sudoku-input';
}


function setError(errString) {
  document.getElementById('error-msg').innerText = errString;
}

// Button Handlers
document.getElementById("solve-button")
  .addEventListener('click',solveButtonClickHandler);
document.getElementById("clear-button")
  .addEventListener('click', clearButtonClickHandler);

function solveButtonClickHandler(e)  {
    if(puzzle) {
      if(!puzzle.tryToSolve()) {
        setError("Unable to solve!");
      } else {
        puzzle.writeToDOM();
        textArea.value = puzzle.exportString();
      }
    }
  }

function clearButtonClickHandler() {
  puzzle.clear();
  textArea.value = puzzle.exportString();
}


// Handle puzzle string input
textArea.addEventListener('input', (e) => {
  if (textArea.value.length === WIDTH * HEIGHT) {
    if (textArea.value.match(/[1-9.]/g)) {
      puzzle = new Puzzle(textArea.value);
      puzzle.writeToDOM();
    } else {
      setError( "Error: Expected puzzle to be 81 characters long.");
    }
  }
})


class Puzzle {
  constructor(input) {
    this.importString(input);
  }

  clear() {
    this._puzzle = [];
    for (let row = 0; row < WIDTH; row++) {
      this._puzzle.push([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    this.writeToDOM();
  }

  importString(input) {
    if (input.length !== WIDTH * HEIGHT) {
      throw Error('Wrong input length');
    }
    this._puzzle = [];
    for (let row = 0; row < WIDTH; row++) {
      this._puzzle.push([]);
      for (let col = 0; col < HEIGHT; col++) {
        let val = input.charAt(row * WIDTH + col);
        if (Puzzle.validInput(val)) {
          this._puzzle[row][col] = parseInt(val);
        } else {
          this._puzzle[row][col] = 0;
        }
      }
    }
  }

  exportString(input) {
    let output = "";
    for (let row = 0; row < WIDTH; row++) {
      for (let col = 0; col < HEIGHT; col++) {
        output += this._puzzle[row][col] ? this._puzzle[row][col].toString() : ".";
      }
    }
    return output;
  }

  writeToDOM() {
    for (let row = 0; row < WIDTH; row++) {
      let rowLetter = String.fromCharCode('A'.charCodeAt(0) + row);
      for (let col = 0; col < HEIGHT; col++) {
        let cell = document.getElementById(rowLetter + (col + 1));
        cell.value = this._puzzle[row][col] || '';
      }
    }
  }

  static validInput(input) {
    return typeof (input) === 'string' && input.length === 1 && !!input.match(/[1-9]/);
  }

  updateAddress(address, val) {
    if (val && !Puzzle.validInput(val)) {
      throw Error("Invalid Input Value '" + val + "'");
    }
    let {row, col} = this.idToRC(address);
    this._puzzle[row][col] = val ? parseInt(val) : 0;
  }

  idToRC(address) {
    let row = address.charCodeAt(0) - "A".charCodeAt(0);
    let col = parseInt(address[1]) - 1;
    if (row < 0 || row > HEIGHT - 1) {
      throw Error(`Row Value '${row}' out of range`);
    }
    if (col < 0 || col > WIDTH - 1) {
      throw Error(`Col Value '${col}' out of range`);
    }
    return {row, col};
  }

  getValue(row, col) {
    if (row < 0 || row > HEIGHT - 1) {
      throw Error(`Row Value '${row}' out of range`);
    }
    if (col < 0 || col > WIDTH - 1) {
      throw Error(`Col Value '${col}' out of range`);
    }
    return this._puzzle[row][col];
  }

  // Solving Code
  // Source: https://medium.com/@george.seif94/solving-sudoku-using-a-simple-search-algorithm-3ac44857fee8
  // Translated by from C++ by me

  // Returns a boolean which indicates whether any assigned entry
  // in the specified row matches the given number.
  usedInRow(grid, row, num) {
    for (let col = 0; col < WIDTH; col++) {
      if (grid[row][col] === num) {
        return true;
      }
    }
    return false;
  }

  // Returns a boolean which indicates whether any assigned entry
  // in the specified column matches the given number.
  usedInCol(grid, col, num) {
    for (let row = 0; row < HEIGHT; row++) {
      if (grid[row][col] === num) {
        return true;
      }
    }
    return false;
  }

  // Returns a boolean which indicates whether any assigned entry
  // within the specified 3x3 box matches the given number.
  usedInBox(grid, boxStartRow, boxStartCol, num) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (grid[row + boxStartRow][col + boxStartCol] === num) {
          return true;
        }
      }
    }
    return false;
  }

  // Returns a boolean which indicates whether it will be legal to assign
  // num to the given row,col location.
  isSafe(grid, row, col, num) {
    // Check if 'num' is not already placed in current row,
    // current column and current 3x3 box
    return !this.usedInRow(grid, row, num) &&
      !this.usedInCol(grid, col, num) &&
      !this.usedInBox(grid, row - row % 3, col - col % 3, num);
  }


  // Searches the grid to find an entry that is still unassigned. If
  // found, the reference parameters row, col will be set the location
  // that is unassigned, and true is returned. If no unassigned entries
  // remain, false is returned.
  getUnassignedLocation(grid) {
    for (let row = 0; row < HEIGHT; row++) {
      for (let col = 0; col < WIDTH; col++) {
        if (grid[row][col] === 0) {
          return [row, col];
        }
      }
    }
    return [10, 10];
  }

  // Check an existing complete solution to see if it's correct/complete
  solutionCheck() {
    for (let row = 0; row < HEIGHT; row++) {
      for (let col = 0; col < WIDTH; col++) {
        let num = this._puzzle[row][col];
        this._puzzle[row][col] = 0;
        if(num === 0 || !this.isSafe(this._puzzle,row, col, num)) {
          this._puzzle[row][col] = num;
          return false;
        }
        this._puzzle[row][col] = num;
      }
    }
    return true;
  }

  // Takes a partially filled-in grid and attempts to assign values to
  // all unassigned locations in such a way to meet the requirements
  // for Sudoku solution (non-duplication across rows, columns, and boxes)
  solveSudoku(grid) {
    // If the sudoku grid has been filled, we are done
    let [row, col] = this.getUnassignedLocation(grid)
    if (row === 10 || col === 10) {
      return true;
    }

    // Consider digits 1 to 9
    for (let num = 1; num <= 9; num++) {
      // If placing the current number in the current
      // unassigned location is valid, go ahead
      if (this.isSafe(grid, row, col, num)) {
        // Make tentative assignment
        grid[row][col] = num;

        // Do the same thing again recursively. If we go
        // through all of the recursions, and in the end
        // return true, then all of our number placements
        // on the sudoku grid are valid and we have fully
        // solved it
        if (this.solveSudoku(grid)) {
          return true;
        }

        // As we were not able to validly go through all
        // of the recursions, we must have an invalid number
        // placement somewhere. Lets go back and try a
        // different number for this particular unassigned location
        grid[row][col] = 0;
      }
    }

    // If we have gone through all possible numbers for the current unassigned
    // location, then we probably assigned a bad number early. Lets backtrack
    // and try a different number for the previous unassigned locations.
    return false;
  }

  tryToSolve() {
      return this.solveSudoku(this._puzzle)
  }

}


/* 
  Export your functions for testing in Node.
  Note: The `try` block is to prevent errors on
  the client side
*/

try {
  module.exports = {
    textAreaInputHandler,
    Puzzle
  }
} catch (e) {
  console.log(e);
}

