const fs = require('fs');

const pagePath = 'apps/web/app/workspace/create/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Add state variables
const stateVars = `
  const [generatingCarousel, setGeneratingCarousel] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:5">("4:5");
`;
content = content.replace(/(const \[generatingDrafts, setGeneratingDrafts\] = useState\(false\);)/, '$1\n' + stateVars);

// 2. Add generateCarousel function
const tempPage = fs.readFileSync('temp_page.tsx', 'utf8');
const generateCarouselCodeMatch = tempPage.match(/const generateCarousel = async \(\) => \{[\s\S]+?setGeneratingCarousel\(false\);\n    \}\n  \};/);

if (generateCarouselCodeMatch) {
    content = content.replace(/(const generateDrafts = async \(\) => \{)/, generateCarouselCodeMatch[0] + '\n\n  $1');
} else {
    console.error("Could not find generateCarousel code");
    process.exit(1);
}

// 3. Add UI controls
const uiControls = `
                        {/* Carousel generation options */}
                        <div className="flex items-center gap-2">
                          <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as "1:1" | "4:5")}
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 outline-none hover:bg-zinc-50"
                          >
                            <option value="4:5">Portrait (4:5)</option>
                            <option value="1:1">Square (1:1)</option>
                          </select>
                          <button
                            type="button"
                            disabled={generatingCarousel || generatingDrafts || selectedAngles.size === 0}
                            onClick={generateCarousel}
                            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-light text-white transition-colors hover:bg-violet-700 disabled:opacity-50 shrink-0"
                          >
                            {generatingCarousel ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Designing...
                              </>
                            ) : (
                              "Generate Carousel"
                            )}
                          </button>
                        </div>
`;

content = content.replace(/(<button type="button" disabled=\{generatingDrafts\} onClick=\{generateDrafts\} className="inline-flex items-center gap-2 rounded-xl bg-primary)/, uiControls + '\n                        $1');

fs.writeFileSync(pagePath, content);
console.log("Successfully inserted page changes!");
