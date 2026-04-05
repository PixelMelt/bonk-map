import { describe, it, expect } from 'bun:test';
import { expandMap, compactMap, NAME_MAPS } from '../src/util/nameConverter';

describe('NAME_MAPS', () => {
	it('exports all expected mapping tables', () => {
		const expected = [
			'mapData',
			'mapProperties',
			'mapMetadata',
			'mapPhysics',
			'boxShape',
			'circleShape',
			'polyShape',
			'chainShape',
			'fixture',
			'bodyForce',
			'bodyForceZone',
			'bodySettings',
			'body',
			'jointProperties',
			'joint',
			'spawn',
			'capZone',
		];
		expect(Object.keys(NAME_MAPS)).toEqual(expected);
	});

	it('has no duplicate long names within each mapping', () => {
		for (const [name, mapping] of Object.entries(NAME_MAPS)) {
			const values = Object.values(mapping);
			const unique = new Set(values);
			expect(unique.size).toBe(values.length);
		}
	});
});

describe('expandMap', () => {
	it('expands top-level keys', () => {
		const compact = { v: 1, s: { re: true }, m: { a: 'Alice', n: 'TestMap' } };
		const expanded = expandMap(compact);
		expect(expanded).toHaveProperty('version', 1);
		expect(expanded).toHaveProperty('settings');
		expect(expanded).toHaveProperty('metadata');
	});

	it('expands settings keys', () => {
		const compact = { s: { re: true, nc: false, pq: 2, gd: 16, fl: false } };
		const expanded = expandMap(compact);
		const settings = expanded['settings'] as Record<string, unknown>;
		expect(settings).toEqual({
			respawnOnDeath: true,
			noCollision: false,
			complexPhysics: 2,
			gridSize: 16,
			canFly: false,
		});
	});

	it('expands metadata keys', () => {
		const compact = { m: { a: 'Author', n: 'MapName', dbv: 2, pub: true, mo: 'b' } };
		const expanded = expandMap(compact);
		const metadata = expanded['metadata'] as Record<string, unknown>;
		expect(metadata).toEqual({
			author: 'Author',
			name: 'MapName',
			databaseVersion: 2,
			published: true,
			mode: 'b',
		});
	});

	it('expands physics with nested shapes, fixtures, bodies, and joints', () => {
		const compact = {
			physics: {
				shapes: [
					{ type: 'bx', w: 100, h: 50, c: [0, 0], a: 0, sk: false },
					{ type: 'ci', r: 25, c: [10, 10], sk: false },
				],
				fixtures: [
					{ sh: 0, n: 'fix1', fr: 0.3, re: 0.5, de: 1, f: 0xff0000, d: false, np: false },
				],
				bodies: [
					{
						n: 'body1',
						p: [0, 0],
						a: 0,
						lv: [0, 0],
						av: 0,
						cf: { x: 0, y: 1, w: false, ct: 0 },
						fx: [0],
						fz: { on: true, x: 5, y: 5, d: true, p: false, a: false, t: 1, cf: 0 },
						s: {
							type: 's',
							n: 'body1',
							fric: 0.3,
							fricp: 0,
							re: 0.8,
							de: 1,
							ld: 0,
							ad: 0,
							fr: false,
							bu: false,
							f_c: 1,
							f_p: true,
							f_1: true,
							f_2: false,
							f_3: false,
							f_4: false,
						},
					},
				],
				joints: [
					{
						type: 'rv',
						n: 'joint1',
						ba: 0,
						bb: 1,
						aa: [0, 0],
						ab: [10, 10],
						d: {
							em: true,
							el: false,
							bf: 0,
							la: -90,
							ua: 90,
							mmt: 100,
							ms: 5,
							dr: 0.7,
							fh: 1,
							cc: false,
							dl: true,
						},
					},
				],
				bro: [0],
				ppm: 12,
			},
		};
		const expanded = expandMap(compact);
		const physics = expanded['physics'] as Record<string, unknown>;

		expect(physics).toHaveProperty('pixelsPerMeter', 12);
		expect(physics).toHaveProperty('bodyRenderOrder', [0]);

		// shapes expanded
		const shapes = physics['shapes'] as Record<string, unknown>[];
		expect(shapes[0]).toHaveProperty('width', 100);
		expect(shapes[0]).toHaveProperty('height', 50);
		expect(shapes[0]).toHaveProperty('type', 'bx');
		expect(shapes[1]).toHaveProperty('radius', 25);
		expect(shapes[1]).toHaveProperty('type', 'ci');

		// fixtures expanded
		const fixtures = physics['fixtures'] as Record<string, unknown>[];
		expect(fixtures[0]).toHaveProperty('shapeIndex', 0);
		expect(fixtures[0]).toHaveProperty('friction', 0.3);
		expect(fixtures[0]).toHaveProperty('death', false);

		// bodies expanded with nested objects
		const bodies = physics['bodies'] as Record<string, unknown>[];
		expect(bodies[0]).toHaveProperty('name', 'body1');
		expect(bodies[0]).toHaveProperty('fixtureIndices', [0]);

		const cf = bodies[0]['constantForce'] as Record<string, unknown>;
		expect(cf).toEqual({ x: 0, y: 1, absolute: false, torque: 0 });

		const fz = bodies[0]['forceZone'] as Record<string, unknown>;
		expect(fz).toHaveProperty('enabled', true);
		expect(fz).toHaveProperty('pushPlayers', true);

		const settings = bodies[0]['settings'] as Record<string, unknown>;
		expect(settings).toHaveProperty('friction', 0.3);
		expect(settings).toHaveProperty('restitution', 0.8);
		expect(settings).toHaveProperty('fixedRotation', false);
		expect(settings).toHaveProperty('collisionGroup', 1);

		// joints expanded with nested properties
		const joints = physics['joints'] as Record<string, unknown>[];
		expect(joints[0]).toHaveProperty('name', 'joint1');
		expect(joints[0]).toHaveProperty('bodyA', 0);
		const jp = joints[0]['properties'] as Record<string, unknown>;
		expect(jp).toHaveProperty('enableMotor', true);
		expect(jp).toHaveProperty('motorMaxTorque', 100);
		expect(jp).toHaveProperty('dampingRatio', 0.7);
	});

	it('expands spawns array', () => {
		const compact = {
			spawns: [
				{
					x: 100,
					y: 200,
					xv: 0,
					yv: 0,
					priority: 1,
					r: true,
					f: true,
					b: false,
					gr: false,
					ye: false,
					n: 'spawn1',
				},
			],
		};
		const expanded = expandMap(compact);
		const spawns = expanded['spawns'] as Record<string, unknown>[];
		expect(spawns[0]).toEqual({
			x: 100,
			y: 200,
			velocityX: 0,
			velocityY: 0,
			priority: 1,
			red: true,
			ffa: true,
			blue: false,
			green: false,
			yellow: false,
			name: 'spawn1',
		});
	});

	it('expands capZones array', () => {
		const compact = {
			capZones: [{ n: 'zone1', ty: 1, l: 10, i: 0 }],
		};
		const expanded = expandMap(compact);
		const capZones = expanded['capZones'] as Record<string, unknown>[];
		expect(capZones[0]).toEqual({
			name: 'zone1',
			captureType: 1,
			captureTime: 10,
			fixtureIndex: 0,
		});
	});

	it('preserves keys not present in mapping', () => {
		const compact = { v: 1, unknownKey: 'hello' };
		const expanded = expandMap(compact);
		expect(expanded).toHaveProperty('version', 1);
		expect(expanded).toHaveProperty('unknownKey', 'hello');
	});

	it('handles empty object', () => {
		expect(expandMap({})).toEqual({});
	});

	it('handles missing nested objects and arrays gracefully', () => {
		const compact = { v: 1 };
		expect(() => expandMap(compact)).not.toThrow();
		expect(expandMap(compact)).toEqual({ version: 1 });
	});
});

