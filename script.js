const alphabet = 'abcdefghijklmnopqrstuvwxyz';
let gridSize = 5;
let gridType = 'today';

function createGrid(gridSize, words, randomItem) {
    const grid = [];
    for(let i = 0; i < gridSize; i++) {
        const letterWeights = getLetterWeights(words, grid);
        grid[i] = [];

        for(let j = 0; j < gridSize; j++) {
            const getUniqueLetter = () => {
                const letter = randomItem(letterWeights);
                if(grid[i].includes(letter)) return getUniqueLetter();
                return letter;
            }
            const uniqueLetter = getUniqueLetter();
            grid[i][j] = uniqueLetter;
        }
    }
    return grid;
}


function renderGrid(grid, container, opts) {
    container.innerHTML = '';
    for(let y = 0; y < grid.length; y++) {
        const row = document.createElement('div');
        row.className = `row ${y === 0 ? 'clickable' : ''}`;
        for(let x = 0; x < grid[y].length; x++) {
            const elem = document.createElement('div');
            elem.className = 'letter';
            elem.textContent = grid[y][x];
            elem.addEventListener('click', (e) => {
                e.preventDefault();
                e.target.parentElement.querySelectorAll('.selected').forEach(elem => {
                    elem.classList.remove('selected');
                });
                e.target.classList.toggle('selected');
                opts.onClick();
            });
            row.appendChild(elem);
        }
        container.appendChild(row);
    }
}


let wordsFuture;

async function getWords(gridSize) {
    wordsFuture = wordsFuture || fetch('./words.txt').then(resp => resp.text());
    const wordsList = await wordsFuture;
    const allWords = wordsList.split('\n');
    return allWords.filter(ww => ww.length === gridSize).map(ww => ww.toLowerCase());
}


function getStringsInGrid(grid) {
    const gridSize = grid.length;
    const count = Math.pow(gridSize, gridSize);
    const wordsInGrid = [];

    for(let i = 0; i < count; i ++) {
        let word = '';
        for(let j = 0; j < gridSize; j ++) {
            const divisor = Math.pow(gridSize, gridSize - j - 1);
            const index = Math.floor(i / divisor) % gridSize;
            word = word + grid[j][index];
        }
        wordsInGrid.push(word);
    }
    return wordsInGrid;
}

function getLetterWeights(words, prevRows) {
    const index = prevRows.length;
    const prevRowLetters = prevRows.map(row => row.join(''));
    let prefixes = new Set();
    if(prevRows.length > 0) {
        const gridSize = prevRows[0].length;
        const rowsToFill = gridSize - prevRows.length;
        const rows = new Array(rowsToFill).fill(new Array(gridSize).fill('.'));
        const fullGrid = [...prevRows, ...rows];
        const words = getStringsInGrid(fullGrid);
        prefixes = new Set(words.map(word => word.substring(0, prevRows.length, 2)));
    }

    const weightedLetters = [];

    words.forEach(word => {
        if(prevRows.length === 0) weightedLetters.push(word[index]);
        const wordPrefix = word.substring(0, prevRows.length, 2);
        if(prefixes.has(wordPrefix)) {
            weightedLetters.push(word[index]);
        }
    });


    return alphabet.split('').concat(weightedLetters);
}



function calcScores(gridWords) {
    const gridSize = gridWords[0].length;

    return gridWords.map(word => {
        const rows = [];
        let totalScore = 0;

        for(let i = 0; i < gridSize; i++) {
            const prefix = word.substring(0, i + 1);
            const matchedWords = gridWords.filter(ww => ww.indexOf(prefix) === 0);
            rows.push({score: matchedWords.length, words: matchedWords, prefix});
            totalScore += matchedWords.length;
        }
        return {word, rows, totalScore};
    }).sort((a,b) => b.totalScore - a.totalScore);
}

