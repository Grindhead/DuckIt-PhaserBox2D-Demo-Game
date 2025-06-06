/**
 * FUNCTIONS
 */

// Maths
export {
    b2MinFloat, b2MaxFloat, b2AbsFloat, b2ClampFloat, b2MinInt, b2MaxInt, b2AbsInt, b2ClampInt,
    b2Dot, b2Cross, b2CrossVS, b2CrossSV, b2LeftPerp, b2RightPerp,
    b2Add, b2Sub, b2Neg, b2Lerp, b2Mul, b2MulSV, b2MulAdd, b2MulSub, b2Abs,
    b2Min, b2Max, b2Clamp, b2Length, b2LengthSquared, b2Distance, b2DistanceSquared,
    b2MakeRot, b2NormalizeRot, b2IsNormalized, b2NLerp, b2IntegrateRotation,
    b2ComputeAngularVelocity, b2Rot_GetAngle, b2Rot_GetXAxis, b2Rot_GetYAxis, b2MulRot, b2InvMulRot,
    b2RelativeAngle, b2UnwindAngle, b2RotateVector, b2InvRotateVector,
    b2TransformPoint, b2InvTransformPoint, b2MulTransforms, b2InvMulTransforms, b2MulMV,
    b2GetInverse22, b2Solve22,
    b2AABB_Contains, b2AABB_Center, b2AABB_Extents, b2AABB_Union
} from './include/math_functions_h.js';

// Core System
export {
    b2SetAllocator,
    b2GetByteCount,
    b2SetAssertFcn,
    b2GetVersion,
    b2CreateTimer,
    b2GetTicks,
    b2GetMilliseconds,
    b2GetMillisecondsAndReset,
    b2SleepMilliseconds,
    b2Yield,
    b2SetLengthUnitsPerMeter,
    b2GetLengthUnitsPerMeter,
    B2_NULL_INDEX
} from './include/core_h.js';

export {
    B2_ID_EQUALS,
    B2_IS_NULL,
    B2_IS_NON_NULL
} from './include/id_h.js';

// World Management
export {
    b2CreateWorld,
    b2CreateWorldArray,
    b2DestroyWorld,
    b2World_IsValid,
    b2World_Step,
    b2World_Draw,
    b2World_GetBodyEvents,
    b2World_GetSensorEvents,
    b2World_GetContactEvents,
    b2World_SetGravity,
    b2World_GetGravity,
    b2World_GetProfile,
    b2World_GetCounters,
    b2World_OverlapAABB,
    b2World_OverlapCircle,
    b2World_OverlapCapsule,
    b2World_OverlapPolygon,
    b2World_CastRay,
    b2World_CastRayClosest,
    b2World_CastCircle,
    b2World_CastCapsule,
    b2World_CastPolygon,
    b2World_EnableSleeping,
    b2World_EnableContinuous,
    b2World_SetRestitutionThreshold,
    b2World_SetHitEventThreshold,
    b2World_SetCustomFilterCallback,
    b2World_SetPreSolveCallback,
    b2World_Explode,
    b2World_SetContactTuning,
    b2World_EnableWarmStarting,
    b2World_DumpMemoryStats
} from './include/world_h.js';

// Body Management
export {
    b2Body_IsValid
} from './include/world_h.js';

