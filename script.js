// Global variables
let originalText = '';
let blockedText = '';
let articleTitle = '';
const commonWords = ['the', 'and', 'is', 'in', 'it', 'to', 'of', 'a', 'with']; // Common words to not block

// Fetch a random article from "Medical conditions" category
async function fetchArticle() {
    const apiUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Medical_conditions&cmlimit=1&format=json&origin=*';

    const response = await fetch(apiUrl);
    const data = await response.json();
    const article = data.query.categorymembers[0];
    articleTitle = article.title;

    const articleResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${articleTitle}&prop=text&format=json&origin=*`);
    const articleData = await articleResponse.json();

    // Extract plain text from article
    const htmlText = articleData.parse.text['*'];
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    originalText = doc.body.innerText;

    // Block out words and display the article
    blockWords();
    document.getElementById('article').innerText = blockedText;
}

// Block out words except for common ones
function blockWords() {
    blockedText = originalText.replace(/\b\w+\b/g, (word) => {
        if (commonWords.includes(word.toLowerCase())) {
            return word;
        } else {
            return '█'.repeat(word.length);
        }
    });
}

// Handle word guesses
function guessWord() {
    const guess = document.getElementById('guessBox').value.trim().toLowerCase();
    const regex = new RegExp(`\\b${guess}\\b`, 'gi');
    blockedText = blockedText.replace(regex, (match) => originalText.match(new RegExp(`\\b${match}\\b`, 'i'))[0]);
    document.getElementById('article').innerText = blockedText;
    document.getElementById('guessBox').value = '';
}

// Handle title guess
function guessTitle() {
    const guess = document.getElementById('titleGuess').value.trim();
    if (guess.toLowerCase() === articleTitle.toLowerCase()) {
        document.getElementById('result').innerText = "Congratulations! You've guessed the article title!";
        document.getElementById('article').innerText = originalText; // Reveal full article
    } else {
        document.getElementById('result').innerText = "Incorrect title guess, try again!";
    }
}

// Initialize the game
fetchArticle();

