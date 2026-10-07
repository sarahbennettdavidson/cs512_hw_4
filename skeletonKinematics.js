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

    // 1. Push current parent matrix state
    stackPush(stack);

    const bone = frameData[node.name] || { Tx: 0, Ty: 0, Tz: 0, Rx: 0, Ry: 0, Rz: 0, Length: 1.0 };
    const boneLength = bone.Length || 1.0;

    // 2. Local transformation (Translation + Rotation)
    const localMat = createBoneLocalMatrix(
        bone.Tx, bone.Ty, bone.Tz,
        bone.Rx, bone.Ry, bone.Rz
    );
    stackMultiply(stack, localMat);

    // 3. Compute render matrix for visually drawing this bone segment
    const renderMat = mat4Scale(stackGetTop(stack), [0.1, boneLength, 0.1]);
    matrixList.push(renderMat);

    // 4. Translate stack position to the TIP of this bone so child joints connect at the top
    const tipOffset = mat4Translate(mat4Identity(), [0, boneLength, 0]);
    stackMultiply(stack, tipOffset);

    // 5. Recurse down to child joints
    for (let i = 0; i < node.children.length; i++) {
        computeSkeletonMatrices(node.children[i], frameData, stack, matrixList);
    }

    // 6. Restore parent stack state
    stackPop(stack);

    return matrixList;
}