export {
    b2CreateBody,
    b2DestroyBody,
    b2Body_GetType,
    b2Body_SetType,
    b2Body_GetPosition,
    b2Body_GetRotation,
    b2Body_GetTransform,
    b2Body_SetTransform,
    b2Body_ApplyForce,
    b2Body_ApplyTorque,
    b2Body_ApplyLinearImpulse,
    b2Body_ApplyAngularImpulse,
    b2Body_SetUserData,
    b2Body_GetUserData,
    b2Body_GetLocalPoint,
    b2Body_GetWorldPoint,
    b2Body_GetLocalVector,
    b2Body_GetWorldVector,
    b2Body_GetLinearVelocity,
    b2Body_GetAngularVelocity,
    b2Body_SetLinearVelocity,
    b2Body_SetAngularVelocity,
    b2Body_ApplyForceToCenter,
    b2Body_ApplyLinearImpulseToCenter,
    b2Body_GetMass,
    b2Body_GetRotationalInertia,
    b2Body_GetLocalCenterOfMass,
    b2Body_GetWorldCenterOfMass,
    b2Body_SetMassData,
    b2Body_GetMassData,
    b2Body_ApplyMassFromShapes,
    b2Body_SetLinearDamping,
    b2Body_GetLinearDamping,
    b2Body_SetAngularDamping,
    b2Body_GetAngularDamping,
    b2Body_SetGravityScale,
    b2Body_GetGravityScale,
    b2Body_IsAwake,
    b2Body_SetAwake,
    b2Body_EnableSleep,
    b2Body_IsSleepEnabled,
    b2Body_SetSleepThreshold,
    b2Body_GetSleepThreshold,
    b2Body_IsEnabled,
    b2Body_Disable,
    b2Body_Enable,
    b2Body_SetFixedRotation,
    b2Body_IsFixedRotation,
    b2Body_SetBullet,
    b2Body_IsBullet,
    b2Body_EnableHitEvents,
    b2Body_GetShapeCount,
    b2Body_GetShapes,
    b2Body_GetJointCount,
    b2Body_GetJoints,
    b2Body_GetContactCapacity,
    b2Body_GetContactData,
    b2Body_ComputeAABB
} from './include/body_h.js';

// Shape Management
export {
    b2Shape_IsValid
} from './include/world_h.js';

export {
    b2CreateCircleShape,
    b2CreateSegmentShape,
    b2CreateCapsuleShape,
    b2CreatePolygonShape,
    b2DestroyShape,
    b2Shape_GetType,
    b2Shape_TestPoint,
    b2Shape_RayCast,
    b2Shape_GetBody,
    b2Shape_IsSensor,
    b2Shape_SetUserData,
    b2Shape_GetUserData,
    b2Shape_SetDensity,
    b2Shape_GetDensity,
    b2Shape_SetFriction,
    b2Shape_GetFriction,
    b2Shape_SetRestitution,
    b2Shape_GetRestitution,
    b2Shape_GetFilter,
    b2Shape_SetFilter,
    b2Shape_EnableSensorEvents,
    b2Shape_AreSensorEventsEnabled,
    b2Shape_EnableContactEvents,
    b2Shape_AreContactEventsEnabled,
    b2Shape_EnablePreSolveEvents,
    b2Shape_ArePreSolveEventsEnabled,
    b2Shape_EnableHitEvents,
    b2Shape_AreHitEventsEnabled,
    b2Shape_GetCircle,
    b2Shape_GetSegment,
    b2Shape_GetChainSegment,
    b2Shape_GetCapsule,
    b2Shape_GetPolygon,
    b2Shape_SetCircle,
    b2Shape_SetCapsule,
    b2Shape_SetSegment,
    b2Shape_SetPolygon,
    b2Shape_GetParentChain,
    b2Shape_GetContactCapacity,
    b2Shape_GetContactData,
    b2Shape_GetAABB,
    b2Shape_GetClosestPoint
} from './include/shape_h.js';

// Joint Management
export {
    b2Joint_IsValid
} from './include/world_h.js';

export {
    b2CreateDistanceJoint,
    b2CreateMotorJoint,
    b2CreateMouseJoint,
    b2CreatePrismaticJoint,
    b2CreateRevoluteJoint,
    b2CreateWeldJoint,
    b2CreateWheelJoint,
    b2DestroyJoint,
    b2Joint_GetType,
    b2Joint_GetBodyA,
    b2Joint_GetBodyB,
    b2Joint_GetLocalAnchorA,
    b2Joint_GetLocalAnchorB,
    b2Joint_SetCollideConnected,
    b2Joint_GetCollideConnected,
    b2Joint_SetUserData,
    b2Joint_GetUserData,
    b2Joint_WakeBodies,
    b2Joint_GetConstraintForce,
    b2Joint_GetConstraintTorque
} from './include/joint_h.js';

