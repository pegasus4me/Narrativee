const fs = require('fs');
const pagePath = 'apps/web/app/workspace/create/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

const effect = `
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(\`\${API_URL}/articles/insights\`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.insight) setPatternInsights(data.insight);
      })
      .catch(err => console.error('Failed to fetch insights', err));
  }, [isLoggedIn]);
`;

if (!content.includes('fetch(`${API_URL}/articles/insights`')) {
    content = content.replace(/(const \[patternInsights, setPatternInsights\] = useState<string \| null>\(null\);)/, '$1\n' + effect);
    fs.writeFileSync(pagePath, content);
    console.log("Wired up insights!");
} else {
    console.log("Already wired up!");
}
