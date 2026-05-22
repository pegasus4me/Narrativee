const fs = require('fs');

const pagePath = 'apps/web/app/workspace/create/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Fix MOCK_ATOMIC_IDEAS import
content = content.replace(/MOCK_ATOMIC_IDEAS, /, '');

// 2. Fix fetch types in loadIdeas
content = content.replace(/article\?: \{ angles\?: string\[\] \}/g, 'article?: { angles?: AtomicIdea[] }');
content = content.replace(/setIdeas\(extractData\.ideas \|\| \[\]\);/g, 'setIdeas((extractData.ideas as AtomicIdea[]) || []);');

// 3. Fix selectedIndex in generateDrafts and generateCarousel
content = content.replace(/const selectedIndex = Array\.from\(selectedAngles\)\[0\];/g, 'const selectedIndex = Array.from(selectedAngles)[0];\n      if (selectedIndex === undefined) return;');
content = content.replace(/const atomicIdea = ideas\[selectedIndex\];/g, 'const atomicIdea = ideas[selectedIndex];');

// 4. Update atomicIdea payload from string to object string in generateCarousel and generateDrafts
content = content.replace(/body: JSON\.stringify\(\{\n\s+atomicIdea,\n\s+aspectRatio,\n\s+\}\),/g, 'body: JSON.stringify({\n          atomicIdea: atomicIdea.idea,\n          aspectRatio,\n        }),');

content = content.replace(/body: JSON\.stringify\(\{\n\s+atomicIdeas,\n\s+attachLink,\n\s+\}\),/g, 'body: JSON.stringify({\n          atomicIdeas: atomicIdeas.map(a => a.idea),\n          attachLink,\n        }),');

fs.writeFileSync(pagePath, content);

// 5. Fix mockData.ts
const mockPath = 'apps/web/app/components/workspace/shared/mockData.ts';
let mockContent = fs.readFileSync(mockPath, 'utf8');
mockContent = mockContent.replace(/export const MOCK_ANGLES = \[[\s\S]+?\];/, '');
fs.writeFileSync(mockPath, mockContent);

// 6. Fix DraftCard.tsx
const draftCardPath = 'apps/web/app/components/workspace/create/DraftCard.tsx';
let draftCardContent = fs.readFileSync(draftCardPath, 'utf8');
// Fix draft.content typing
draftCardContent = draftCardContent.replace(/draft\.content\.type/g, '(draft.content as any).type');
draftCardContent = draftCardContent.replace(/draft\.content\.slides\?/g, '(draft.content as any).slides?');
fs.writeFileSync(draftCardPath, draftCardContent);

console.log("Successfully fixed frontend TS errors!");
