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

        originalHtml = articleWithExtract.extract;
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
