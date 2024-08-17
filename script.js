// Global variables
let originalHtml = '';
let blockedHtml = '';
let articleTitle = '';
let currentCategory = 'all'; // Default category
const commonWords = ['the', 'and', 'is', 'in', 'it', 'to', 'of', 'a', 'with']; // Common words to not block

console.log("Script loaded"); // Check if script is being loaded

// Fetch a random Wikipedia article based on the current category
async function fetchArticle() {
    try {
        console.log("Fetching random article...");

        let apiUrl;
        if (currentCategory === 'all') {
            apiUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*';
        } else {
            const category = encodeURIComponent(currentCategory);
            apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*&rbgcategories=${category}`;
        }

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

        const articleResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${articleTitle}&prop=extracts&exintro&format=json&origin=*`);
        const articleData = await articleResponse.json();
        console.log("Article fetched:", articleData);

        if (!articleData.query || !articleData.query.pages) {
            console.error("Article text not found.");
            document.getElementById('article').innerText = "Article text not found.";
            return;
        }

        const page = Object.values(articleData.query.pages)[0];
        if (!page.extract) {
            console.error("Extract not found.");
            document.getElementById('article').innerText = "Extract not found.";
            return;
        }

        originalHtml = page.extract;
        blockedHtml = originalHtml;
        console.log("Article HTML:", originalHtml);

        // Insert the title as an <h2> within the article
        const articleContent = `
            <h2 style="text-align: center;">${articleTitle}</h2>
            ${blockedHtml}
        `;

        document.getElementById('article').innerHTML = articleContent;
    } catch (error) {
        console.error("Error fetching article:", error);
        document.getElementById('article').innerText = "Error loading article.";
    }
}

// Block out words except for common ones
function blockWords() {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalHtml;

    const textNodes = Array.from(tempDiv.querySelectorAll('*')).reduce((acc, element) => {
        return acc.concat(Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE));
    }, []);

    textNodes.forEach(node => {
        const text = node.textContent;
        const blockedText = text.replace(/\b\w+\b/g, (word) => {
            if (commonWords.includes(word.toLowerCase())) {
                return word;
            } else {
                return '█'.repeat(word.length);
            }
        });
        node.textContent = blockedText;
    });

    blockedHtml = tempDiv.innerHTML;
}

// Handle word guesses
function guessWord() {
    const guess = document.getElementById('guessBox').value.trim().toLowerCase();
    const regex = new RegExp(`\\b${guess}\\b`, 'gi');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = blockedHtml;

    Array.from(tempDiv.querySelectorAll('*')).forEach(element => {
        if (element.nodeType === Node.ELEMENT_NODE) {
            Array.from(element.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    const updatedText = text.replace(regex, (match) => originalHtml.match(new RegExp(`\\b${match}\\b`, 'i'))[0]);
                    node.textContent = updatedText;
                }
            });
        }
    });

    blockedHtml = tempDiv.innerHTML;
    document.getElementById('article').innerHTML = blockedHtml;
    document.getElementById('guessBox').value = '';
}

// Handle title guess
function guessTitle() {
    const guess = document.getElementById('titleGuess').value.trim();
    if (guess.toLowerCase() === articleTitle.toLowerCase()) {
        document.getElementById('result').innerHTML = `
            <p>Congratulations! You've guessed the article title!</p>
            <p>Article Title: <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}" target="_blank">${articleTitle}</a></p>
        `;
        document.getElementById('article').innerHTML = originalHtml; // Reveal full article
    } else {
        document.getElementById('result').innerText = "Incorrect title guess, try again!";
    }
}

// Reveal the entire article
function revealArticle() {
    document.getElementById('article').innerHTML = originalHtml; // Reveal full article
    document.getElementById('result').innerHTML = `
        <p>Article revealed!</p>
        <p><a href="https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}" target="_blank">${articleTitle}</a></p>
    `;
}

// Switch categories
function switchCategory(category) {
    currentCategory = category;
    fetchArticle(); // Fetch a new article based on the selected category
}

// Initialize the game
fetchArticle();

