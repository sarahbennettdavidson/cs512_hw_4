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
 * (HTR EulerRotationOrder ZYX). Angles are in degrees.
 * mat4Translate / mat4RotateZ / mat4RotateY / mat4RotateX each
 * post-multiply (M -> M * T, M -> M * Rz, ...), so chaining them in
 * this order builds T * Rz * Ry * Rx directly.
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
function computeSkeletonMatrices(node, frameData, basePositions, stack = createMatrixStack(), matrixList = []) {
    if (!node || !frameData) return matrixList;

    // 1. Frame offsets and base pose for this joint
    const f = frameData[node.name] || { Tx: 0, Ty: 0, Tz: 0, Rx: 0, Ry: 0, Rz: 0, SF: 1 };
    const b = (basePositions && basePositions[node.name]) ||
              { Tx: 0, Ty: 0, Tz: 0, Rx: 0, Ry: 0, Rz: 0, Length: 0 };
    const boneLength = b.Length * (f.SF || 1);

    // 2. Save parent state
    stackPush(stack);

    // 3. Local transform: T(base + frame) * R_base * R_frame
    const baseMat  = createBoneLocalMatrix(b.Tx + f.Tx, b.Ty + f.Ty, b.Tz + f.Tz, b.Rx, b.Ry, b.Rz);
    const frameRot = createBoneLocalMatrix(0, 0, 0, f.Rx, f.Ry, f.Rz);
    stackMultiply(stack, multiplyMat4(baseMat, frameRot));

    // 4. Render matrix: 8 mm thick, base Length * SF long
    const renderMat = mat4Scale(stackGetTop(stack), [8, boneLength, 8]);
    matrixList.push({ name: node.name, matrix: renderMat });

    // 5. Children
    for (let i = 0; i < node.children.length; i++) {
        computeSkeletonMatrices(node.children[i], frameData, basePositions, stack, matrixList);
    }

    // 6. Restore parent state
    stackPop(stack);
    return matrixList;
}