function renderStats(scoredWords) {
    const elem = document.querySelector('.stats');

    const text = `there are ${scoredWords.length} words. the highest possible score is ${scoredWords[0].totalScore}. the lowest possible score is ${scoredWords[scoredWords.length -1].totalScore}.`
    elem.textContent = text;
}


function renderResult(word, scoredWords, letterElems) {
    const elem = document.querySelector('.result');

    const matchedWord = scoredWords.find(ww => ww.word === word);
    let text = '';

    document.querySelectorAll('.row').forEach(ii => ii.setAttribute('style', ''));

    if(matchedWord) {

        elem.textContent = `${word} has a score of ${matchedWord.totalScore}`;
        elem.classList.add('correct');


        letterElems.forEach(letter => {
            const parent = letter.parentElement;
            const siblings = Array.from(parent.querySelectorAll('.letter'));
            const middleLetter = siblings[Math.floor((siblings.length - 1) / 2)];

            const selectedLetterBox = letter.getBoundingClientRect();
            const middleLetterBox = middleLetter.getBoundingClientRect();

            const offset = middleLetterBox.x - selectedLetterBox.x;

            parent.setAttribute('style', `transform: translateX(${offset}px)`);
        })

    } else {
        elem.textContent = `${word} is not a word`;
        elem.classList.remove('correct');
    }
}

function setupConfig() {
    document.querySelector('.how-to-play').addEventListener('click', () => {
        document.querySelector('.instructions').classList.add('visible');
    });

    document.addEventListener('click', (e) => {
        if(e.target !== document.querySelector('.how-to-play')) {
            document.querySelector('.instructions').classList.remove('visible');
        }
    });


    document.querySelectorAll('[data-theme]').forEach(el => {
        el.addEventListener('click', (e) => {
            const theme = e.target.dataset.theme;
            localStorage.setItem('theme', theme);
            e.target.parentElement.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            if(theme === 'dark') {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }

        });
    });


    document.querySelectorAll('[data-gridtype]').forEach(el => {
        el.addEventListener('click', (e) => {
            gridType = e.target.dataset.gridtype;
            e.target.parentElement.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            setupGame(gridSize, gridType);
        });
    });

    document.querySelectorAll('[data-gridsize]').forEach(el => {
        el.addEventListener('click', (e) => {
            gridSize = parseInt(e.target.dataset.gridsize);
            e.target.parentElement.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            setupGame(gridSize, gridType);
        });
    });
}

async function setupGame(gridSize, gridType) {
    try {
        if(window.localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark');
            document.querySelectorAll('[data-theme]').forEach(el => el.classList.remove('active'));
            document.querySelector('[data-theme="dark"]').classList.add('active');
        }
    } catch(err) {
        console.warn('unable to get theme from local storage', err);
    }

    const container = document.getElementById('grid');

    const randomItem = (list) => list[Math.floor(Math.random() * list.length)];

    const randomItemDay = (() => {
        const rng = new Math.seedrandom(new Date().toISOString().substring(0, 10) + `-${gridSize}`);
        return (list) => list[Math.floor(rng() * list.length)];
    })();

    const randomMethod = gridType === 'today' ? randomItemDay : randomItem;

    const words = await getWords(gridSize);
    const grid = createGrid(gridSize, words, randomMethod);

    const wordSet = new Set(words);
    const gridStrings = getStringsInGrid(grid, wordSet);
    const gridWords = gridStrings.filter(ss => wordSet.has(ss));
    const scoredWords = calcScores(gridWords);

    document.querySelector('.result').textContent = '';

    renderGrid(grid, container, {
        onClick: () => {
            const letterElems = Array.from(document.querySelectorAll('.letter.selected'));
            const letters = letterElems.map(ee => ee.textContent);
            const word = letters.join('');
            if(word.length === gridSize) {
                renderResult(word, scoredWords, letterElems);
            } else {
                document.querySelector('.result').textContent = '';
            }
        }
    });


    renderStats(scoredWords);
}


setupConfig();
setupGame(gridSize, gridType).catch(err => console.error(err));
