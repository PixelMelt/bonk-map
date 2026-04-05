import { describe, it, expect } from 'bun:test';
import {
	validateShapes,
	validateFixtures,
	validateBodies,
	validateJoints,
	validateSpawns,
	validateCapZones,
	validateMetadata,
	validatePhysics,
	validateMap,
	decodeAndValidate,
	getBlankMap,
	getNewBody,
	getNewFixture,
	getNewBoxShape,
	getNewCircleShape,
	getNewPolyShape,
	getNewChainShape,
	getNewRevoluteJoint,
	getNewDistanceJoint,
	getNewLPJJoint,
	getNewLSJJoint,
	getNewGearJoint,
	getNewCapZone,
	getNewSpawn,
	encodeToDatabase,
} from '../src/index';
import type { MapShape, MapJoint } from '../src/index';

function validMap() {
	const map = getBlankMap();
	map.physics.shapes = [getNewBoxShape(), getNewCircleShape()];
	map.physics.fixtures = [getNewFixture(0), getNewFixture(1)];
	const body = getNewBody();
	body.fixtureIndices = [0];
	map.physics.bodies = [body];
	map.physics.bodyRenderOrder = [0];
	map.physics.joints = [getNewRevoluteJoint(0, 0)];
	map.spawns = [getNewSpawn()];
	map.capZones = [getNewCapZone()];
	return map;
}

describe('validateShapes', () => {
	it('accepts an empty array', () => {
		const r = validateShapes([]);
		expect(r.valid).toBe(true);
		expect(r.issues).toHaveLength(0);
	});

	it('accepts a valid box shape', () => {
		expect(validateShapes([getNewBoxShape()]).valid).toBe(true);
	});

	it('accepts a valid circle shape', () => {
		expect(validateShapes([getNewCircleShape()]).valid).toBe(true);
	});

	it('accepts a valid poly shape with vertices', () => {
		const s = getNewPolyShape();
		s.vertices = [
			[0, 0],
			[10, 0],
			[10, 10],
		];
		expect(validateShapes([s]).valid).toBe(true);
	});

	it('accepts a valid chain shape', () => {
		const s = getNewChainShape();
		s.vertices = [
			[0, 0],
			[50, 50],
		];
		expect(validateShapes([s]).valid).toBe(true);
	});

	it('accepts values at exact boundaries', () => {
		const box = getNewBoxShape();
		box.center = [-99999, 99999];
		box.width = 0.001;
		box.height = 99999;
		box.angle = -999;
		expect(validateShapes([box]).valid).toBe(true);

		const ci = getNewCircleShape();
		ci.radius = 2000;
		expect(validateShapes([ci]).valid).toBe(true);
	});

	it('rejects center out of range', () => {
		const s = getNewBoxShape();
		s.center = [100000, 0];
		const r = validateShapes([s]);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('center[0]'))).toBe(true);
	});

	it('rejects box with zero width', () => {
		const s = getNewBoxShape();
		(s as any).width = 0;
		expect(validateShapes([s]).valid).toBe(false);
	});

	it('rejects circle radius above 2000', () => {
		const s = getNewCircleShape();
		s.radius = 2001;
		const r = validateShapes([s]);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('radius'))).toBe(true);
	});

	it('rejects unknown shape type', () => {
		const s = { type: 'zz', center: [0, 0] } as unknown as MapShape;
		const r = validateShapes([s]);
		expect(r.valid).toBe(false);
		expect(r.issues[0].constraint?.oneOf).toEqual(['bx', 'ci', 'po', 'ch']);
	});

	it('rejects count exceeding 1000', () => {
		const shapes = Array.from({ length: 1001 }, () => getNewBoxShape());
		const r = validateShapes(shapes);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.message.includes('exceeds maximum'))).toBe(true);
	});

	it('rejects poly with too many vertices', () => {
		const s = getNewPolyShape();
		s.vertices = Array.from({ length: 101 }, () => [0, 0] as [number, number]);
		expect(validateShapes([s]).valid).toBe(false);
	});

	it('rejects poly vertex out of range', () => {
		const s = getNewPolyShape();
		s.vertices = [[0, 100000]];
		const r = validateShapes([s]);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('vertices[0][1]'))).toBe(true);
	});

	it('rejects box angle out of range', () => {
		const s = getNewBoxShape();
		s.angle = 1000;
		expect(validateShapes([s]).valid).toBe(false);
	});

	it('rejects poly scale out of range', () => {
		const s = getNewPolyShape();
		s.scale = 0;
		expect(validateShapes([s]).valid).toBe(false);
	});
});

