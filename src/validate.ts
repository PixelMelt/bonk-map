import type {
	MapData,
	MapShape,
	MapFixture,
	MapBody,
	MapJoint,
	MapSpawn,
	MapCapZone,
	MapMetadata,
	MapPhysics,
	ValidationIssue,
	ValidationResult,
} from './types/types';
import { decodeFromDatabase } from './map';

const BODY_TYPES = ['s', 'd', 'k'];
const FORCE_TYPES = [0, 1, 2, 3];
const JOINT_TYPES = ['rv', 'd', 'lpj', 'lsj', 'g'];
const SHAPE_TYPES = ['bx', 'ci', 'po', 'ch'];

function issue(
	path: string,
	message: string,
	value?: unknown,
	constraint?: ValidationIssue['constraint'],
): ValidationIssue {
	return { path, message, value, constraint };
}

function checkRange(
	issues: ValidationIssue[],
	path: string,
	value: number,
	min: number,
	max: number,
): void {
	if (typeof value !== 'number' || Number.isNaN(value)) {
		issues.push(issue(path, `expected a number, got ${typeof value}`, value));
		return;
	}
	if (value < min || value > max) {
		issues.push(
			issue(path, `must be in [${min}, ${max}], got ${value}`, value, { min, max }),
		);
	}
}

function checkMaxLength(
	issues: ValidationIssue[],
	path: string,
	value: string,
	maxLength: number,
): void {
	if (typeof value !== 'string') {
		issues.push(issue(path, `expected a string, got ${typeof value}`, value));
		return;
	}
	if (value.length > maxLength) {
		issues.push(
			issue(path, `must be at most ${maxLength} characters, got ${value.length}`, value, {
				maxLength,
			}),
		);
	}
}

function checkIndex(
	issues: ValidationIssue[],
	path: string,
	value: number,
	arrayName: string,
	arrayLength: number,
	allowNegativeOne = false,
): void {
	const min = allowNegativeOne ? -1 : 0;
	if (value < min || value >= arrayLength) {
		const rangeDesc = allowNegativeOne
			? `[-1, ${arrayLength - 1}] (-1 = ground)`
			: `[0, ${arrayLength - 1}]`;
		issues.push(
			issue(path, `references ${arrayName} index ${value}, valid range is ${rangeDesc}`, value),
		);
	}
}

function checkCount(issues: ValidationIssue[], path: string, count: number, max: number): void {
	if (count > max) {
		issues.push(issue(path, `count ${count} exceeds maximum of ${max}`, count, { max }));
	}
}

function toResult(issues: ValidationIssue[]): ValidationResult {
	return {
		valid: issues.length === 0,
		issues,
	};
}

function _validateShapes(shapes: MapShape[], issues: ValidationIssue[]): void {
	checkCount(issues, 'physics.shapes', shapes.length, 1000);

	for (let i = 0; i < shapes.length; i++) {
		const s = shapes[i];
		const p = `physics.shapes[${i}]`;

		checkRange(issues, `${p}.center[0]`, s.center[0], -99999, 99999);
		checkRange(issues, `${p}.center[1]`, s.center[1], -99999, 99999);

		if (s.type === 'bx') {
			checkRange(issues, `${p}.width`, s.width, 0.001, 99999);
			checkRange(issues, `${p}.height`, s.height, 0.001, 99999);
			checkRange(issues, `${p}.angle`, s.angle, -999, 999);
		} else if (s.type === 'ci') {
			checkRange(issues, `${p}.radius`, s.radius, 0.001, 2000);
		} else if (s.type === 'po' || s.type === 'ch') {
			checkRange(issues, `${p}.scale`, s.scale, 0.001, 99999);
			checkRange(issues, `${p}.angle`, s.angle, -999, 999);
			checkCount(issues, `${p}.vertices`, s.vertices.length, 100);
			for (let vi = 0; vi < s.vertices.length; vi++) {
				checkRange(issues, `${p}.vertices[${vi}][0]`, s.vertices[vi][0], -99999, 99999);
				checkRange(issues, `${p}.vertices[${vi}][1]`, s.vertices[vi][1], -99999, 99999);
			}
		} else {
			issues.push(
				issue(`${p}.type`, `unknown shape type`, (s as MapShape).type, {
					oneOf: SHAPE_TYPES,
				}),
			);
		}
	}
}

