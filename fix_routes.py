import re
with open('apps/backend/src/routes/articles.ts', 'r') as f:
    content = f.read()

with open('temp_articles.ts', 'r') as f:
    temp_content = f.read()

lines = temp_content.split('\n')
endpoints = []
capturing = False
for line in lines:
    if line.startswith('// POST /api/articles/:id/generate-carousel'):
        capturing = True
    if line.startswith('// PUT /api/articles/drafts/:draftId'):
        capturing = False
    
    if capturing:
        endpoints.append(line)

endpoints_text = '\n'.join(endpoints) + '\n\n'

insert_point = '// PUT /api/articles/drafts/:draftId'
content = content.replace(insert_point, endpoints_text + insert_point)

with open('apps/backend/src/routes/articles.ts', 'w') as f:
    f.write(content)

print("Fixed articles.ts")
