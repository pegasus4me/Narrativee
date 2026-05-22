const fs = require('fs');
const pagePath = 'apps/web/app/workspace/create/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

const mockContent = `const MOCK_ATOMIC_IDEAS: AtomicIdea[] = [
  { idea: "Building a personal brand isn't about being loud, it's about being consistent.", whyInteresting: "Challenges the misconception that virality is required.", targetAudience: "Founders" },
  { idea: "The best newsletters are just public thinking.", whyInteresting: "Lowers the barrier to entry for new creators.", targetAudience: "Creators" },
  { idea: "Stop trying to write for everyone. Pick one person and solve their problem.", whyInteresting: "Actionable advice for niche targeting.", targetAudience: "Marketers" }
];\n\n`;

content = content.replace(/(export interface AtomicIdea)/, mockContent + '$1');

content = content.replace(/as AtomicIdea\[\]/g, 'as unknown as AtomicIdea[]');

content = content.replace(/const atomicIdea = ideas\[selectedIndex\];/g, 'const atomicIdea = ideas[selectedIndex];\n      if (!atomicIdea) return;');

fs.writeFileSync(pagePath, content);
console.log("Fixed!");