function _validateFixtures(
	fixtures: MapFixture[],
	shapeCount: number,
	issues: ValidationIssue[],
): void {
	checkCount(issues, 'physics.fixtures', fixtures.length, 1000);

	for (let i = 0; i < fixtures.length; i++) {
		const f = fixtures[i];
		const p = `physics.fixtures[${i}]`;

		checkIndex(issues, `${p}.shapeIndex`, f.shapeIndex, 'shapes', shapeCount);
		checkMaxLength(issues, `${p}.name`, f.name, 30);
		checkRange(issues, `${p}.color`, f.color, 0, 0xffffff);

		if (f.friction !== null) {
			checkRange(issues, `${p}.friction`, f.friction, -99999, 99999);
		}
		if (f.restitution !== null) {
			checkRange(issues, `${p}.restitution`, f.restitution, -99999, 99999);
		}
		if (f.density !== null) {
			checkRange(issues, `${p}.density`, f.density, -99999, 99999);
		}
		if (f.zPosition !== undefined) {
			checkRange(issues, `${p}.zPosition`, f.zPosition, -1000, 1000);
		}
	}
}

function _validateBodies(bodies: MapBody[], fixtureCount: number, issues: ValidationIssue[]): void {
	checkCount(issues, 'physics.bodies', bodies.length, 300);

	for (let i = 0; i < bodies.length; i++) {
		const b = bodies[i];
		const p = `physics.bodies[${i}]`;

		checkRange(issues, `${p}.position[0]`, b.position[0], -99999, 99999);
		checkRange(issues, `${p}.position[1]`, b.position[1], -99999, 99999);
		checkRange(issues, `${p}.angle`, b.angle, -9999, 9999);
		checkRange(issues, `${p}.linearVelocity[0]`, b.linearVelocity[0], -99999, 99999);
		checkRange(issues, `${p}.linearVelocity[1]`, b.linearVelocity[1], -99999, 99999);

		if (!BODY_TYPES.includes(b.settings.type)) {
			issues.push(
				issue(
					`${p}.settings.type`,
					`must be one of "s", "d", "k", got "${b.settings.type}"`,
					b.settings.type,
					{ oneOf: BODY_TYPES },
				),
			);
		}

		checkMaxLength(issues, `${p}.settings.name`, b.settings.name, 30);
		checkCount(issues, `${p}.fixtureIndices`, b.fixtureIndices.length, 100);

		for (let fi = 0; fi < b.fixtureIndices.length; fi++) {
			checkIndex(
				issues,
				`${p}.fixtureIndices[${fi}]`,
				b.fixtureIndices[fi],
				'fixtures',
				fixtureCount,
			);
		}

		if (b.forceZone.enabled && !FORCE_TYPES.includes(b.forceZone.forceType)) {
			issues.push(
				issue(
					`${p}.forceZone.forceType`,
					`must be one of 0, 1, 2, 3, got ${b.forceZone.forceType}`,
					b.forceZone.forceType,
					{ oneOf: FORCE_TYPES },
				),
			);
		}
	}
}

function _validateJoints(
	joints: MapJoint[],
	bodyCount: number,
	jointCount: number,
	issues: ValidationIssue[],
): void {
	checkCount(issues, 'physics.joints', joints.length, 100);

	for (let i = 0; i < joints.length; i++) {
		const j = joints[i];
		const p = `physics.joints[${i}]`;

		if (!JOINT_TYPES.includes(j.type)) {
			issues.push(
				issue(`${p}.type`, `unknown joint type "${j.type}"`, j.type, {
					oneOf: JOINT_TYPES,
				}),
			);
			continue;
		}

		if (j.name !== undefined) {
			checkMaxLength(issues, `${p}.name`, j.name, 30);
		}

		if (j.type === 'g') {
			if (j.jointA !== undefined) {
				checkIndex(issues, `${p}.jointA`, j.jointA, 'joints', jointCount, true);
			}
			if (j.jointB !== undefined) {
				checkIndex(issues, `${p}.jointB`, j.jointB, 'joints', jointCount, true);
			}
		} else {
			if (j.bodyA !== undefined) {
				checkIndex(issues, `${p}.bodyA`, j.bodyA, 'bodies', bodyCount, true);
			}
			if (j.bodyB !== undefined) {
				checkIndex(issues, `${p}.bodyB`, j.bodyB, 'bodies', bodyCount, true);
			}
		}
	}
}

