/**
 * @file PhysicsBodyFactory.ts
 * @description Factory for creating physics bodies based on the physics.xml file definitions.
 */

import { PHYSICS } from "@constants";
import { gameState } from "@gameState";

import {
  b2BodyId,
  b2CreateBody,
  b2DefaultBodyDef,
  b2DefaultShapeDef,
  b2CreatePolygonShape,
  b2CreateCircleShape,
  b2MakeBox,
  b2Vec2,
  b2Circle,
  DYNAMIC,
  STATIC,
} from "@PhaserBox2D";

import {
  loadPhysicsData,
  CircleShapeData,
  PolygonShapeData,
  PhysicsBodyData,
} from "./PhysicsXMLParser";

// Cache for the loaded physics data
let physicsData: Map<string, PhysicsBodyData> | null = null;

/**
 * Maps XML entity types to game logic types
 * This is needed because our physics XML uses specific names that need to
 * be mapped to gameplay types for collision handling
 */
function mapEntityTypeToGameType(entityType: string): string {
  switch (entityType) {
    case "duck":
      return "player";
    case "coin":
      return "coin";
    case "enemy":
      return "enemy";
    case "crate-big":
    case "crate-small":
      return "crate";
    case "finish":
      return "finish";
    default:
      return entityType;
  }
}

/**
 * Initialize the physics data by loading from the XML file
 */
export async function initPhysicsData(): Promise<void> {
  try {
    physicsData = await loadPhysicsData();

    // Validate the loaded physics data
    if (!physicsData || physicsData.size === 0) {
      throw new Error("Physics data is empty after loading");
    }

    // Log the actual bodies loaded to help debug
    console.log(
      "Successfully loaded physics bodies:",
      Array.from(physicsData.keys())
    );

    // Specifically check for the duck body which is crucial
    if (!physicsData.has("duck")) {
      console.warn("Warning: 'duck' body not found in physics data!");
    }

    return;
  } catch (error) {
    console.error("Error initializing physics data:", error);
    // Don't set physicsData to null - keep any previous data if it exists
    throw error;
  }
}

/**
 * Creates a physics body based on the physics.xml definitions
 *
 * @param entityType The entity type name as defined in physics.xml (e.g., "duck", "coin", "crate-big")
 * @param x The x position in pixels
 * @param y The y position in pixels
 * @param isDynamic Override for the dynamic property (optional)
 * @param entityInstance Optional reference to the entity instance (useful for coins, enemies, etc.)
 * @returns The created body ID or null if creation failed
 */
export function createPhysicsBody(
  entityType: string,
  x: number,
  y: number,
  isDynamic?: boolean,
  entityInstance?: Phaser.GameObjects.Sprite
): ReturnType<typeof b2CreateBody> | null {
  // Safety check for worldId
  if (!gameState.worldId) {
    console.error("Game world not initialized. Cannot create physics body.");
    return null;
  }

  // Check if physics data is available
  if (!physicsData || physicsData.size === 0) {
    console.error(
      `CRITICAL: Physics data not initialized or empty for ${entityType}. Run initPhysicsData() first.`
    );
    return null;
  }

  // Add more detailed logging for crate entities
  if (entityType.includes("crate")) {
    console.log(`Creating ${entityType} physics body at (${x}, ${y})...`);
    console.log(
      `Available physics bodies: ${Array.from(physicsData.keys()).join(", ")}`
    );
  }

  const bodyData = physicsData.get(entityType);
  if (!bodyData) {
    console.error(`No physics data found for entity type: "${entityType}"`);
    return null;
  }

  try {
    // Log the shapes for crate entities
    if (entityType.includes("crate")) {
      console.log(
        `Found body data for ${entityType} with ${bodyData.shapes.length} shapes`
      );
      bodyData.shapes.forEach((shape, i) => {
        console.log(
          `  Shape ${i}: type=${shape.type}, isSensor=${shape.fixture.isSensor}`
        );
      });
    }

    // Determine if the body should be dynamic
    const dynamic = isDynamic !== undefined ? isDynamic : bodyData.dynamic;

    // Create body definition
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: dynamic ? DYNAMIC : STATIC,
      position: new b2Vec2(x / PHYSICS.SCALE, -y / PHYSICS.SCALE),
      fixedRotation: true, // Generally want fixed rotation for game entities
      enableContactListener: true, // Enable contact events
      allowSleep: true, // Allow sleep for performance
    };

    // Create the body
    const bodyId = b2CreateBody(gameState.worldId, bodyDef);
    if (!bodyId) {
      console.error(`Failed to create body for ${entityType}`);
      return null;
    }

    // Track if at least one shape was successfully created
    let shapesCreated = false;

    // Create shapes for the body
    for (const shapeData of bodyData.shapes) {
      try {
        // Create shape definition from the fixture properties in the XML
        const shapeDef = {
          ...b2DefaultShapeDef(),
          density: shapeData.fixture.density,
          friction: shapeData.fixture.friction,
          restitution: shapeData.fixture.restitution,
          isSensor: shapeData.fixture.isSensor,
          // Use the actual entity type (might be "duck", "coin", "enemy", etc.)
          // For gameplay purposes we need to map these to more generic types
          userData: {
            type: mapEntityTypeToGameType(entityType),
            entityType: entityType,
            // Add the entity instance if provided
            ...(entityInstance && {
              [`${mapEntityTypeToGameType(entityType)}Instance`]:
                entityInstance,
            }),
          },
          filter: {
            categoryBits: shapeData.fixture.categoryBits,
            maskBits: shapeData.fixture.maskBits,
            groupIndex: shapeData.fixture.groupIndex,
          },
        };

        // Create the appropriate shape type
        if (shapeData.type === "CIRCLE") {
          createCircleShape(bodyId, shapeDef, shapeData as CircleShapeData);
          shapesCreated = true;
        } else if (shapeData.type === "POLYGON") {
          createPolygonShape(bodyId, shapeDef, shapeData as PolygonShapeData);
          shapesCreated = true;
        }
      } catch (error) {
        console.error(`Error creating shape for ${entityType}:`, error);
        // Continue to try other shapes
      }
    }

    if (!shapesCreated) {
      console.error(`No shapes could be created for ${entityType}`);
      return null;
    }

    return bodyId;
  } catch (error) {
    console.error(`Error creating physics body for ${entityType}:`, error);
    return null;
  }
}

