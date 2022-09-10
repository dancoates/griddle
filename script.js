(async function() {

    const wordsResp = await fetch('./words.txt');
    const wordsList = await wordsResp.text();
    const allWords = wordsList.split('\n');

    const container = document.getElementById('container');

    const randomLetter = (list) => list[Math.floor(Math.random() * list.length)];

    const gridSize = 5;
    const words = allWords.filter(ww => ww.length === gridSize).map(ww => ww.toLowerCase())

    let grid = [];

    const letterWeights = words.reduce((letters, word) => {
        word.split('').forEach((letter, index) => {
            letters[index].push(letter);
        });
        return letters;
    }, new Array(gridSize).fill([]));


    function populateGrid() {
        grid = [];
        container.innerHTML = '';

        for(let i = 0; i < gridSize; i++) {
            grid[i] = [];
            const row = document.createElement('div');
            row.className = 'row';

            for(let j = 0; j < gridSize; j++) {
                const elem = document.createElement('div');
                elem.className = 'letter';
                const getUniqueLetter = () => {
                    const letter = randomLetter(letterWeights[j]);
                    if(grid[i].includes(letter)) return getUniqueLetter();
                    return letter;
                }
                const uniqueLetter = getUniqueLetter();
                grid[i][j] = uniqueLetter;

                elem.textContent = uniqueLetter;
                row.appendChild(elem);
            }
            container.appendChild(row);
        }
    }

    populateGrid();

    const start = Date.now();
    function detectWords() {
        const count = Math.pow(gridSize, gridSize);
        const wordsInGrid = [];

        for(let i = 0; i < count; i ++) {
            let letters = [];
            for(let j = 0; j < gridSize; j ++) {
                const divisor = Math.pow(gridSize, gridSize - j - 1);
                const index = Math.floor(i / divisor) % gridSize;
                letters.push(grid[j][index]);
            }

            const word = letters.join('');

            if(words.indexOf(word) !== -1) {
                wordsInGrid.push(word);
            }
        }
        return wordsInGrid;
    }

    const gridWords = detectWords();
    console.log('generating word list', Date.now() - start)
    console.log(Date.now() - start);
    console.log(gridWords);


})();