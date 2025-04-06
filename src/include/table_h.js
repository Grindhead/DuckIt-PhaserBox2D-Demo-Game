/**
 * This file includes code that is:
 * 
 * - Copyright 2023 Erin Catto, released under the MIT license.
 * - Copyright 2024 Phaser Studio Inc, released under the MIT license.
 */

export const B2_SHAPE_PAIR_KEY = (K1, K2) => K1 < K2 ? BigInt(K1) << 32n | BigInt(K2) : BigInt(K2) << 32n | BigInt(K1);

export {

    // b2SetItem,
    b2CreateSet,
    b2DestroySet,
    b2ClearSet,
    b2AddKey,
    b2RemoveKey,
    b2ContainsKey
} from '../table_c.js';