/**
 * Creates a circle shape for the body
 */
function createCircleShape(
  bodyId: ReturnType<typeof b2CreateBody>,
  shapeDef: ReturnType<typeof b2DefaultShapeDef>,
  shapeData: CircleShapeData
): void {
  try {
    // For Box2D, we need to use the proper format according to documentation:
    // center must be a b2Vec2, not a plain object

    // First, calculate the radius
    const radius = shapeData.radius / PHYSICS.SCALE;

    // Create a b2Circle shape with proper b2Vec2 for center
    const circleShape = {
      center: new b2Vec2(0, 0), // offset from body center (usually 0,0)
      radius: radius,
    };

    // Create the shape
    b2CreateCircleShape(bodyId, shapeDef, circleShape);

    console.log(`Created circle shape with radius ${radius}`);
  } catch (error) {
    console.error("Error creating circle shape:", error);
    throw error;
  }
}

/**
 * Creates a polygon shape for the body
 */
function createPolygonShape(
  bodyId: ReturnType<typeof b2CreateBody>,
  shapeDef: ReturnType<typeof b2DefaultShapeDef>,
  shapeData: PolygonShapeData
): void {
  // Convert vertices to Box2D format and scale
  const vertices = shapeData.vertices
    .map((v) => [v.x / PHYSICS.SCALE, -v.y / PHYSICS.SCALE])
    .flat();

  // Debug logging for crate polygon shapes
  if (
    shapeDef.userData?.entityType &&
    shapeDef.userData.entityType.includes("crate")
  ) {
    console.log(`Creating polygon shape for ${shapeDef.userData.entityType}:`);
    console.log(`  Vertices: ${vertices.join(", ")}`);
  }

  // Create the polygon
  const polygon = { vertices };

  // Create the shape
  b2CreatePolygonShape(bodyId, shapeDef, polygon);
}

/**
 * Verify that all critical physics bodies are properly loaded
 * Returns false if any required bodies are missing
 */
export function verifyPhysicsData(): boolean {
  if (!physicsData || physicsData.size === 0) {
    console.error("Physics data is not initialized");
    return false;
  }

  // These are the required body types for the game to function properly
  const requiredBodies = [
    "duck",
    "coin",
    "crate-small",
    "crate-big",
    "enemy",
    "finish",
  ];

  const missingBodies = requiredBodies.filter(
    (bodyName) => !physicsData?.has(bodyName)
  );

  if (missingBodies.length > 0) {
    console.error(
      `Missing required physics bodies: ${missingBodies.join(", ")}`
    );
    console.log(
      `Available bodies: ${Array.from(physicsData.keys()).join(", ")}`
    );
    return false;
  }

  return true;
}
