import * as PIXI from 'pixi.js';
import type { MapData, MapJoint, MapShape } from '../types/types';

const SHADOW_ALPHA = 0.17;
const SHADOW_OFFSET = 2;
const JOINT_LINE_COLOR = 0xcccccc;
const JOINT_LINE_ALPHA = 0.5;
const JOINT_LINE_WIDTH = 1;
const CAP_ZONE_LINE_WIDTH = 3;
const BG_INNER = '#3b536b';
const BG_OUTER = '#2c3e50';
const BG_PADDING = 25;
const BASE_WIDTH = 730;
const BASE_HEIGHT = 500;

/**
 * Builds the complete PIXI scene graph from map data, matching the
 * bonk.io game client rendering pipeline.
 *
 * Scene hierarchy:
 *   stage
 *   ├── bgGradient
 *   └── envContainer
 *       └── per body:
 *           ├── jointGfx
 *           └── bodyContainer
 *               ├── rvLine
 *               ├── shadowContainer
 *               └── shape graphics
 */
export function buildScene(stage: PIXI.Container, map: MapData, scale: number): void {
	stage.addChild(createBackground(scale));

	const envContainer = new PIXI.Container();
	envContainer.x = (BASE_WIDTH / 2) * scale;
	envContainer.y = (BASE_HEIGHT / 2) * scale;
	stage.addChild(envContainer);

	const capZoneFixtures = new Set<number>();
	for (const cz of map.capZones) {
		capZoneFixtures.add(cz.fixtureIndex);
	}

	const jointsByBody = new Map<number, MapJoint[]>();
	for (const joint of map.physics.joints) {
		if (joint.bodyA == null || !joint.properties?.drawLine) continue;
		let list = jointsByBody.get(joint.bodyA);
		if (!list) {
			list = [];
			jointsByBody.set(joint.bodyA, list);
		}
		list.push(joint);
	}

	const bro = map.physics.bodyRenderOrder;
	for (let i = bro.length - 1; i >= 0; i--) {
		const bodyIndex = bro[i];
		const body = map.physics.bodies[bodyIndex];
		if (!body) continue;

		const bodyJoints = jointsByBody.get(bodyIndex);

		if (bodyJoints) {
			const jointGfx = buildWorldJoints(bodyJoints, map.physics.bodies, scale);
			if (jointGfx) envContainer.addChild(jointGfx);
		}

		const bodyContainer = buildBodyContainer(
			map,
			bodyIndex,
			scale,
			capZoneFixtures,
			bodyJoints,
		);

		bodyContainer.x = body.position[0] * scale;
		bodyContainer.y = body.position[1] * scale;
		bodyContainer.rotation = body.angle;

		envContainer.addChild(bodyContainer);
	}
}

function createBackground(scale: number): PIXI.Graphics {
	const bgWidth = (BASE_WIDTH + BG_PADDING * 2) * scale;
	const bgHeight = (BASE_HEIGHT + BG_PADDING * 2) * scale;

	const canvas = document.createElement('canvas');
	canvas.width = bgWidth;
	canvas.height = bgHeight;
	const ctx = canvas.getContext('2d')!;

	const gradient = ctx.createRadialGradient(0, 0, 10 * scale, 0, 0, 540 * scale);
	gradient.addColorStop(0, BG_INNER);
	gradient.addColorStop(1, BG_OUTER);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, bgWidth, bgHeight);

	const texture = PIXI.Texture.from(canvas);
	const bg = new PIXI.Graphics();
	bg.beginTextureFill({ texture });
	bg.drawRect(0, 0, bgWidth, bgHeight);
	bg.endFill();
	bg.x = -BG_PADDING * scale;
	bg.y = -BG_PADDING * scale;

	return bg;
}

function buildBodyContainer(
	map: MapData,
	bodyIndex: number,
	scale: number,
	capZoneFixtures: Set<number>,
	bodyJoints: MapJoint[] | undefined,
): PIXI.Container {
	const body = map.physics.bodies[bodyIndex];
	const container = new PIXI.Container();
	const hasForceZone = body.forceZone.enabled;

	let shadowContainer: PIXI.Container | null = null;
	if (!hasForceZone) {
		shadowContainer = new PIXI.Container();
		const so = SHADOW_OFFSET * scale;
		const cos = Math.cos(-body.angle);
		const sin = Math.sin(-body.angle);
		shadowContainer.x = so * cos - so * sin;
		shadowContainer.y = so * sin + so * cos;
		container.addChild(shadowContainer);
	}

	for (const fixtureIndex of body.fixtureIndices) {
		const fixture = map.physics.fixtures[fixtureIndex];
		if (!fixture) continue;
		const shape = map.physics.shapes[fixture.shapeIndex];
		if (!shape) continue;

		const isCapZone = capZoneFixtures.has(fixtureIndex);

		if (shadowContainer && !fixture.noPhysics) {
			const shadow = new PIXI.Graphics();
			if (isCapZone) {
				shadow.lineStyle(CAP_ZONE_LINE_WIDTH * scale, 0x000000, SHADOW_ALPHA);
			} else {
				shadow.beginFill(0x000000, SHADOW_ALPHA);
			}
			drawShapeGeometry(shadow, shape, scale);
			shadow.endFill();
			shadowContainer.addChild(shadow);
		}

		const graphic = new PIXI.Graphics();
		if (isCapZone) {
			graphic.lineStyle(CAP_ZONE_LINE_WIDTH * scale, 0xffffff, 1);
		} else {
			graphic.beginFill(fixture.color);
		}
		drawShapeGeometry(graphic, shape, scale);
		graphic.endFill();
		container.addChild(graphic);
	}

	if (bodyJoints) {
		const rvLine = buildRevoluteLines(bodyJoints, scale);
		if (rvLine) container.addChildAt(rvLine, 0);
	}

	return container;
}

