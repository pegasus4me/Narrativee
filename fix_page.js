const fs = require('fs');

const pagePath = 'apps/web/app/workspace/create/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// Add content goal state
const stateVars = `
  const [ideas, setIdeas] = useState<AtomicIdea[]>([]);
  const [contentGoal, setContentGoal] = useState<string>("Growing followers");
  const [patternInsights, setPatternInsights] = useState<string | null>(null);
`;
content = content.replace(/const \[ideas, setIdeas\] = useState<AtomicIdea\[\]>\(\[\]\);/, stateVars);

// Update loadIdeas call
const loadIdeasRegex = /const extractRes = await fetch\(`\$\{API_URL\}\/articles\/\$\{article.id\}\/ideas`, \{\n\s+method: "POST", credentials: "include", headers: \{ "Content-Type": "application\/json" \},\n\s+body: JSON.stringify\(\{ force \}\),\n\s+\}\);/;
const loadIdeasReplace = `const extractRes = await fetch(\`\${API_URL}/articles/\${article.id}/ideas\`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force, contentGoal }),
      });`;
content = content.replace(loadIdeasRegex, loadIdeasReplace);

// Update Ideas rendering to include pattern insights and goal selector
const uiRegex = /\{ideasMeta\?\.cached && <span className="shrink-0 self-start rounded-full bg-emerald-50 px-3 py-1 text-\[10px\] font-semibold text-emerald-800">Cached · no credit<\/span>\}\n\s+<\/div>/;
const uiReplace = `{ideasMeta?.cached && <span className="shrink-0 self-start rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-800">Cached · no credit</span>}
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
content = content.replace(uiRegex, uiReplace);

// Fix mock angles for guest mode
content = content.replace(/MOCK_ANGLES/g, 'MOCK_ATOMIC_IDEAS');
content = content.replace(/const MOCK_ANGLES = \[.*\];/s, `const MOCK_ATOMIC_IDEAS: AtomicIdea[] = [
  { idea: "Building a personal brand isn't about being loud, it's about being consistent.", whyInteresting: "Challenges the misconception that virality is required.", targetAudience: "Founders" },
  { idea: "The best newsletters are just public thinking.", whyInteresting: "Lowers the barrier to entry for new creators.", targetAudience: "Creators" },
  { idea: "Stop trying to write for everyone. Pick one person and solve their problem.", whyInteresting: "Actionable advice for niche targeting.", targetAudience: "Marketers" }
];`);

fs.writeFileSync(pagePath, content);
console.log("Successfully updated page.tsx!");
