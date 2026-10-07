// =============================================================================
// htrParserR.js - Dedicated Parser & Data Supplier for Right Hand HTR
// =============================================================================

/**
 * Fetches and parses Right Hand HTR motion data.
 * @param {string} filePath - Path to right hand HTR file (e.g., 'handDataR.htr')
 * @returns {Promise<Object>} Parsed header, skeleton tree, base positions, and frame data.
 */
async function loadAndParseHTRR(filePath) {
    try {
        console.log(`Fetching Right Hand HTR: ${filePath}...`);
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const text = await response.text();
        return parseHTRDataR(text);
    } catch (error) {
        console.error("Right Hand HTR Parse Error:", error);
        return null;
    }
}

function parseHTRDataR(text) {
    const lines = text.split(/\r?\n/);
    let section = "";

    let header = {};
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

        // 1. Header: key/value settings (FileType, NumFrames, EulerRotationOrder, ...)
        if (section === "[Header]") {
            const chars = line.split(/\s+/);
            header[chars[0]] = chars.slice(1).join(" ");
        }
        // 2. Topology: "child parent" pairs only
        else if (section === "[SegmentNames&Hierarchy]") {
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
        // 3. Base Positions
        else if (section === "[BasePosition]") {
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
        // 4. Motion Frames: one section per joint, e.g. [RWrist]
        else if (section !== "[EndOfFile]") {
            const jointName = section.replace("[", "").replace("]", "").trim();
            const chars = line.split(/\s+/);

            if (chars.length >= 7 && !isNaN(parseInt(chars[0]))) {
                const frameIdx = parseInt(chars[0]);
                if (!frameDataList[frameIdx]) frameDataList[frameIdx] = {};

                frameDataList[frameIdx][jointName] = {
                    Tx: parseFloat(chars[1]), Ty: parseFloat(chars[2]), Tz: parseFloat(chars[3]),
                    Rx: parseFloat(chars[4]), Ry: parseFloat(chars[5]), Rz: parseFloat(chars[6]),
                    SF: chars.length >= 8 ? parseFloat(chars[7]) : 1.0
                };
            }
        }
    }

    // Root is the joint attached directly to GLOBAL (e.g., RWrist -> GLOBAL)
    const rootName = Object.keys(jointParents).find(
        n => jointParents[n] === "GLOBAL" || jointParents[n] === "NULL"
    ) || null;

    function buildTree(name) {
        return {
            name: name,
            children: (jointChildren[name] || []).map(childName => buildTree(childName))
        };
    }

    return {
        header: header,
        rootNode: rootName ? buildTree(rootName) : null,
        frames: frameDataList,
        basePositions: basePositions
    };
}
