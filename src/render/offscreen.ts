import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import type { MapBody, MapData, MapJoint, MapShape } from '../types/types';

const SHADOW_ALPHA = 0.17;
const SHADOW_OFFSET = 2;
const JOINT_LINE_COLOR = 'rgba(204,204,204,0.5)';
const JOINT_LINE_WIDTH = 1;
const CAP_ZONE_LINE_WIDTH = 3;
const BG_INNER = '#3b536b';
const BG_OUTER = '#2c3e50';
const BASE_WIDTH = 730;
const BASE_HEIGHT = 500;
const TWO_PI = Math.PI * 2;

function colorToHex(color: number): string {
	return '#' + color.toString(16).padStart(6, '0');
}

export interface RenderToBufferOptions {
	width?: number;
	height?: number;
}

export function renderToBuffer(map: MapData, options?: RenderToBufferOptions): Buffer {
	const width = options?.width ?? BASE_WIDTH;
	const height = options?.height ?? BASE_HEIGHT;
	const sr = width / BASE_WIDTH;

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	const grad = ctx.createRadialGradient(0, 0, 10 * sr, 0, 0, 540 * sr);
	grad.addColorStop(0, BG_INNER);
	grad.addColorStop(1, BG_OUTER);
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, width, height);

	const capZoneFixtures = new Set<number>();
	for (const cz of map.capZones) {
		capZoneFixtures.add(cz.fixtureIndex);
	}

	const jointsByBody = new Map<number, MapJoint[]>();
	for (const j of map.physics.joints) {
		if (j.bodyA == null || !j.properties?.drawLine) continue;
		let list = jointsByBody.get(j.bodyA);
		if (!list) {
			list = [];
			jointsByBody.set(j.bodyA, list);
		}
		list.push(j);
	}

	ctx.save();
	ctx.translate((BASE_WIDTH / 2) * sr, (BASE_HEIGHT / 2) * sr);

	const bro = map.physics.bodyRenderOrder;
	for (let i = bro.length - 1; i >= 0; i--) {
		const bodyIdx = bro[i];
		const body = map.physics.bodies[bodyIdx];
		if (!body) continue;

		const bodyJoints = jointsByBody.get(bodyIdx);

		if (bodyJoints) drawWorldJoints(ctx, bodyJoints, body, map.physics.bodies, sr);

		ctx.save();
		ctx.translate(body.position[0] * sr, body.position[1] * sr);
		ctx.rotate(body.angle);

		if (bodyJoints) drawRevoluteLines(ctx, bodyJoints, sr);

		if (!body.forceZone.enabled) {
			const so = SHADOW_OFFSET * sr;
			const cos = Math.cos(-body.angle);
			const sin = Math.sin(-body.angle);

			ctx.save();
			ctx.translate(so * cos - so * sin, so * sin + so * cos);
			ctx.globalAlpha = SHADOW_ALPHA;

		for (const fi of body.fixtureIndices) {
			const fx = map.physics.fixtures[fi];
			if (!fx || fx.noPhysics) continue;
				const sh = map.physics.shapes[fx.shapeIndex];
				if (!sh) continue;

				if (capZoneFixtures.has(fi)) {
					ctx.strokeStyle = '#000000';
					ctx.lineWidth = CAP_ZONE_LINE_WIDTH * sr;
					drawShape(ctx, sh, sr, true);
				} else {
					ctx.fillStyle = '#000000';
					drawShape(ctx, sh, sr, false);
				}
			}

			ctx.restore();
		}

		ctx.globalAlpha = 1;
		for (const fi of body.fixtureIndices) {
			const fx = map.physics.fixtures[fi];
			if (!fx) continue;
			const sh = map.physics.shapes[fx.shapeIndex];
			if (!sh) continue;

			if (capZoneFixtures.has(fi)) {
				ctx.strokeStyle = '#ffffff';
				ctx.lineWidth = CAP_ZONE_LINE_WIDTH * sr;
				drawShape(ctx, sh, sr, true);
			} else {
				ctx.fillStyle = colorToHex(fx.color);
				drawShape(ctx, sh, sr, false);
			}
		}

		ctx.restore();
	}

	ctx.restore();
	return canvas.toBuffer('image/png');
}