describe('validateFixtures', () => {
	it('accepts an empty array', () => {
		expect(validateFixtures([], 0).valid).toBe(true);
	});

	it('accepts a valid fixture', () => {
		expect(validateFixtures([getNewFixture(0)], 1).valid).toBe(true);
	});

	it('rejects invalid shape index', () => {
		const r = validateFixtures([getNewFixture(5)], 3);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('shapeIndex'))).toBe(true);
	});

	it('rejects name exceeding 30 characters', () => {
		const f = getNewFixture(0);
		f.name = 'x'.repeat(31);
		expect(validateFixtures([f], 1).valid).toBe(false);
	});

	it('accepts name at exactly 30 characters', () => {
		const f = getNewFixture(0);
		f.name = 'x'.repeat(30);
		expect(validateFixtures([f], 1).valid).toBe(true);
	});

	it('rejects color out of range', () => {
		const f = getNewFixture(0);
		f.color = 0xffffff + 1;
		expect(validateFixtures([f], 1).valid).toBe(false);
	});

	it('rejects out-of-range friction', () => {
		const f = getNewFixture(0);
		f.friction = 100000;
		expect(validateFixtures([f], 1).valid).toBe(false);
	});

	it('rejects out-of-range restitution', () => {
		const f = getNewFixture(0);
		f.restitution = -100000;
		expect(validateFixtures([f], 1).valid).toBe(false);
	});

	it('rejects out-of-range density', () => {
		const f = getNewFixture(0);
		f.density = 100000;
		expect(validateFixtures([f], 1).valid).toBe(false);
	});

	it('rejects out-of-range zPosition', () => {
		const f = getNewFixture(0);
		f.zPosition = 1001;
		expect(validateFixtures([f], 1).valid).toBe(false);
	});

	it('skips null optional physics values', () => {
		const f = getNewFixture(0);
		f.friction = null;
		f.restitution = null;
		f.density = null;
		expect(validateFixtures([f], 1).valid).toBe(true);
	});

	it('rejects count exceeding 1000', () => {
		const fixtures = Array.from({ length: 1001 }, () => getNewFixture(0));
		const r = validateFixtures(fixtures, 1);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.message.includes('exceeds maximum'))).toBe(true);
	});
});

describe('validateBodies', () => {
	it('accepts an empty array', () => {
		expect(validateBodies([], 0).valid).toBe(true);
	});

	it('accepts a valid body', () => {
		expect(validateBodies([getNewBody()], 1).valid).toBe(true);
	});

	it('rejects position out of range', () => {
		const b = getNewBody();
		b.position = [100000, 0];
		expect(validateBodies([b], 1).valid).toBe(false);
	});

	it('rejects angle out of range', () => {
		const b = getNewBody();
		b.angle = 10000;
		expect(validateBodies([b], 1).valid).toBe(false);
	});

	it('rejects linearVelocity out of range', () => {
		const b = getNewBody();
		b.linearVelocity = [0, -100000];
		expect(validateBodies([b], 1).valid).toBe(false);
	});

	it('rejects invalid body type', () => {
		const b = getNewBody();
		(b.settings as any).type = 'x';
		const r = validateBodies([b], 1);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('settings.type'))).toBe(true);
	});

	it('accepts all valid body types', () => {
		for (const type of ['s', 'd', 'k']) {
			const b = getNewBody();
			b.settings.type = type;
			expect(validateBodies([b], 1).valid).toBe(true);
		}
	});

	it('rejects invalid fixture index reference', () => {
		const b = getNewBody();
		b.fixtureIndices = [5];
		expect(validateBodies([b], 3).valid).toBe(false);
	});

	it('rejects count exceeding 300', () => {
		const bodies = Array.from({ length: 301 }, () => getNewBody());
		const r = validateBodies(bodies, 0);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.message.includes('exceeds maximum of 300'))).toBe(true);
	});

	it('rejects too many fixture indices', () => {
		const b = getNewBody();
		b.fixtureIndices = Array.from({ length: 101 }, (_, i) => i);
		const r = validateBodies([b], 200);
		expect(r.valid).toBe(false);
		expect(
			r.issues.some(
				(i) => i.path.includes('fixtureIndices') && i.message.includes('exceeds maximum'),
			),
		).toBe(true);
	});

	it('rejects enabled forceZone with invalid type', () => {
		const b = getNewBody();
		b.forceZone.enabled = true;
		(b.forceZone as any).forceType = 99;
		const r = validateBodies([b], 1);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('forceZone.forceType'))).toBe(true);
	});

	it('accepts all valid force types when enabled', () => {
		for (const ft of [0, 1, 2, 3]) {
			const b = getNewBody();
			b.forceZone.enabled = true;
			b.forceZone.forceType = ft;
			expect(validateBodies([b], 1).valid).toBe(true);
		}
	});

	it('ignores forceType when forceZone disabled', () => {
		const b = getNewBody();
		b.forceZone.enabled = false;
		(b.forceZone as any).forceType = 99;
		expect(validateBodies([b], 1).valid).toBe(true);
	});

	it('rejects settings name exceeding 30 characters', () => {
		const b = getNewBody();
		b.settings.name = 'x'.repeat(31);
		expect(validateBodies([b], 1).valid).toBe(false);
	});
});

