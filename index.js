// Load Monaco Editor
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' } });
require(['vs/editor/editor.main'], function () {
    const editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: "// Enter a snippet URL above and click 'Fetch and Inject Snippet'",
        language: 'php',
        theme: 'vs-dark',
    });

    // Function to extract the snippet slug from the URL
    function extractSlug(url) {
        const matches = url.match(/\/snippet\/([^/]+)/);
        return matches ? matches[1] : null;
    }

    // Function to clean and sanitize snippet
    function cleanSnippet(encodedSnippet) {
        const parser = new DOMParser();
        const decodedSnippet = parser.parseFromString(encodedSnippet, 'text/html').body.textContent;

        // Replace smart quotes with standard quotes
        const sanitizedSnippet = decodedSnippet
            .replace(/‘|’/g, "'") // Replace smart single quotes with straight single quotes
            .replace(/“|”/g, '"'); // Replace smart double quotes with straight double quotes

        return sanitizedSnippet;
    }

    // Function to load all snippets
    async function loadAllSnippets() {
        try {
            const apiUrl = 'https://generatewp.com/wp-json/wp/v2/snippet';
            const response = await fetch(apiUrl);
            const snippets = await response.json();

            const snippetListing = document.getElementById('snippet-listing');
            snippetListing.innerHTML = ''; // Clear existing snippets

            snippets.forEach(snippet => {
                const snippetItem = document.createElement('div');
                snippetItem.className = 'snippet-item bg-gray-200 p-2 rounded-md cursor-pointer';
                snippetItem.textContent = snippet.title.rendered;

                // Add click event to insert snippet into editor
                snippetItem.addEventListener('click', () => {
                    const cleanedContent = cleanSnippet(snippet.content.rendered);
                    const finalContent = `<?php\n${cleanedContent}`;
                    editor.setValue(finalContent);
                });

                snippetListing.appendChild(snippetItem);
            });
        } catch (error) {
            console.error('Error loading snippets:', error);
            alert('An error occurred while loading snippets. Please try again later.');
        }
    }

    // Call loadAllSnippets on page load
    loadAllSnippets();

    // Fetch and inject the snippet into the editor
    document.getElementById('fetch-snippet').addEventListener('click', async () => {
        const url = document.getElementById('snippet-url').value.trim();
        const slug = extractSlug(url);

        if (!slug) {
            alert('Invalid URL! Please ensure it matches the pattern: https://generatewp.com/snippet/{slug}/');
            return;
        }

        try {
            const apiUrl = `https://generatewp.com/wp-json/wp/v2/snippet?slug=${slug}`;
            const response = await fetch(apiUrl);
            const snippets = await response.json();

            if (snippets && snippets.length > 0) {
                const snippetContent = snippets[0].content.rendered;
                const cleanedContent = cleanSnippet(snippetContent);

                // Prepend <?php to the cleaned content
                const finalContent = `<?php\n${cleanedContent}`;

                // Set content in Monaco Editor
                editor.setValue(finalContent);
            } else {
                alert('Snippet not found!');
            }
        } catch (error) {
            console.error('Error fetching snippet:', error);
            alert('An error occurred while fetching the snippet. Please try again later.');
        }
    });
});