export {
    b2DistanceJoint_SetLength,
    b2DistanceJoint_GetLength,
    b2DistanceJoint_EnableSpring,
    b2DistanceJoint_IsSpringEnabled,
    b2DistanceJoint_SetSpringHertz,
    b2DistanceJoint_SetSpringDampingRatio,
    b2DistanceJoint_GetSpringHertz,
    b2DistanceJoint_GetSpringDampingRatio,
    b2DistanceJoint_EnableLimit,
    b2DistanceJoint_IsLimitEnabled,
    b2DistanceJoint_SetLengthRange,
    b2DistanceJoint_GetMinLength,
    b2DistanceJoint_GetMaxLength,
    b2DistanceJoint_GetCurrentLength,
    b2DistanceJoint_EnableMotor,
    b2DistanceJoint_IsMotorEnabled,
    b2DistanceJoint_SetMotorSpeed,
    b2DistanceJoint_GetMotorSpeed,
    b2DistanceJoint_SetMaxMotorForce,
    b2DistanceJoint_GetMaxMotorForce,
    b2DistanceJoint_GetMotorForce
} from './include/distance_joint_h.js';

export {
    b2MotorJoint_SetLinearOffset,
    b2MotorJoint_GetLinearOffset,
    b2MotorJoint_SetAngularOffset,
    b2MotorJoint_GetAngularOffset,
    b2MotorJoint_SetMaxForce,
    b2MotorJoint_GetMaxForce,
    b2MotorJoint_SetMaxTorque,
    b2MotorJoint_GetMaxTorque,
    b2MotorJoint_SetCorrectionFactor,
    b2MotorJoint_GetCorrectionFactor
} from './include/motor_joint_h.js';

export {
    b2MouseJoint_SetTarget,
    b2MouseJoint_GetTarget,
    b2MouseJoint_SetSpringHertz,
    b2MouseJoint_GetSpringHertz,
    b2MouseJoint_SetSpringDampingRatio,
    b2MouseJoint_GetSpringDampingRatio,
    b2MouseJoint_SetMaxForce,
    b2MouseJoint_GetMaxForce
} from './include/mouse_joint_h.js';

export {
    b2PrismaticJoint_EnableSpring,
    b2PrismaticJoint_IsSpringEnabled,
    b2PrismaticJoint_SetSpringHertz,
    b2PrismaticJoint_GetSpringHertz,
    b2PrismaticJoint_SetSpringDampingRatio,
    b2PrismaticJoint_GetSpringDampingRatio,
    b2PrismaticJoint_EnableLimit,
    b2PrismaticJoint_IsLimitEnabled,
    b2PrismaticJoint_GetLowerLimit,
    b2PrismaticJoint_GetUpperLimit,
    b2PrismaticJoint_SetLimits,
    b2PrismaticJoint_EnableMotor,
    b2PrismaticJoint_IsMotorEnabled,
    b2PrismaticJoint_SetMotorSpeed,
    b2PrismaticJoint_GetMotorSpeed,
    b2PrismaticJoint_SetMaxMotorForce,
    b2PrismaticJoint_GetMaxMotorForce,
    b2PrismaticJoint_GetMotorForce
} from './include/prismatic_joint_h.js';

export {
    b2RevoluteJoint_EnableSpring,
    b2RevoluteJoint_SetSpringHertz,
    b2RevoluteJoint_GetSpringHertz,
    b2RevoluteJoint_SetSpringDampingRatio,
    b2RevoluteJoint_GetSpringDampingRatio,
    b2RevoluteJoint_GetAngle,
    b2RevoluteJoint_EnableLimit,
    b2RevoluteJoint_IsLimitEnabled,
    b2RevoluteJoint_GetLowerLimit,
    b2RevoluteJoint_GetUpperLimit,
    b2RevoluteJoint_SetLimits,
    b2RevoluteJoint_EnableMotor,
    b2RevoluteJoint_IsMotorEnabled,
    b2RevoluteJoint_SetMotorSpeed,
    b2RevoluteJoint_GetMotorSpeed,
    b2RevoluteJoint_GetMotorTorque,
    b2RevoluteJoint_SetMaxMotorTorque,
    b2RevoluteJoint_GetMaxMotorTorque,
    b2RevoluteJoint_IsSpringEnabled
} from './include/revolute_joint_h.js';

export {
    b2WeldJoint_SetLinearHertz,
    b2WeldJoint_GetLinearHertz,
    b2WeldJoint_SetLinearDampingRatio,
    b2WeldJoint_GetLinearDampingRatio,
    b2WeldJoint_SetAngularHertz,
    b2WeldJoint_GetAngularHertz,
    b2WeldJoint_SetAngularDampingRatio,
    b2WeldJoint_GetAngularDampingRatio
} from './include/weld_joint_h.js';