describe('validateJoints', () => {
	it('accepts an empty array', () => {
		expect(validateJoints([], 0).valid).toBe(true);
	});

	it('accepts valid revolute joint', () => {
		expect(validateJoints([getNewRevoluteJoint(0, 0)], 1).valid).toBe(true);
	});

	it('accepts valid distance joint', () => {
		expect(validateJoints([getNewDistanceJoint(0, 0)], 1).valid).toBe(true);
	});

	it('accepts valid lpj joint', () => {
		expect(validateJoints([getNewLPJJoint(0, 0)], 1).valid).toBe(true);
	});

	it('accepts valid lsj joint', () => {
		expect(validateJoints([getNewLSJJoint(0, 0)], 1).valid).toBe(true);
	});

	it('accepts gear joint referencing ground (-1)', () => {
		expect(validateJoints([getNewGearJoint()], 0).valid).toBe(true);
	});

	it('rejects unknown joint type', () => {
		const j = { type: 'zz' } as unknown as MapJoint;
		const r = validateJoints([j], 1);
		expect(r.valid).toBe(false);
		expect(r.issues[0].constraint?.oneOf).toEqual(['rv', 'd', 'lpj', 'lsj', 'g']);
	});

	it('skips further checks after unknown type', () => {
		// Unknown type should continue to next joint, not crash
		const j1 = { type: 'zz' } as unknown as MapJoint;
		const j2 = getNewRevoluteJoint(0, 0);
		const r = validateJoints([j1, j2], 1);
		// Only 1 issue (from the unknown type), j2 is fine
		expect(r.issues).toHaveLength(1);
	});

	it('rejects invalid body reference', () => {
		const r = validateJoints([getNewRevoluteJoint(5, 0)], 2);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('bodyA'))).toBe(true);
	});

	it('allows body reference of -1 (ground)', () => {
		const j = getNewRevoluteJoint(-1, 0);
		expect(validateJoints([j], 1).valid).toBe(true);
	});

	it('rejects gear joint with invalid joint reference', () => {
		const j = getNewGearJoint();
		(j as any).jointA = 10;
		const r = validateJoints([j], 0, 3);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('jointA'))).toBe(true);
	});

	it('respects explicit jointCount parameter', () => {
		const j = getNewGearJoint();
		(j as any).jointA = 2;
		// Default jointCount=1 (array length), index 2 is out of range
		expect(validateJoints([j], 0).valid).toBe(false);
		// Explicit jointCount=5, index 2 is valid
		expect(validateJoints([j], 0, 5).valid).toBe(true);
	});

	it('accepts joint name within limit', () => {
		const j = getNewRevoluteJoint(0, 0);
		j.name = 'x'.repeat(30);
		expect(validateJoints([j], 1).valid).toBe(true);
	});

	it('rejects joint name exceeding 30 characters', () => {
		const j = getNewRevoluteJoint(0, 0);
		j.name = 'x'.repeat(31);
		expect(validateJoints([j], 1).valid).toBe(false);
	});

	it('rejects count exceeding 100', () => {
		const joints = Array.from({ length: 101 }, () => getNewRevoluteJoint(0, 0));
		const r = validateJoints(joints, 1);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.message.includes('exceeds maximum'))).toBe(true);
	});
});

