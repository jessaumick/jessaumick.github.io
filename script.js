// Global variables
let originalHtml = '';
let blockedHtml = '';
let articleTitle = '';
let blockedTitle = '';
let currentCategory = 'all'; // Default category
const commonWords = ['the', 'and', 'is', 'in', 'it', 'to', 'of', 'a', 'with']; // Common words to not block

console.log("Script loaded"); // Check if script is being loaded

// Fetch a random Wikipedia article based on the current category
async function fetchArticle() {
    try {
        console.log("Fetching article...");

        let apiUrl;
        if (currentCategory === 'all') {
            // Fetch a completely random article
            apiUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*';
        } else {
            // Fetch articles from a specific category (increase limit)
            const category = encodeURIComponent(currentCategory);
            apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${category}&cmlimit=50&format=json&origin=*`;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        console.log("API Response:", data);

        let article;
        if (currentCategory === 'all') {
            // Handle the random article case
            if (!data.query || !data.query.random || data.query.random.length === 0) {
                console.error("No random articles found in the API response.");
                document.getElementById('article').innerText = "No articles found.";
                return;
            }
            article = data.query.random[0];
        } else {
            // Handle the category-based article case
            if (!data.query || !data.query.categorymembers || data.query.categorymembers.length === 0) {
                console.error("No articles found in the specified category.");
                document.getElementById('article').innerText = "No articles found in the specified category.";
                return;
            }

            // Filter out non-articles (categories, redirects)
            const validArticles = data.query.categorymembers.filter(member => member.ns === 0);
            if (validArticles.length === 0) {
                console.error("No valid articles found in the specified category.");
                document.getElementById('article').innerText = "No valid articles found in the specified category.";
                return;
            }

            // Randomly select one article from the list of valid category members
            const randomIndex = Math.floor(Math.random() * validArticles.length);
            article = validArticles[randomIndex];
        }

        articleTitle = article.title;
        console.log("Selected article title:", articleTitle);

        // Fetch the content of the selected article
        const articleResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=extracts&exintro&format=json&origin=*`);
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
        blockedTitle = blockText(articleTitle);
        console.log("Article HTML:", originalHtml);

        // Block out words and display the article
        blockWords();

        // Insert the blocked title and blocked content
        document.getElementById('article').innerHTML = `
            <h2 style="text-align: center;">${blockedTitle}</h2>
            ${blockedHtml}
        `;
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

// Block text function for titles
function blockText(text) {
    return text.replace(/\b\w+\b/g, (word) => {
        if (commonWords.includes(word.toLowerCase())) {
            return word;
        } else {
            return '█'.repeat(word.length);
        }
    });
}

// Array to store correctly guessed words
let guessedWords = [];

// Handle word guesses
function guessWord() {
    const guess = document.getElementById('guessBox').value.trim().toLowerCase();
    if (!guess || guessedWords.includes(guess)) {
        return; // If the guess is empty or already guessed, do nothing
    }
    
    guessedWords.push(guess); // Add the new guess to the list of guessed words
    const regex = new RegExp(`\\b(${guessedWords.join('|')})\\b`, 'gi');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalHtml;

    const textNodes = Array.from(tempDiv.querySelectorAll('*')).reduce((acc, element) => {
        return acc.concat(Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE));
    }, []);

    textNodes.forEach(node => {
        const text = node.textContent;
        const updatedText = text.replace(regex, (match) => match);
        node.textContent = updatedText;
    });

    // Re-block the remaining words
    textNodes.forEach(node => {
        const text = node.textContent;
        const blockedText = text.replace(/\b\w+\b/g, (word) => {
            if (commonWords.includes(word.toLowerCase()) || guessedWords.includes(word.toLowerCase())) {
                return word;
            } else {
                return '█'.repeat(word.length);
            }
        });
        node.textContent = blockedText;
    });

    blockedHtml = tempDiv.innerHTML;

    document.getElementById('article').innerHTML = `
        <h2 style="text-align: center;">${blockedTitle}</h2>
        ${blockedHtml}
    `;

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
    document.getElementById('article').innerHTML = `
        <h2 style="text-align: center;">${articleTitle}</h2>
        ${originalHtml}
    `; // Reveal full article with title
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

// Add event listener to guessBox to submit guess on Enter key press
document.getElementById('guessBox').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission
        guessWord(); // Call the function to process the guess
    }
});

// Set the category to "Drug culture" for Weirdle mode
function setWeirdleMode() {
    switchCategory('Drug_culture');
}

// Add a button or a mechanism to trigger Weirdle mode
document.getElementById('weirdleButton').addEventListener('click', setWeirdleMode);
