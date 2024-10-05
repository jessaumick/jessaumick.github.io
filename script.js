// Global variables
let originalHtml = '';
let blockedHtml = '';
let articleTitle = '';
let blockedTitle = '';
const currentCategory = 'Drug_culture'; // Default category is now Drug culture
const commonWords = ['the', 'and', 'is', 'in', 'it', 'to', 'of', 'a', 'with']; // Common words to not block

console.log("Script loaded"); // Check if script is being loaded

// Fetch a random Wikipedia article based on the "Drug culture" category
async function fetchArticle() {
    try {
        console.log("Fetching article...");

        // Fetch articles from the "Drug culture" category
        const category = encodeURIComponent(currentCategory);
        const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${category}&cmlimit=500&format=json&origin=*`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        // Log full response for debugging
        console.log("Full API Response:", data);

        // Handle the category-based article case
        if (!data.query || !data.query.categorymembers || data.query.categorymembers.length === 0) {
            console.error("No articles found in the specified category.");
            document.getElementById('article').innerText = "No articles found in the specified category.";
            return;
        }

        let articleWithExtract = null;

        // Loop through articles until we find one with an extract
        for (let i = 0; i < data.query.categorymembers.length; i++) {
            const article = data.query.categorymembers[i];
            articleTitle = article.title;
            console.log("Attempting article:", articleTitle);

            // Fetch the content of the selected article
            const articleResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=extracts&exintro&explaintext=true&format=json&origin=*`);
            const articleData = await articleResponse.json();

            if (!articleData.query || !articleData.query.pages) {
                console.warn("Article text not found for:", articleTitle);
                continue;  // Skip to the next article
            }

            const page = Object.values(articleData.query.pages)[0];
            if (page.extract) {
                articleWithExtract = page;
                break;  // Exit the loop once an article with an extract is found
            }
        }

        // If no article with extract was found
        if (!articleWithExtract) {
            console.error("No article with an extract found.");
            document.getElementById('article').innerText = "No articles with an extract found in the specified category.";
            return;
        }

        // Article with an extract found, process and block words
        originalHtml = articleWithExtract.extract;
        blockedHtml = originalHtml; // Copy original extract
        blockedTitle = blockText(articleTitle); // Block the article title

        console.log("Original Article HTML:", originalHtml);

        // Block out words in the article body
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

// Initialize the game by fetching the first article from the "Drug culture" category
fetchArticle();

// Add event listener to guessBox to submit guess on Enter key press
document.getElementById('guessBox').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission
        guessWord(); // Call the function to process the guess
    }
});