describe('validateSpawns', () => {
	it('accepts an empty array', () => {
		expect(validateSpawns([]).valid).toBe(true);
	});

	it('accepts a valid spawn', () => {
		expect(validateSpawns([getNewSpawn()]).valid).toBe(true);
	});

	it('rejects x coordinate out of range', () => {
		const s = getNewSpawn();
		s.x = 10001;
		expect(validateSpawns([s]).valid).toBe(false);
	});

	it('rejects y coordinate out of range', () => {
		const s = getNewSpawn();
		s.y = -10001;
		expect(validateSpawns([s]).valid).toBe(false);
	});

	it('rejects velocityX out of range', () => {
		const s = getNewSpawn();
		s.velocityX = -10001;
		expect(validateSpawns([s]).valid).toBe(false);
	});

	it('rejects velocityY out of range', () => {
		const s = getNewSpawn();
		s.velocityY = 10001;
		expect(validateSpawns([s]).valid).toBe(false);
	});

	it('rejects priority out of range', () => {
		const s = getNewSpawn();
		s.priority = -1;
		expect(validateSpawns([s]).valid).toBe(false);
	});

	it('accepts name at exactly 60 characters', () => {
		const s = getNewSpawn();
		s.name = 'x'.repeat(60);
		expect(validateSpawns([s]).valid).toBe(true);
	});

	it('rejects name exceeding 60 characters', () => {
		const s = getNewSpawn();
		s.name = 'x'.repeat(61);
		expect(validateSpawns([s]).valid).toBe(false);
	});

	it('rejects count exceeding 100', () => {
		const spawns = Array.from({ length: 101 }, () => getNewSpawn());
		const r = validateSpawns(spawns);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.message.includes('exceeds maximum'))).toBe(true);
	});
});

describe('validateCapZones', () => {
	it('accepts an empty array', () => {
		expect(validateCapZones([], 0).valid).toBe(true);
	});

	it('accepts detached cap zone (fixtureIndex -1)', () => {
		expect(validateCapZones([getNewCapZone()], 0).valid).toBe(true);
	});

	it('accepts cap zone with valid fixture reference', () => {
		const cz = getNewCapZone();
		cz.fixtureIndex = 0;
		expect(validateCapZones([cz], 3).valid).toBe(true);
	});

	it('rejects invalid fixture reference', () => {
		const cz = getNewCapZone();
		cz.fixtureIndex = 5;
		const r = validateCapZones([cz], 3);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('fixtureIndex'))).toBe(true);
	});

	it('rejects captureTime below minimum', () => {
		const cz = getNewCapZone();
		cz.captureTime = 0;
		expect(validateCapZones([cz], 0).valid).toBe(false);
	});

	it('rejects captureType out of range', () => {
		const cz = getNewCapZone();
		cz.captureType = 0;
		expect(validateCapZones([cz], 0).valid).toBe(false);
	});

	it('rejects name exceeding 30 characters', () => {
		const cz = getNewCapZone();
		cz.name = 'x'.repeat(31);
		expect(validateCapZones([cz], 0).valid).toBe(false);
	});

	it('rejects count exceeding 50', () => {
		const zones = Array.from({ length: 51 }, () => getNewCapZone());
		const r = validateCapZones(zones, 0);
		expect(r.valid).toBe(false);
	});
});

describe('validateMetadata', () => {
	const base = () => getBlankMap().metadata;

	it('accepts default metadata', () => {
		expect(validateMetadata(base()).valid).toBe(true);
	});

	it('accepts values at exact limits', () => {
		const m = base();
		m.author = 'x'.repeat(15);
		m.name = 'x'.repeat(25);
		m.mode = 'x'.repeat(5);
		expect(validateMetadata(m).valid).toBe(true);
	});

	it('rejects author exceeding 15 characters', () => {
		const m = base();
		m.author = 'x'.repeat(16);
		const r = validateMetadata(m);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path === 'metadata.author')).toBe(true);
	});

	it('rejects name exceeding 25 characters', () => {
		const m = base();
		m.name = 'x'.repeat(26);
		const r = validateMetadata(m);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path === 'metadata.name')).toBe(true);
	});

	it('rejects mode exceeding 5 characters', () => {
		const m = base();
		m.mode = 'x'.repeat(6);
		const r = validateMetadata(m);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path === 'metadata.mode')).toBe(true);
	});
});

