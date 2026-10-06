// =============================================================================
// htrParserL.js - Dedicated Parser & Data Supplier for Left Hand HTR
// =============================================================================

/**
 * Fetches and parses Left Hand HTR motion data.
 * @param {string} filePath - Path to left hand HTR file (e.g., 'handDataL.htr')
 * @returns {Promise<Object>} Parsed skeleton tree, base positions, and frame data.
 */
async function loadAndParseHTRL(filePath) {
    try {
        console.log(`Fetching Left Hand HTR: ${filePath}...`);
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const text = await response.text();
        return parseHTRDataL(text);
    } catch (error) {
        console.error("Left Hand HTR Parse Error:", error);
        return null;
    }
}

function parseHTRDataL(text) {
    const lines = text.split(/\r?\n/);
    let section = "";
    
    let basePositions = {};
    let jointParents = {};
    let jointChildren = {};
    let frameDataList = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.startsWith("#")) continue;

        if (line.startsWith("[")) {
            section = line;
            continue;
        }

        // 1. Topology ([SegmentNames&Hierarchy])
        if (section === "[Header]" || section === "[SegmentNames&Hierarchy]") {
            const chars = line.split(/\s+/);
            if (chars.length >= 2) {
                const child = chars[0];
                const parent = chars[1];
                jointParents[child] = parent;
                if (!jointChildren[parent]) jointChildren[parent] = [];
                if (!jointChildren[child]) jointChildren[child] = [];
                jointChildren[parent].push(child);
            }
        } 
        // 2. Base Positions
        else if (section.includes("BasePosition")) {
            const chars = line.split(/\s+/);
            if (chars.length >= 8) {
                const name = chars[0];
                basePositions[name] = {
                    Tx: parseFloat(chars[1]), Ty: parseFloat(chars[2]), Tz: parseFloat(chars[3]),
                    Rx: parseFloat(chars[4]), Ry: parseFloat(chars[5]), Rz: parseFloat(chars[6]),
                    Length: parseFloat(chars[7])
                };
            }
        }
        // 3. Motion Frames
        else if (section.startsWith("[") && section !== "[Header]") {
            const jointName = section.replace("[", "").replace("]", "").trim();
            const chars = line.split(/\s+/);
            
            if (chars.length >= 7 && !isNaN(parseInt(chars[0]))) {
                const frameIdx = parseInt(chars[0]);
                if (!frameDataList[frameIdx]) frameDataList[frameIdx] = {};

                frameDataList[frameIdx][jointName] = {
                    Tx: parseFloat(chars[1]), Ty: parseFloat(chars[2]), Tz: parseFloat(chars[3]),
                    Rx: parseFloat(chars[4]), Ry: parseFloat(chars[5]), Rz: parseFloat(chars[6]),
                    Length: basePositions[jointName] ? basePositions[jointName].Length : 1.0
                };
            }
        }
    }

    // Find Root Node (e.g., LWrist -> GLOBAL)
    let rootName = null;
    const allNodes = Object.keys(jointChildren);
    for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i];
        if (!jointParents[node] || jointParents[node] === "GLOBAL" || jointParents[node] === "NULL") {
            rootName = node;
            break;
        }
    }

    function buildTree(name) {
        return {
            name: name,
            children: (jointChildren[name] || []).map(childName => buildTree(childName))
        };
    }

    return {
        rootNode: rootName ? buildTree(rootName) : null,
        frames: frameDataList,
        basePositions: basePositions
    };
}