function _validateSpawns(spawns: MapSpawn[], issues: ValidationIssue[]): void {
	checkCount(issues, 'spawns', spawns.length, 100);

	for (let i = 0; i < spawns.length; i++) {
		const s = spawns[i];
		const p = `spawns[${i}]`;

		checkRange(issues, `${p}.x`, s.x, -10000, 10000);
		checkRange(issues, `${p}.y`, s.y, -10000, 10000);
		checkRange(issues, `${p}.velocityX`, s.velocityX, -10000, 10000);
		checkRange(issues, `${p}.velocityY`, s.velocityY, -10000, 10000);
		checkRange(issues, `${p}.priority`, s.priority, 0, 10000);
		checkMaxLength(issues, `${p}.name`, s.name, 60);
	}
}

function _validateCapZones(
	capZones: MapCapZone[],
	fixtureCount: number,
	issues: ValidationIssue[],
): void {
	checkCount(issues, 'capZones', capZones.length, 50);

	for (let i = 0; i < capZones.length; i++) {
		const cz = capZones[i];
		const p = `capZones[${i}]`;

		checkMaxLength(issues, `${p}.name`, cz.name, 30);
		checkRange(issues, `${p}.captureTime`, cz.captureTime, 0.01, 1000);
		checkRange(issues, `${p}.captureType`, cz.captureType, 1, 5);

		if (cz.fixtureIndex !== -1) {
			checkIndex(issues, `${p}.fixtureIndex`, cz.fixtureIndex, 'fixtures', fixtureCount);
		}
	}
}

function _validateMetadata(metadata: MapMetadata, issues: ValidationIssue[]): void {
	checkMaxLength(issues, 'metadata.author', metadata.author, 15);
	checkMaxLength(issues, 'metadata.name', metadata.name, 25);
	checkMaxLength(issues, 'metadata.mode', metadata.mode, 5);
}

function _validatePhysics(physics: MapPhysics, issues: ValidationIssue[]): void {
	checkRange(issues, 'physics.pixelsPerMeter', physics.pixelsPerMeter, 5, 30);

	for (let i = 0; i < physics.bodyRenderOrder.length; i++) {
		checkIndex(
			issues,
			`physics.bodyRenderOrder[${i}]`,
			physics.bodyRenderOrder[i],
			'bodies',
			physics.bodies.length,
		);
	}
}

export function validateShapes(shapes: MapShape[]): ValidationResult {
	const issues: ValidationIssue[] = [];
	_validateShapes(shapes, issues);
	return toResult(issues);
}

export function validateFixtures(fixtures: MapFixture[], shapeCount: number): ValidationResult {
	const issues: ValidationIssue[] = [];
	_validateFixtures(fixtures, shapeCount, issues);
	return toResult(issues);
}

export function validateBodies(bodies: MapBody[], fixtureCount: number): ValidationResult {
	const issues: ValidationIssue[] = [];
	_validateBodies(bodies, fixtureCount, issues);
	return toResult(issues);
}

export function validateJoints(
	joints: MapJoint[],
	bodyCount: number,
	jointCount?: number,
): ValidationResult {
	const issues: ValidationIssue[] = [];
	_validateJoints(joints, bodyCount, jointCount ?? joints.length, issues);
	return toResult(issues);
}

export function validateSpawns(spawns: MapSpawn[]): ValidationResult {
	const issues: ValidationIssue[] = [];
	_validateSpawns(spawns, issues);
	return toResult(issues);
}

export function validateCapZones(capZones: MapCapZone[], fixtureCount: number): ValidationResult {
	const issues: ValidationIssue[] = [];
	_validateCapZones(capZones, fixtureCount, issues);
	return toResult(issues);
}

export function validateMetadata(metadata: MapMetadata): ValidationResult {
	const issues: ValidationIssue[] = [];
	_validateMetadata(metadata, issues);
	return toResult(issues);
}

export function validatePhysics(physics: MapPhysics): ValidationResult {
	const issues: ValidationIssue[] = [];
	_validatePhysics(physics, issues);
	return toResult(issues);
}

export function validateMap(map: MapData): ValidationResult {
	const issues: ValidationIssue[] = [];
	const { physics, metadata, spawns, capZones } = map;

	_validateMetadata(metadata, issues);
	_validatePhysics(physics, issues);
	_validateShapes(physics.shapes, issues);
	_validateFixtures(physics.fixtures, physics.shapes.length, issues);
	_validateBodies(physics.bodies, physics.fixtures.length, issues);
	_validateJoints(physics.joints, physics.bodies.length, physics.joints.length, issues);
	_validateSpawns(spawns, issues);
	_validateCapZones(capZones, physics.fixtures.length, issues);

	return toResult(issues);
}

export function decodeAndValidate(encodedString: string): {
	map: MapData;
	validation: ValidationResult;
} {
	const map = decodeFromDatabase(encodedString);
	const validation = validateMap(map);
	return { map, validation };
}