function drawShapeGeometry(graphics: PIXI.Graphics, shape: MapShape, scale: number): void {
	switch (shape.type) {
		case 'bx': {
			graphics.drawRect(
				(-shape.width / 2) * scale,
				(-shape.height / 2) * scale,
				shape.width * scale,
				shape.height * scale,
			);
			graphics.x = shape.center[0] * scale;
			graphics.y = shape.center[1] * scale;
			graphics.rotation = shape.angle;
			break;
		}
		case 'ci': {
			graphics.drawCircle(0, 0, shape.radius * scale);
			graphics.x = shape.center[0] * scale;
			graphics.y = shape.center[1] * scale;
			break;
		}
		case 'po': {
			const v = shape.vertices;
			if (v.length > 0) {
				const s = shape.scale;
				const a = shape.angle;
				const cx = shape.center[0];
				const cy = shape.center[1];
				const cos = Math.cos(a);
				const sin = Math.sin(a);

				for (let j = 0; j < v.length; j++) {
					const sx = v[j][0] * s;
					const sy = v[j][1] * s;
					const rx = (sx * cos - sy * sin + cx) * scale;
					const ry = (sx * sin + sy * cos + cy) * scale;
					if (j === 0) {
						graphics.moveTo(rx, ry);
					} else {
						graphics.lineTo(rx, ry);
					}
				}
				const sx0 = v[0][0] * s;
				const sy0 = v[0][1] * s;
				graphics.lineTo(
					(sx0 * cos - sy0 * sin + cx) * scale,
					(sx0 * sin + sy0 * cos + cy) * scale,
				);
			}
			break;
		}
	}
}

function buildRevoluteLines(joints: MapJoint[], scale: number): PIXI.Graphics | null {
	let gfx: PIXI.Graphics | null = null;

	for (const joint of joints) {
		if (joint.type !== 'rv') continue;
		if (!gfx) {
			gfx = new PIXI.Graphics();
			gfx.lineStyle(JOINT_LINE_WIDTH, JOINT_LINE_COLOR, JOINT_LINE_ALPHA);
		}
		gfx.moveTo(0, 0);
		gfx.lineTo((joint.anchorA?.[0] ?? 0) * scale, (joint.anchorA?.[1] ?? 0) * scale);
	}

	return gfx;
}

function buildWorldJoints(
	joints: MapJoint[],
	bodies: MapData['physics']['bodies'],
	scale: number,
): PIXI.Graphics | null {
	let gfx: PIXI.Graphics | null = null;

	for (const joint of joints) {
		if (joint.type === 'lpj') {
			const pathLen = (joint.pathLength ?? 0) * scale;
			const angle = joint.pathAngle ?? 0;
			const cos = Math.cos(angle);
			const sin = Math.sin(angle);
			const sx = (joint.pathStartX ?? 0) * scale;
			const sy = (joint.pathStartY ?? 0) * scale;

			if (!gfx) {
				gfx = new PIXI.Graphics();
				gfx.lineStyle(JOINT_LINE_WIDTH, JOINT_LINE_COLOR, JOINT_LINE_ALPHA);
			}
			gfx.moveTo(pathLen * cos + sx, pathLen * sin + sy);
			gfx.lineTo(-pathLen * cos + sx, -pathLen * sin + sy);
		} else if (joint.type === 'd') {
			const bodyA = bodies[joint.bodyA!];
			if (!bodyA) continue;

			const aAnchor = joint.anchorA ?? [0, 0];
			const cosA = Math.cos(bodyA.angle);
			const sinA = Math.sin(bodyA.angle);
			const awx = aAnchor[0] * cosA - aAnchor[1] * sinA + bodyA.position[0];
			const awy = aAnchor[0] * sinA + aAnchor[1] * cosA + bodyA.position[1];

			let bwx: number;
			let bwy: number;
			const bAnchor = joint.anchorB ?? [0, 0];

			if (joint.bodyB == null || joint.bodyB === -1) {
				bwx = bAnchor[0];
				bwy = bAnchor[1];
			} else {
				const bodyB = bodies[joint.bodyB];
				if (!bodyB) continue;
				const cosB = Math.cos(bodyB.angle);
				const sinB = Math.sin(bodyB.angle);
				bwx = bAnchor[0] * cosB - bAnchor[1] * sinB + bodyB.position[0];
				bwy = bAnchor[0] * sinB + bAnchor[1] * cosB + bodyB.position[1];
			}

			if (!gfx) {
				gfx = new PIXI.Graphics();
				gfx.lineStyle(JOINT_LINE_WIDTH, JOINT_LINE_COLOR, JOINT_LINE_ALPHA);
			}
			gfx.moveTo(awx * scale, awy * scale);
			gfx.lineTo(bwx * scale, bwy * scale);
		}
	}

	return gfx;
}
