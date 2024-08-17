async function fetchArticle() {
    try {
        console.log("Fetching article list...");
        const apiUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Medical_conditions&cmlimit=1&format=json&origin=*';
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log("Article list fetched:", data);

        if (!data.query || !data.query.categorymembers || data.query.categorymembers.length === 0) {
            console.error("No articles found in the category.");
            return;
        }

        const article = data.query.categorymembers[0];
        articleTitle = article.title;

        console.log("Fetching article:", articleTitle);
        const articleResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${articleTitle}&prop=text&format=json&origin=*`);
        const articleData = await articleResponse.json();
        console.log("Article fetched:", articleData);

        // Extract plain text from article
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
    }
}