export {
    b2WheelJoint_EnableSpring,
    b2WheelJoint_IsSpringEnabled,
    b2WheelJoint_SetSpringHertz,
    b2WheelJoint_GetSpringHertz,
    b2WheelJoint_SetSpringDampingRatio,
    b2WheelJoint_GetSpringDampingRatio,
    b2WheelJoint_EnableLimit,
    b2WheelJoint_IsLimitEnabled,
    b2WheelJoint_GetLowerLimit,
    b2WheelJoint_GetUpperLimit,
    b2WheelJoint_SetLimits,
    b2WheelJoint_EnableMotor,
    b2WheelJoint_IsMotorEnabled,
    b2WheelJoint_SetMotorSpeed,
    b2WheelJoint_GetMotorSpeed,
    b2WheelJoint_SetMaxMotorTorque,
    b2WheelJoint_GetMaxMotorTorque,
    b2WheelJoint_GetMotorTorque
} from './include/wheel_joint_h.js';

// Collision Detection
export {
    b2CollideCircles,
    b2CollideCapsules,
    b2CollidePolygons,
    b2CollideCapsuleAndCircle,
    b2CollidePolygonAndCircle,
    b2CollideSegmentAndCapsule,
    b2CollidePolygonAndCapsule,
    b2CollideSegmentAndCircle,
    b2CollideSegmentAndPolygon,
    b2CollideChainSegmentAndCircle,
    b2CollideChainSegmentAndCapsule,
    b2CollideChainSegmentAndPolygon
} from './include/manifold_h.js';

export {
    b2RayCastCircle,
    b2RayCastPolygon,
    b2RayCastCapsule,
    b2RayCastSegment,
    b2ShapeCastCircle,
    b2ShapeCastCapsule,
    b2ShapeCastSegment,
    b2ShapeCastPolygon,
    b2IsValidRay
} from './include/geometry_h.js';

export {
    b2ShapeCast,
    b2TimeOfImpact
} from './include/distance_h.js';

// Math & Utilities
export {
    b2IsValid,
    b2Vec2_IsValid,
    b2Rot_IsValid,
    b2AABB_IsValid,
    b2Normalize,
    b2NormalizeChecked,
    b2GetLengthAndNormalize
} from './include/math_functions_h.js';

export {
    b2ComputeHull,
    b2ValidateHull
} from './include/hull_h.js';

export {
    b2SegmentDistance,
    b2ShapeDistance,
    b2MakeProxy,
    b2GetSweepTransform
} from './include/distance_h.js';

export {
    b2MakePolygon,
    b2MakeOffsetPolygon,
    b2MakeSquare,
    b2MakeBox,
    b2MakeRoundedBox,
    b2MakeOffsetBox,
    b2TransformPolygon,
    b2ComputeCircleMass,
    b2ComputeCapsuleMass,
    b2ComputePolygonMass,
    b2ComputeCircleAABB,
    b2ComputeCapsuleAABB,
    b2ComputePolygonAABB,
    b2ComputeSegmentAABB,
    b2PointInCircle,
    b2PointInCapsule,
    b2PointInPolygon
} from './include/geometry_h.js';

// Chain
export {
    b2CreateChain,
    b2Chain_SetFriction,
    b2Chain_SetRestitution,
    b2DestroyChain
} from './include/shape_h.js';

export {
    b2Chain_IsValid
} from './include/world_h.js';

// Dynamic Tree
export {
    b2DynamicTree_Create,
    b2DynamicTree_Destroy,
    b2DynamicTree_CreateProxy,
    b2DynamicTree_DestroyProxy,
    b2DynamicTree_MoveProxy,
    b2DynamicTree_EnlargeProxy,
    b2DynamicTree_Query,
    b2DynamicTree_RayCast,
    b2DynamicTree_ShapeCast,
    b2DynamicTree_Validate,
    b2DynamicTree_GetHeight,
    b2DynamicTree_GetMaxBalance,
    b2DynamicTree_GetAreaRatio,
    b2DynamicTree_RebuildBottomUp,
    b2DynamicTree_GetProxyCount,
    b2DynamicTree_Rebuild,
    b2DynamicTree_ShiftOrigin,
    b2DynamicTree_GetByteCount
} from './include/dynamic_tree_h.js';

