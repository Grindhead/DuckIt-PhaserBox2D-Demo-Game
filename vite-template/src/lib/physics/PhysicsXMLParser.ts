/**
 * @file PhysicsXMLParser.ts
 * @description Loads and parses the physics.xml file to extract physics body definitions
 * to be used with Box2D.
 */

import * as Phaser from "phaser";
import { b2Circle, b2Polygon } from "@PhaserBox2D";

/**
 * A fixture definition from the physics XML file
 */
export interface PhysicsFixture {
  density: number;
  friction: number;
  restitution: number;
  isSensor: boolean;
  categoryBits: number;
  maskBits: number;
  groupIndex: number;
}

/**
 * Circle shape data from the physics XML file
 */
export interface CircleShapeData {
  type: "CIRCLE";
  radius: number;
  x: number;
  y: number;
  fixture: PhysicsFixture;
}

/**
 * Polygon shape data from the physics XML file
 */
export interface PolygonShapeData {
  type: "POLYGON";
  vertices: Array<{ x: number; y: number }>;
  fixture: PhysicsFixture;
}

/**
 * Type for any supported shape data
 */
export type ShapeData = CircleShapeData | PolygonShapeData;

/**
 * Physics body data from the XML file
 */
export interface PhysicsBodyData {
  name: string;
  dynamic: boolean;
  shapes: ShapeData[];
}

// Store loaded physics data for global access
let loadedPhysicsData: Map<string, PhysicsBodyData> | null = null;

/**
 * Loads and parses the physics XML file
 */
export async function loadPhysicsData(): Promise<Map<string, PhysicsBodyData>> {
  // If we've already loaded it, return the cached data
  if (loadedPhysicsData && loadedPhysicsData.size > 0) {
    console.log(
      "Using cached physics data:",
      Array.from(loadedPhysicsData.keys())
    );
    return loadedPhysicsData;
  }

  const bodies = new Map<string, PhysicsBodyData>();

  try {
    // Direct fetch approach
    const response = await fetch("/physics.xml");
    if (!response.ok) {
      throw new Error(
        `Failed to fetch physics.xml: ${response.status} ${response.statusText}`
      );
    }

    const xmlText = await response.text();

    // Check for empty response
    if (!xmlText || xmlText.trim() === "") {
      throw new Error("Physics XML is empty");
    }

    console.log(`Loaded physics XML file (${xmlText.length} bytes)`);

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    if (xmlDoc.querySelector("parsererror")) {
      throw new Error("XML parsing error in physics.xml");
    }

    // Parse all bodies
    const bodyElements = xmlDoc.querySelectorAll("body");

    if (bodyElements.length === 0) {
      throw new Error("No body elements found in physics.xml");
    }

    console.log(`Found ${bodyElements.length} body elements in physics.xml`);

    bodyElements.forEach((bodyElement: Element) => {
      const name = bodyElement.getAttribute("name") || "";
      const dynamic = bodyElement.getAttribute("dynamic") === "true";
      const shapes: ShapeData[] = [];

      // Parse fixtures
      const fixtureElements = bodyElement.querySelectorAll("fixture");

      if (fixtureElements.length === 0) {
        console.warn(`No fixtures found for body: ${name}`);
      }

      fixtureElements.forEach((fixtureElement: Element) => {
        // Parse fixture properties
        const fixture: PhysicsFixture = {
          density: parseFloat(fixtureElement.getAttribute("density") || "0"),
          friction: parseFloat(fixtureElement.getAttribute("friction") || "0"),
          restitution: parseFloat(
            fixtureElement.getAttribute("restitution") || "0"
          ),
          isSensor: fixtureElement.getAttribute("isSensor") === "true",
          categoryBits: parseInt(
            fixtureElement.getAttribute("filter_categoryBits") || "1",
            10
          ),
          maskBits: parseInt(
            fixtureElement.getAttribute("filter_maskBits") || "65535",
            10
          ),
          groupIndex: parseInt(
            fixtureElement.getAttribute("filter_groupIndex") || "0",
            10
          ),
        };

        const fixtureType = fixtureElement.getAttribute("type");

        if (!fixtureType) {
          console.warn(`Missing fixture type for body: ${name}`);
          return; // Skip this fixture
        }

        // Parse circle shape
        if (fixtureType === "CIRCLE") {
          const circleElement = fixtureElement.querySelector("circle");
          if (circleElement) {
            const radius = parseFloat(circleElement.getAttribute("r") || "0");
            const x = parseFloat(circleElement.getAttribute("x") || "0");
            const y = parseFloat(circleElement.getAttribute("y") || "0");

            shapes.push({
              type: "CIRCLE",
              radius,
              x,
              y,
              fixture,
            });
          }
        }

        // Parse polygon shape
        else if (fixtureType === "POLYGON") {
          const polygonElement = fixtureElement.querySelector("polygon");
          if (polygonElement) {
            const vertices: Array<{ x: number; y: number }> = [];

            // Parse vertices
            const vertexElements = polygonElement.querySelectorAll("vertex");
            vertexElements.forEach((vertexElement: Element) => {
              const x = parseFloat(vertexElement.getAttribute("x") || "0");
              const y = parseFloat(vertexElement.getAttribute("y") || "0");
              vertices.push({ x, y });
            });

            shapes.push({
              type: "POLYGON",
              vertices,
              fixture,
            });
          }
        }
      });

      if (name && shapes.length > 0) {
        bodies.set(name, {
          name,
          dynamic,
          shapes,
        });
      }
    });

    // Store the loaded data for future use
    loadedPhysicsData = bodies;

    console.log(
      "Physics XML parsed successfully, found bodies:",
      Array.from(bodies.keys())
    );
    return bodies;
  } catch (error) {
    console.error("Error loading physics XML:", error);
    throw error; // Rethrow to ensure the error is properly handled upstream
  }
}

/**
 * Creates a Box2D circle from the shape data
 */
export function createCircleFromShapeData(
  shapeData: CircleShapeData
): Record<string, unknown> {
  return {
    radius: shapeData.radius,
    position: { x: shapeData.x, y: shapeData.y },
  };
}

/**
 * Creates a Box2D polygon from the shape data
 */
export function createPolygonFromShapeData(
  shapeData: PolygonShapeData
): Record<string, unknown> {
  // Box2D expects vertices to be in counter-clockwise order
  return {
    vertices: shapeData.vertices.map((v) => [v.x, v.y]).flat(),
  };
}