function drawShape(ctx: SKRSContext2D, shape: MapShape, sr: number, strokeOnly: boolean): void {
	switch (shape.type) {
		case 'bx': {
			ctx.save();
			ctx.translate(shape.center[0] * sr, shape.center[1] * sr);
			ctx.rotate(shape.angle);
			const x = (-shape.width / 2) * sr;
			const y = (-shape.height / 2) * sr;
			const w = shape.width * sr;
			const h = shape.height * sr;
			if (strokeOnly) {
				ctx.strokeRect(x, y, w, h);
			} else {
				ctx.fillRect(x, y, w, h);
			}
			ctx.restore();
			break;
		}
		case 'ci': {
			ctx.beginPath();
			ctx.arc(shape.center[0] * sr, shape.center[1] * sr, shape.radius * sr, 0, TWO_PI);
			if (strokeOnly) {
				ctx.stroke();
			} else {
				ctx.fill();
			}
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

				ctx.beginPath();
				for (let j = 0; j < v.length; j++) {
					const sx = v[j][0] * s;
					const sy = v[j][1] * s;
					const rx = sx * cos - sy * sin + cx;
					const ry = sx * sin + sy * cos + cy;
					if (j === 0) {
						ctx.moveTo(rx * sr, ry * sr);
					} else {
						ctx.lineTo(rx * sr, ry * sr);
					}
				}
				ctx.closePath();
				if (strokeOnly) {
					ctx.stroke();
				} else {
					ctx.fill();
				}
			}
			break;
		}
	}
}

function drawRevoluteLines(ctx: SKRSContext2D, joints: MapJoint[], sr: number): void {
	ctx.strokeStyle = JOINT_LINE_COLOR;
	ctx.lineWidth = JOINT_LINE_WIDTH;
	for (const j of joints) {
		if (j.type !== 'rv') continue;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo((j.anchorA?.[0] ?? 0) * sr, (j.anchorA?.[1] ?? 0) * sr);
		ctx.stroke();
	}
}

function drawWorldJoints(
	ctx: SKRSContext2D,
	joints: MapJoint[],
	body: MapBody,
	bodies: MapBody[],
	sr: number,
): void {
	ctx.strokeStyle = JOINT_LINE_COLOR;
	ctx.lineWidth = JOINT_LINE_WIDTH;

	for (const j of joints) {
		if (j.type === 'lpj') {
			ctx.save();
			ctx.translate((j.pathStartX ?? 0) * sr, (j.pathStartY ?? 0) * sr);
			ctx.rotate(j.pathAngle ?? 0);
			const len = (j.pathLength ?? 0) * sr;
			ctx.beginPath();
			ctx.moveTo(len, 0);
			ctx.lineTo(-len, 0);
			ctx.stroke();
			ctx.restore();
		} else if (j.type === 'd') {
			const aA = j.anchorA ?? [0, 0];
			const cosA = Math.cos(body.angle);
			const sinA = Math.sin(body.angle);
			const awx = aA[0] * cosA - aA[1] * sinA + body.position[0];
			const awy = aA[0] * sinA + aA[1] * cosA + body.position[1];

			const bAnc = j.anchorB ?? [0, 0];
			let bwx: number, bwy: number;
			if (j.bodyB == null || j.bodyB === -1) {
				bwx = bAnc[0];
				bwy = bAnc[1];
			} else {
				const bB = bodies[j.bodyB];
				if (!bB) continue;
				const cosB = Math.cos(bB.angle);
				const sinB = Math.sin(bB.angle);
				bwx = bAnc[0] * cosB - bAnc[1] * sinB + bB.position[0];
				bwy = bAnc[0] * sinB + bAnc[1] * cosB + bB.position[1];
			}

			ctx.beginPath();
			ctx.moveTo(awx * sr, awy * sr);
			ctx.lineTo(bwx * sr, bwy * sr);
			ctx.stroke();
		}
	}
}