describe('compactMap', () => {
	it('compacts top-level keys', () => {
		const expanded = {
			version: 1,
			settings: { respawnOnDeath: true },
			metadata: { author: 'Alice' },
		};
		const compacted = compactMap(expanded);
		expect(compacted).toHaveProperty('v', 1);
		expect(compacted).toHaveProperty('s');
		expect(compacted).toHaveProperty('m');
	});

	it('compacts settings keys', () => {
		const expanded = {
			settings: { respawnOnDeath: true, noCollision: false, complexPhysics: 2 },
		};
		const compacted = compactMap(expanded);
		const settings = compacted['s'] as Record<string, unknown>;
		expect(settings).toEqual({ re: true, nc: false, pq: 2 });
	});

	it('compacts metadata keys', () => {
		const expanded = {
			metadata: { author: 'Author', name: 'MapName', databaseVersion: 2 },
		};
		const compacted = compactMap(expanded);
		const metadata = compacted['m'] as Record<string, unknown>;
		expect(metadata).toEqual({ a: 'Author', n: 'MapName', dbv: 2 });
	});

	it('compacts physics with nested structures', () => {
		const expanded = {
			physics: {
				shapes: [
					{ type: 'bx', width: 100, height: 50, center: [0, 0], angle: 0, shrink: false },
				],
				fixtures: [{ shapeIndex: 0, name: 'fix1', friction: 0.3 }],
				bodies: [
					{
						name: 'body1',
						position: [0, 0],
						angle: 0,
						constantForce: { x: 0, y: 1, absolute: false, torque: 0 },
						settings: { type: 's', name: 'body1', friction: 0.3 },
					},
				],
				joints: [
					{
						type: 'rv',
						name: 'joint1',
						bodyA: 0,
						bodyB: 1,
						properties: { enableMotor: true, enableLimit: false },
					},
				],
				pixelsPerMeter: 12,
				bodyRenderOrder: [0],
			},
		};
		const compacted = compactMap(expanded);
		const physics = compacted['physics'] as Record<string, unknown>;

		expect(physics).toHaveProperty('ppm', 12);
		expect(physics).toHaveProperty('bro', [0]);

		const shapes = physics['shapes'] as Record<string, unknown>[];
		expect(shapes[0]).toHaveProperty('w', 100);
		expect(shapes[0]).toHaveProperty('h', 50);

		const fixtures = physics['fixtures'] as Record<string, unknown>[];
		expect(fixtures[0]).toHaveProperty('sh', 0);
		expect(fixtures[0]).toHaveProperty('fr', 0.3);

		const bodies = physics['bodies'] as Record<string, unknown>[];
		expect(bodies[0]).toHaveProperty('n', 'body1');
		const cf = bodies[0]['cf'] as Record<string, unknown>;
		expect(cf).toEqual({ x: 0, y: 1, w: false, ct: 0 });
		const bs = bodies[0]['s'] as Record<string, unknown>;
		expect(bs).toHaveProperty('fric', 0.3);

		const joints = physics['joints'] as Record<string, unknown>[];
		expect(joints[0]).toHaveProperty('n', 'joint1');
		const jp = joints[0]['d'] as Record<string, unknown>;
		expect(jp).toEqual({ em: true, el: false });
	});

	it('compacts spawns array', () => {
		const expanded = {
			spawns: [
				{ x: 100, y: 200, velocityX: 0, velocityY: 0, red: true, ffa: false, name: 'sp1' },
			],
		};
		const compacted = compactMap(expanded);
		const spawns = compacted['spawns'] as Record<string, unknown>[];
		expect(spawns[0]).toEqual({ x: 100, y: 200, xv: 0, yv: 0, r: true, f: false, n: 'sp1' });
	});

	it('compacts capZones array', () => {
		const expanded = {
			capZones: [{ name: 'zone1', captureType: 1, captureTime: 10, fixtureIndex: 0 }],
		};
		const compacted = compactMap(expanded);
		const capZones = compacted['capZones'] as Record<string, unknown>[];
		expect(capZones[0]).toEqual({ n: 'zone1', ty: 1, l: 10, i: 0 });
	});

	it('preserves keys not present in mapping', () => {
		const expanded = { version: 1, customField: 42 };
		const compacted = compactMap(expanded);
		expect(compacted).toHaveProperty('v', 1);
		expect(compacted).toHaveProperty('customField', 42);
	});

	it('handles empty object', () => {
		expect(compactMap({})).toEqual({});
	});
});