// Default Definitions
export {
    b2DefaultWorldDef,
    b2DefaultBodyDef,
    b2DefaultFilter,
    b2DefaultQueryFilter,
    b2DefaultShapeDef,
    b2DefaultChainDef
} from './include/types_h.js';

export {
    b2DefaultDistanceJointDef,
    b2DefaultMotorJointDef,
    b2DefaultMouseJointDef,
    b2DefaultPrismaticJointDef,
    b2DefaultRevoluteJointDef,
    b2DefaultWeldJointDef,
    b2DefaultWheelJointDef
} from './include/joint_h.js';

// Phaser Additions v2

export const STATIC = 0;
export const KINEMATIC = 1;
export const DYNAMIC = 2;

export {
    GetWorldScale,
    SetWorldScale,
    mpx,
    pxm,
    pxmVec2,
    RotFromRad,
    BodyToSprite,
    SpriteToBox,
    SpriteToCircle,
    AddSpriteToWorld,
    RemoveSpriteFromWorld,
    ClearWorldSprites,
    GetBodyFromSprite,
    UpdateWorldSprites,
    CreateBoxPolygon,
    CreateCapsule,
    CreateChain,
    CreateCircle,
    CreateDistanceJoint,
    CreateMotorJoint,
    CreateMouseJoint,
    CreateNGonPolygon,
    CreatePolygon,
    CreatePolygonFromEarcut,
    CreatePolygonFromVertices,
    CreatePhysicsEditorShape,
    CreatePrismaticJoint,
    CreateRevoluteJoint,
    CreateWeldJoint,
    CreateWheelJoint,
    CreateWorld,
    WorldStep
} from './physics.js';

//  Debug Draw (remove from prod bundle)
export {
    AttachImage,
    ConvertScreenToWorld,
    ConvertWorldToScreen,
    CreateDebugDraw,
    RAF
} from './debug_draw.js';

export {
    Ragdoll,
    Skeletons
} from './ragdoll.js';

export {
    ActiveBall,
    Gun,
    Spinner
} from './fun_stuff.js';


/**
 * 
 * TYPES
 * 
 */

// World Management
export {
    b2WorldDef,
    b2BodyEvents,
    b2SensorEvents,
    b2ContactEvents
} from './include/types_h.js';

export {
    b2WorldId
} from './include/id_h.js';

// Geometry & Math
export {
    b2AABB,
    b2Vec2,
    b2Rot,
    b2Transform
} from './include/math_functions_h.js';

export {
    b2Hull,
    b2Sweep,
    b2Manifold,
    b2Simplex
} from './include/collision_h.js';

// Shapes
export {
    b2Circle,
    b2Capsule,
    b2Polygon,
    b2Segment,
    b2ChainSegment
} from './include/collision_h.js';

export {
    b2ShapeId
} from './include/id_h.js';

export {
    b2ShapeDef,
    b2ShapeType,
    b2Filter
} from './include/types_h.js';

// Bodies
export {
    b2BodyDef,
    b2BodyType
} from './include/types_h.js';

export {
    b2MassData
} from './include/collision_h.js';

export {
    b2BodyId
} from './include/id_h.js';

export {
    b2JointId,
    b2ChainId
} from './include/id_h.js';

// Joints
export {
    b2JointType,
    b2DistanceJointDef,
    b2MotorJointDef,
    b2MouseJointDef,
    b2PrismaticJointDef,
    b2RevoluteJointDef,
    b2WeldJointDef,
    b2WheelJointDef
} from './include/types_h.js';

// Chains
export {
    b2ChainDef
} from './include/types_h.js';

// Collision Detection
export {
    b2QueryFilter,
    b2RayResult,
    b2ContactData
} from './include/types_h.js';

export {
    b2CastOutput,
    b2RayCastInput,
    b2SegmentDistanceResult,
    b2DistanceCache,
    b2DistanceInput,
    b2DistanceOutput,
    b2DistanceProxy,
    b2ShapeCastInput,
    b2ShapeCastPairInput,
    b2TOIInput,
    b2TOIOutput
} from './include/collision_h.js';

// Broad-phase
export {
    b2DynamicTree
} from './include/dynamic_tree_h.js';

// Callbacks
export {
    b2DebugDraw
} from './include/types_h.js';

// Enumerations
export {
    b2HexColor
} from './include/types_h.js';
