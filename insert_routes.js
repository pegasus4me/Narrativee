const fs = require('fs');

const articlesPath = 'apps/backend/src/routes/articles.ts';
let content = fs.readFileSync(articlesPath, 'utf8');

const tempArticles = fs.readFileSync('temp_articles.ts', 'utf8');
const generateCarouselCodeMatch = tempArticles.match(/\/\/ POST \/api\/articles\/:id\/generate-carousel[\s\S]+?\}\);/);
const refreshCarouselCodeMatch = tempArticles.match(/\/\/ POST \/api\/articles\/drafts\/:draftId\/refresh-carousel-bg[\s\S]+?\}\);/);

if (!generateCarouselCodeMatch || !refreshCarouselCodeMatch) {
    console.error("Could not find routes in temp_articles.ts");
    process.exit(1);
}

const generateCarouselCode = generateCarouselCodeMatch[0];
const refreshCarouselCode = refreshCarouselCodeMatch[0];

const insertIndex = content.indexOf('// PUT /api/articles/drafts/:draftId');
if (insertIndex === -1) {
    console.error("Could not find insertion point");
    process.exit(1);
}

content = content.slice(0, insertIndex) + generateCarouselCode + '\n\n' + refreshCarouselCode + '\n\n' + content.slice(insertIndex);

fs.writeFileSync(articlesPath, content);
console.log("Successfully inserted routes!");
