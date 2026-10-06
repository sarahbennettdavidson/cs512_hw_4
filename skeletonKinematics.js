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
    let m = mat4Identity();
    m = mat4Translate(m, [tx, ty, tz]);
    m = mat4RotateZ(m, rz * degToRad);
    m = mat4RotateY(m, ry * degToRad);
    m = mat4RotateX(m, rx * degToRad);
    return m;
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

    // 1. Save parent transform state on stack
    stackPush(stack);

    const bone = frameData[node.name] || { Tx: 0, Ty: 0, Tz: 0, Rx: 0, Ry: 0, Rz: 0, Length: 1.0 };

    // 2. Build local transform and accumulate down the hierarchy
    const localMat = createBoneLocalMatrix(
        bone.Tx, bone.Ty, bone.Tz,
        bone.Rx, bone.Ry, bone.Rz
    );
    stackMultiply(stack, localMat);

    // 3. Apply bone length scaling along +Y for unitCubePos rendering
    const boneLength = bone.Length || 1.0;
    const renderMat = mat4Scale(stackGetTop(stack), [0.1, boneLength, 0.1]);

    // Store world matrix for draw calls in main loop
    matrixList.push(renderMat);

    // 4. Recurse down child bones (DFS)
    for (let i = 0; i < node.children.length; i++) {
        computeSkeletonMatrices(node.children[i], frameData, stack, matrixList);
    }

    // 5. Restore parent matrix state
    stackPop(stack);

    return matrixList;
}