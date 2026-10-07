// =============================================================================
// skeletonKinematics.js - Matrix Stack & Forward Kinematics Engine
// =============================================================================

/**
 * Creates an empty matrix stack initialized with an identity matrix.
 */
function createMatrixStack() {
    return [mat4Identity()];
}

/**
 * Pushes a copy of the current top matrix onto the stack.
 */
function stackPush(stack) {
    const top = stack[stack.length - 1];
    stack.push(new Float32Array(top));
}

/**
 * Pops the top matrix off the stack, restoring the previous parent state.
 */
function stackPop(stack) {
    if (stack.length > 1) {
        stack.pop();
    }
}

/**
 * Returns the current top matrix from the stack.
 */
function stackGetTop(stack) {
    return stack[stack.length - 1];
}

/**
 * Multiplies the current top matrix with a local transformation matrix.
 */
function stackMultiply(stack, localMatrix) {
    const top = stackGetTop(stack);
    stack[stack.length - 1] = multiplyMat4(top, localMatrix);
}

/**
 * Computes a joint's local transformation matrix: T * Rz * Ry * Rx
 */
function createBoneLocalMatrix(tx, ty, tz, rx, ry, rz) {
    const degToRad = Math.PI / 180;
    
    // 1. Identity matrix
    let m = mat4Identity();
    
    // 2. Local translation FIRST
    m = mat4Translate(m, [tx, ty, tz]);
    
    // 3. Rotation chain for HTR standard (X -> Y -> Z or Z -> Y -> X depending on file header)
    // Try standard X * Y * Z multiplication chain:
    const rxMat = mat4RotateX(mat4Identity(), rx * degToRad);
    const ryMat = mat4RotateY(mat4Identity(), ry * degToRad);
    const rzMat = mat4RotateZ(mat4Identity(), rz * degToRad);
    
    // Combine rotations: R = Rx * Ry * Rz
    let rotMat = mat4Multiply(rxMat, ryMat);
    rotMat = mat4Multiply(rotMat, rzMat);
    
    // Apply rotation to translation
    return mat4Multiply(m, rotMat);
}
/**
 * Performs Forward Kinematics via DFS stack traversal.
 * Calculates world transformation matrices for all bones in the active frame
 * and returns them in a flat array for explicit drawing in index.html.
 *
 * @param {Object} node - Current root/joint node in the skeleton tree.
 * @param {Object} frameData - Transformation channel data for the active frame.
 * @param {Array} stack - Matrix stack handling hierarchical coordinate frames.
 * @param {Array} matrixList - Accumulator array holding output matrices.
 * @returns {Array} List of calculated world matrices scaled for bone display.
 */
function computeSkeletonMatrices(node, frameData, stack = createMatrixStack(), matrixList = []) {
    if (!node || !frameData) return matrixList;

    // 1. Get current bone animation data
    const bone = frameData[node.name] || { Tx: 0, Ty: 0, Tz: 0, Rx: 0, Ry: 0, Rz: 0, Length: 1.0 };
    const boneLength = bone.Length || 1.0;

    // 2. Save parent state before applying child transform
    stackPush(stack);

    // 3. Create bone local transform matrix
    const localMat = createBoneLocalMatrix(
        bone.Tx, bone.Ty, bone.Tz,
        bone.Rx, bone.Ry, bone.Rz
    );

    // 4. Apply local rotation & position to hierarchy stack
    stackMultiply(stack, localMat);

    // 5. Compute RENDER MATRIX for the bone mesh (Scaled along Y)
    // We scale stackTop directly WITHOUT modifying stackTop for children
    const renderMat = mat4Scale(stackGetTop(stack), [0.1, boneLength, 0.1]);
    matrixList.push({ name: node.name, matrix: renderMat });

    // 6. Recurse down to child bones (children inherit joint orientation)
    for (let i = 0; i < node.children.length; i++) {
        computeSkeletonMatrices(node.children[i], frameData, stack, matrixList);
    }

    // 7. Pop state back to parent level for siblings
    stackPop(stack);

    return matrixList;
}