describe('expandMap / compactMap roundtrip', () => {
	it('expand -> compact roundtrips to the original', () => {
		const compact = {
			v: 15,
			s: { re: true, nc: false, pq: 1, gd: 16, fl: false },
			m: { a: 'Author', n: 'Map', dbv: 1, pub: true, mo: 'b' },
			physics: {
				shapes: [
					{ type: 'bx', w: 50, h: 30, c: [0, 0], a: 0, sk: false },
					{ type: 'ci', r: 10, c: [5, 5], sk: true },
					{
						type: 'po',
						v: [
							[0, 0],
							[1, 0],
							[0, 1],
						],
						s: 1,
						a: 0,
						c: [0, 0],
					},
				],
				fixtures: [{ sh: 0, n: 'f1', fr: 0.3, re: 0.5, de: 1, f: 0, d: false, np: false }],
				bodies: [
					{
						n: 'b1',
						p: [0, 0],
						a: 0,
						lv: [0, 0],
						av: 0,
						cf: { x: 0, y: 0, w: false, ct: 0 },
						fx: [0],
						fz: { on: false, x: 0, y: 0, d: false, p: false, a: false, t: 0, cf: 0 },
						s: {
							type: 's',
							n: 'b1',
							fric: 0.3,
							fricp: 0,
							re: 0.8,
							de: 1,
							ld: 0,
							ad: 0,
							fr: false,
							bu: false,
							f_c: 1,
							f_p: true,
							f_1: true,
							f_2: false,
							f_3: false,
							f_4: false,
						},
					},
				],
				joints: [
					{
						type: 'rv',
						n: 'j1',
						ba: 0,
						bb: 0,
						aa: [0, 0],
						ab: [0, 0],
						d: {
							em: false,
							el: false,
							bf: 0,
							la: 0,
							ua: 0,
							mmt: 0,
							ms: 0,
							dr: 0,
							fh: 0,
							cc: false,
							dl: false,
						},
					},
				],
				bro: [0],
				ppm: 12,
			},
			spawns: [
				{
					x: 0,
					y: 0,
					xv: 0,
					yv: 0,
					priority: 0,
					r: true,
					f: true,
					b: true,
					gr: true,
					ye: true,
					n: 'sp',
				},
			],
			capZones: [{ n: 'cz', ty: 1, l: 5, i: 0 }],
		};
		const expanded = expandMap(compact);
		const reCompacted = compactMap(expanded);
		expect(reCompacted).toEqual(compact);
	});

	it('compact -> expand roundtrips to the original', () => {
		const expanded = {
			version: 15,
			settings: { respawnOnDeath: true, noCollision: false },
			metadata: { author: 'Test', name: 'TestMap' },
			physics: {
				shapes: [{ type: 'ci', radius: 20, center: [0, 0], shrink: false }],
				fixtures: [{ shapeIndex: 0, name: 'f', friction: 0.5 }],
				bodies: [],
				joints: [],
				bodyRenderOrder: [],
				pixelsPerMeter: 12,
			},
			spawns: [{ x: 10, y: 20, name: 'sp' }],
			capZones: [],
		};
		const compacted = compactMap(expanded);
		const reExpanded = expandMap(compacted);
		expect(reExpanded).toEqual(expanded);
	});
});

