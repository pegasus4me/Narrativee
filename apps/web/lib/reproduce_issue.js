
// Mock Lexical functions
function $createTextNode(text) {
    return {
        text,
        format: 0,
        toggleFormat: function (format) {
            console.log(`[Mock] Toggled format: ${format} on "${this.text}"`);
        }
    };
}

// The function to test
function parseInlineFormatting(text) {
    const nodes = [];

    // Regex to match **bold**, *italic*, and `code`
    // Group 2: bold, Group 3: italic, Group 4: code, Group 5: regular text
    // Improved Regex: Match formatting OR match text until next formatting char
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)|([\s\S]+?)(?=(\*\*|\*|`|$))/g;
    let match;

    // Safety break to prevent infinite loops in bad regex
    let loops = 0;
    while ((match = regex.exec(text)) !== null) {
        loops++;
        if (loops > 100) break;

        console.log("Match:", match[0], "Groups:", match.slice(1));

        if (match[2]) {
            // **bold**
            const textNode = $createTextNode(match[2]);
            textNode.toggleFormat("bold");
            nodes.push(textNode);
        } else if (match[3]) {
            // *italic*
            const textNode = $createTextNode(match[3]);
            textNode.toggleFormat("italic");
            nodes.push(textNode);
        } else if (match[4]) {
            // `code`
            const textNode = $createTextNode(match[4]);
            textNode.toggleFormat("code");
            nodes.push(textNode);
        } else if (match[5]) {
            // Regular text
            nodes.push($createTextNode(match[5]));
        }
    }

    return nodes.length > 0 ? nodes : [$createTextNode(text)];
}

// Test cases
const input1 = "- `circuit_id`: A unique digital fingerprint. It’s how systems track circuits across decades, linking historical results to modern analytics.";
// We simulate the list parsing logic: remove "- "
const listContent = input1.trim().substring(2);

console.log("--- Test 1 (User Input) ---");
console.log("Full Line:", input1);
console.log("Parsed Content:", listContent);
const result1 = parseInlineFormatting(listContent);
console.log("Result:", JSON.stringify(result1, null, 2));

const input2 = "- `name`: Often poetic—Circuit Gilles Villeneuve";
const listContent2 = input2.trim().substring(2);
console.log("\n--- Test 2 (User Input 2) ---");
console.log("Parsed Content:", listContent2);
const result2 = parseInlineFormatting(listContent2);
console.log("Result:", JSON.stringify(result2, null, 2));
