// Global variables
let originalText = '';
let blockedText = '';
let articleTitle = '';
const commonWords = ['the', 'and', 'is', 'in', 'it', 'to', 'of', 'a', 'with']; // Common words to not block

// Fetch a random Wikipedia article
async function fetchArticle() {
    try {
        console.log("Fetching random article...");

        // Fetch a random article title
        const apiUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*';
        const response = await fetch(apiUrl);
        const data = await response.json();

        console.log("API Response:", data);

        if (!data.query || !data.query.random || data.query.random.length === 0) {
            console.error("No random articles found in the API response.");
            document.getElementById('article').innerText = "No articles found.";
            return;
        }

        const article = data.query.random[0];
        articleTitle = article.title;
        console.log("Random article title:", articleTitle);

        // Fetch the full text of the article
        const articleResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${articleTitle}&prop=text&format=json&origin=*`);
        const articleData = await articleResponse.json();
        console.log("Article fetched:", articleData);

        if (!articleData.parse || !articleData.parse.text) {
            console.error("Article text not found.");
            document.getElementById('article').innerText = "Article text not found.";
            return;
        }

        const htmlText = articleData.parse.text['*'];
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        originalText = doc.body.innerText;
        console.log("Article text:", originalText);

        // Block out words and display the article
        blockWords();
        document.getElementById('article').innerText = blockedText;
    } catch (error) {
        console.error("Error fetching article:", error);
        document.getElementById('article').innerText = "Error loading article.";
    }
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

// Reveal the entire article
function revealArticle() {
    document.getElementById('article').innerText = originalText; // Reveal full article
    document.getElementById('result').innerText = "Article revealed!";
}

// Initialize the game
fetchArticle();


