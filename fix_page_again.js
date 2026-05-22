const fs = require('fs');
const pagePath = 'apps/web/app/workspace/create/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Add AtomicIdea interface and MOCK_ATOMIC_IDEAS
const mockContent = `const MOCK_ATOMIC_IDEAS: AtomicIdea[] = [
  { idea: "Building a personal brand isn't about being loud, it's about being consistent.", whyInteresting: "Challenges the misconception that virality is required.", targetAudience: "Founders" },
  { idea: "The best newsletters are just public thinking.", whyInteresting: "Lowers the barrier to entry for new creators.", targetAudience: "Creators" },
  { idea: "Stop trying to write for everyone. Pick one person and solve their problem.", whyInteresting: "Actionable advice for niche targeting.", targetAudience: "Marketers" }
];\n\nexport interface AtomicIdea {
  idea: string;
  whyInteresting: string;
  targetAudience: string;
}\n\n`;

if (!content.includes('interface AtomicIdea')) {
    content = content.replace(/(export default function CreatePage\(\) \{)/, mockContent + '$1');
}

// 2. Change state types
content = content.replace(/const \[ideas, setIdeas\] = useState<string\[\]>\(\[\]\);/, `const [ideas, setIdeas] = useState<AtomicIdea[]>([]);
  const [contentGoal, setContentGoal] = useState<string>("Growing followers");
  const [patternInsights, setPatternInsights] = useState<string | null>(null);`);

// 3. Add useEffect for pattern insights
const effect = `
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(\`\${API_URL}/articles/insights\`, { credentials: 'include' })
      .then(res => res.json())
      .then((data: any) => {
        if (data.insight) setPatternInsights(data.insight);
      })
      .catch(err => console.error('Failed to fetch insights', err));
  }, [isLoggedIn]);
`;
if (!content.includes('fetch(`${API_URL}/articles/insights`')) {
    content = content.replace(/(const \[ideasMeta, setIdeasMeta\] = useState<\{ cached: boolean \} \| null>\(null\);)/, effect + '\n  $1');
}

// 4. Fix loadIdeas payload
content = content.replace(/body: JSON\.stringify\(\{ force \}\),/g, 'body: JSON.stringify({ force, contentGoal }),');

// 5. Fix setIdeas mapping
content = content.replace(/setIdeas\(data\.article\?\.angles \|\| \[\]\);/g, 'setIdeas((data.article?.angles as unknown as AtomicIdea[]) || []);');
content = content.replace(/setIdeas\(data\.article\.angles\);/g, 'setIdeas(data.article.angles as unknown as AtomicIdea[]);');
content = content.replace(/setIdeas\(extractData\.ideas \|\| \[\]\);/g, 'setIdeas((extractData.ideas as unknown as AtomicIdea[]) || []);');
content = content.replace(/setIdeas\(MOCK_ANGLES\);/g, 'setIdeas(MOCK_ATOMIC_IDEAS);');

// 6. Fix generateCarousel
content = content.replace(/const atomicIdea = ideas\[selectedIndex\];/g, 'const atomicIdea = ideas[selectedIndex];\n      if (!atomicIdea) return;');
content = content.replace(/atomicIdea,\n\s+aspectRatio,/g, 'atomicIdea: atomicIdea.idea,\n          aspectRatio,');

// 7. Fix generateDrafts
content = content.replace(/atomicIdeas,\n\s+attachLink,/g, 'atomicIdeas: atomicIdeas.map(a => a.idea),\n          attachLink,');

// 8. Fix UI rendering
const uiOld = /\{ideasMeta\?\.cached && <span className="shrink-0 self-start rounded-full bg-emerald-50 px-3 py-1 text-\[10px\] font-semibold text-emerald-800">Cached · no credit<\/span>\}\n\s+<\/div>/;
const uiNew = `{ideasMeta?.cached && <span className="shrink-0 self-start rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-800">Cached · no credit</span>}
                    </div>

                    {/* Content Goal Selector */}
                    <div className="mb-6 flex flex-col gap-2 rounded-xl bg-indigo-50/50 p-4 border border-indigo-100/50">
                      <label className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">Current Goal</label>
                      <select 
                        value={contentGoal} 
                        onChange={(e) => setContentGoal(e.target.value)}
                        className="w-full sm:w-64 rounded-lg border-indigo-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="Growing followers">Grow Followers (Hook-heavy/Provocative)</option>
                        <option value="Building authority">Build Authority (Deep insights/Nuance)</option>
                        <option value="Driving signups">Drive Signups (CTA-driven/Valuable)</option>
                      </select>
                    </div>

                    {/* Pattern Insights Banner */}
                    {patternInsights && (
                      <div className="mb-6 rounded-xl bg-amber-50 p-4 border border-amber-200">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-amber-600">✨</span>
                          <h4 className="text-sm font-bold text-amber-900">Pattern Detected</h4>
                        </div>
                        <p className="text-sm text-amber-800">{patternInsights}</p>
                      </div>
                    )}`;

if (!content.includes('Content Goal Selector')) {
    content = content.replace(uiOld, uiNew);
}

// 9. Fix idea mapping in UI
const listOld = /<li key=\{i\} className="min-w-0">\n\s+<button type="button" onClick=\{\(\) => toggleAngle\(i\)\} className=\{`flex h-full min-h-\[5\.5rem\] w-full flex-col rounded-2xl p-4 text-left text-sm leading-relaxed transition-colors \$\{on \? "bg-primary-50 text-zinc-900" : "bg-zinc-50\/80 text-zinc-800 hover:bg-zinc-100\/80"\} `}>\n\s+<span className="mb-2 text-\[10px\] font-bold text-zinc-400">Angle \{i \+ 1\}<\/span>\n\s+<span className="text-\[15px\] leading-snug">\{idea\}<\/span>\n\s+<\/button>\n\s+<\/li>/;

const listNew = `<li key={i} className="min-w-0">
                          <button type="button" onClick={() => toggleAngle(i)} className={\`flex h-full min-h-[5.5rem] w-full flex-col rounded-2xl p-5 text-left leading-relaxed transition-all \${on ? "bg-indigo-50 border border-indigo-200 text-zinc-900 shadow-sm" : "bg-white border border-zinc-200 text-zinc-800 hover:border-zinc-300 hover:shadow-sm"}\`}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{idea.targetAudience}</span>
                              <span className="text-[10px] font-bold text-zinc-400">Idea {i + 1}</span>
                            </div>
                            <span className="text-[15px] font-medium leading-snug text-zinc-900 mb-2">{idea.idea}</span>
                            <span className="text-xs text-zinc-500">{idea.whyInteresting}</span>
                          </button>
                        </li>`;

content = content.replace(listOld, listNew);

fs.writeFileSync(pagePath, content);
console.log("Successfully restored Atomic Ideas without breaking Carousels!");