describe('validatePhysics', () => {
	it('accepts default physics', () => {
		expect(validatePhysics(getBlankMap().physics).valid).toBe(true);
	});

	it('accepts pixelsPerMeter at boundaries', () => {
		const p = getBlankMap().physics;
		p.pixelsPerMeter = 5;
		expect(validatePhysics(p).valid).toBe(true);
		p.pixelsPerMeter = 30;
		expect(validatePhysics(p).valid).toBe(true);
	});

	it('rejects pixelsPerMeter below 5', () => {
		const p = getBlankMap().physics;
		p.pixelsPerMeter = 4;
		expect(validatePhysics(p).valid).toBe(false);
	});

	it('rejects pixelsPerMeter above 30', () => {
		const p = getBlankMap().physics;
		p.pixelsPerMeter = 31;
		expect(validatePhysics(p).valid).toBe(false);
	});

	it('accepts valid body render order', () => {
		const p = getBlankMap().physics;
		p.bodies = [getNewBody(), getNewBody()];
		p.bodyRenderOrder = [1, 0];
		expect(validatePhysics(p).valid).toBe(true);
	});

	it('rejects invalid body render order index', () => {
		const p = getBlankMap().physics;
		p.bodies = [getNewBody()];
		p.bodyRenderOrder = [0, 5];
		const r = validatePhysics(p);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('bodyRenderOrder'))).toBe(true);
	});
});

describe('validateMap', () => {
	it('accepts a blank map', () => {
		const r = validateMap(getBlankMap());
		expect(r.valid).toBe(true);
		expect(r.issues).toHaveLength(0);
	});

	it('accepts a fully populated valid map', () => {
		const r = validateMap(validMap());
		expect(r.valid).toBe(true);
		expect(r.issues).toHaveLength(0);
	});

	it('collects issues from multiple sections', () => {
		const map = validMap();
		map.metadata.author = 'x'.repeat(16);
		map.physics.shapes[0] = { type: 'zz', center: [0, 0] } as unknown as MapShape;
		map.spawns[0].x = 99999;

		const r = validateMap(map);
		expect(r.valid).toBe(false);
		const paths = r.issues.map((i) => i.path);
		expect(paths.some((p) => p.startsWith('metadata'))).toBe(true);
		expect(paths.some((p) => p.startsWith('physics.shapes'))).toBe(true);
		expect(paths.some((p) => p.startsWith('spawns'))).toBe(true);
	});

	it('detects cross-section referential integrity violations', () => {
		const map = validMap();
		// Remove all fixtures, making body fixture references dangle
		map.physics.fixtures = [];
		const r = validateMap(map);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('fixtureIndices'))).toBe(true);
	});

	it('detects dangling shape references from fixtures', () => {
		const map = validMap();
		map.physics.shapes = []; // fixtures reference shapes 0 and 1
		const r = validateMap(map);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('shapeIndex'))).toBe(true);
	});

	it('detects dangling body references from joints', () => {
		const map = validMap();
		map.physics.bodies = []; // joint references body 0
		const r = validateMap(map);
		expect(r.valid).toBe(false);
		expect(r.issues.some((i) => i.path.includes('bodyA') || i.path.includes('bodyB'))).toBe(
			true,
		);
	});

	it('issue objects include constraint metadata', () => {
		const map = validMap();
		map.physics.pixelsPerMeter = 0;
		const r = validateMap(map);
		const ppmIssue = r.issues.find((i) => i.path === 'physics.pixelsPerMeter');
		expect(ppmIssue).toBeDefined();
		expect(ppmIssue!.constraint?.min).toBe(5);
		expect(ppmIssue!.constraint?.max).toBe(30);
		expect(ppmIssue!.value).toBe(0);
	});
});

describe('decodeAndValidate', () => {
	it('decodes and validates a blank map roundtrip', () => {
		const encoded = encodeToDatabase(getBlankMap());
		const { map, validation } = decodeAndValidate(encoded);
		expect(validation.valid).toBe(true);
		expect(map.physics).toBeDefined();
		expect(map.spawns).toBeDefined();
	});

	it('returns both decoded map and validation result', () => {
		const original = validMap();
		const encoded = encodeToDatabase(original);
		const { map, validation } = decodeAndValidate(encoded);
		expect(map.physics.shapes).toHaveLength(2);
		expect(map.physics.bodies).toHaveLength(1);
		expect(validation.valid).toBe(true);
		expect(validation.issues).toHaveLength(0);
	});
});
