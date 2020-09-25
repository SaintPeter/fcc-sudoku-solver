/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

require("@babel/polyfill");
const chai = require("chai");
const assert = chai.assert;
const puppeteer = require('puppeteer');
let { puzzlesAndSolutions } = require('../public/puzzle-strings.js');
require('dotenv').config();

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let browser;
let page;

suite('Functional Tests', () => {
  suiteSetup( function (done) {
    this.timeout(20000);
    // DOM already mocked -- load sudoku solver then run tests
    // Puzzle = require('../public/sudoku-solver.js').Puzzle;
    const opts = {
      //headless: false,
      //slowMo: 25,
      timeout: 10000
    };

    new Promise(async (resolve) => {
      browser = await puppeteer.launch(opts);
      page = await browser.newPage();
      await page.goto('http://localhost:' + process.env.PORT || 3000);
      resolve();
    }).then(() => done());
  });
  
  suite('Text area and sudoku grid update automatically', () => {
    // Entering a valid number in the text area populates 
    // the correct cell in the sudoku grid with that number
    test('Valid number in text area populates correct cell in grid', (done) => {
      let numberTests = [
        ['#B2',5, '.........' + '.5.......' + '.........' + '.........' + '.........' + '.........' + '.........' + '.........' + '.........'],
        ['#D9',7, '.........' + '.........' + '.........' + '........7' + '.........' + '.........' + '.........' + '.........' + '.........'],
        ['#I2',2, '.........' + '.........' + '.........' + '.........' + '.........' + '.........' + '.........' + '.........' + '.2.......']
      ];

      new Promise(async (resolve) => {
        for (let [addr, val, grid] of numberTests){
          // Clear the input box
          await page.focus('#text-input');
          await page.keyboard.down('Control');
          await page.keyboard.down('A');
          await page.keyboard.up('Control');
          await page.keyboard.press('Delete');

          // type in input
          await page.type('#text-input', grid);

          let element = await page.$(addr);
          let value = await (await element.getProperty('value')).jsonValue();

          assert.equal(val, value);
        }
        resolve();
      }).then(() => done());
    });

    // Entering a valid number in the grid automatically updates
    // the puzzle string in the text area
    test('Valid number in grid updates the puzzle string in the text area', done => {
      let gridTests = [
        ['#C3', 1, 20 ],
        ['#E3', 4, 38 ],
        ['#H4', 7, 66 ]
      ];

      new Promise(async (resolve) => {
        for (let [addr, val, offset] of gridTests){
          await page.click('#clear-button');
          await page.focus(addr);
          await page.type(addr, val.toString());

          let element = await page.$('#text-input');
          let value = await (await element.getProperty('value')).jsonValue();

          assert.equal(val, value[offset]);
        }
        resolve();
      }).then(() => done());
    });
  });
  
  suite('Clear and solve buttons', () => {
    // Pressing the "Clear" button clears the sudoku 
    // grid and the text area
    test('Function clearInput()', done => {
      let blankBoard = '.................................................................................';
      new Promise(async (resolve) => {
        await page.click('#clear-button');
        let element = await page.$('#text-input');
        let value = await (await element.getProperty('value')).jsonValue();
        assert.equal(blankBoard, value);
        resolve();
      }).then(() => done())
    });
    
    // Pressing the "Solve" button solves the puzzle and
    // fills in the grid with the solution
    test('Function showSolution(solve(input))', done => {
      new Promise(async (resolve) => {
        for (let [puzzle, solution] of puzzlesAndSolutions){
          // Clear the input box
          await page.focus('#text-input');
          await page.keyboard.down('Control');
          await page.keyboard.down('A');
          await page.keyboard.up('Control');
          await page.keyboard.press('Delete');

          // type in input
          await page.type('#text-input', puzzle);

          // Solve it
          await page.click('#solve-button');

          // Check the solution
          let element = await page.$('#text-input');
          let value = await (await element.getProperty('value')).jsonValue();

          assert.equal(solution, value);
        }
        resolve();
      }).then(() => done());
    });
  });

  suiteTeardown('Teardown', async () => {
    if(browser) {
      await browser.close();
    }
  });

});