describe('shape type dispatch', () => {
	it('expands box shape keys using boxShape mapping', () => {
		const compact = {
			physics: { shapes: [{ type: 'bx', w: 10, h: 20, c: [0, 0], a: 0, sk: false }] },
		};
		const expanded = expandMap(compact);
		const shape = (expanded['physics'] as Record<string, unknown>)['shapes'] as Record<
			string,
			unknown
		>[];
		expect(shape[0]).toHaveProperty('width', 10);
		expect(shape[0]).toHaveProperty('height', 20);
		expect(shape[0]).toHaveProperty('angle', 0);
		expect(shape[0]).toHaveProperty('shrink', false);
	});

	it('expands circle shape keys using circleShape mapping', () => {
		const compact = { physics: { shapes: [{ type: 'ci', r: 15, c: [1, 2], sk: true }] } };
		const expanded = expandMap(compact);
		const shape = (expanded['physics'] as Record<string, unknown>)['shapes'] as Record<
			string,
			unknown
		>[];
		expect(shape[0]).toHaveProperty('radius', 15);
		expect(shape[0]).toHaveProperty('center', [1, 2]);
		expect(shape[0]).toHaveProperty('shrink', true);
	});

	it('expands polygon shape keys using polyShape mapping', () => {
		const compact = {
			physics: {
				shapes: [
					{
						type: 'po',
						v: [
							[0, 0],
							[1, 0],
							[0, 1],
						],
						s: 2,
						a: 45,
						c: [0, 0],
					},
				],
			},
		};
		const expanded = expandMap(compact);
		const shape = (expanded['physics'] as Record<string, unknown>)['shapes'] as Record<
			string,
			unknown
		>[];
		expect(shape[0]).toHaveProperty('vertices');
		expect(shape[0]).toHaveProperty('scale', 2);
		expect(shape[0]).toHaveProperty('angle', 45);
	});

	it('expands chain shape keys using chainShape mapping', () => {
		const compact = {
			physics: {
				shapes: [
					{
						type: 'ch',
						v: [
							[0, 0],
							[10, 0],
						],
						s: 1,
						a: 0,
						c: [0, 0],
						l: true,
						sk: false,
					},
				],
			},
		};
		const expanded = expandMap(compact);
		const shape = (expanded['physics'] as Record<string, unknown>)['shapes'] as Record<
			string,
			unknown
		>[];
		expect(shape[0]).toHaveProperty('vertices');
		expect(shape[0]).toHaveProperty('loop', true);
		expect(shape[0]).toHaveProperty('shrink', false);
	});

	it('preserves keys for unknown shape types', () => {
		const compact = { physics: { shapes: [{ type: 'zz', foo: 'bar' }] } };
		const expanded = expandMap(compact);
		const shape = (expanded['physics'] as Record<string, unknown>)['shapes'] as Record<
			string,
			unknown
		>[];
		expect(shape[0]).toEqual({ type: 'zz', foo: 'bar' });
	});
});
