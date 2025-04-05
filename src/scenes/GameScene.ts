import Phaser from "phaser";
import GameState from "../state/gameState";
import Player from "../entities/Player";
import {
  b2World,
  b2Vec2,
  b2BodyDef,
  b2BodyType,
  b2FixtureDef,
  b2PolygonShape,
  b2ContactListener,
  b2Contact,
  b2Manifold,
  b2WorldManifold,
  DRAW_SHAPE,
  DRAW_JOINT,
  DRAW_AABB,
  DRAW_PAIR,
  DRAW_CENTER_OF_MASS,
} from "@PhaserBox2D";
import GameOverOverlay from "../ui/GameOverOverlay";
import MobileControls from "../ui/MobileControls";
// ... existing code ...
