const mapData = {
	v: 'version',
	s: 'settings',
	physics: 'physics',
	spawns: 'spawns',
	capZones: 'capZones',
	m: 'metadata',
} as const;

const mapProperties = {
	re: 'respawnOnDeath',
	nc: 'noCollision',
	pq: 'complexPhysics',
	gd: 'gridSize',
	fl: 'canFly',
	a1: 'legacyFlag1',
	a2: 'legacyFlag2',
	a3: 'legacyFlag3',
} as const;

const mapMetadata = {
	a: 'author',
	n: 'name',
	dbv: 'databaseVersion',
	dbid: 'databaseId',
	authid: 'authorId',
	date: 'date',
	rxid: 'originalId',
	rxn: 'originalName',
	rxa: 'originalAuthor',
	rxdb: 'originalDatabaseVersion',
	cr: 'contributors',
	pub: 'published',
	mo: 'mode',
	vu: 'votesUp',
	vd: 'votesDown',
} as const;

const mapPhysics = {
	shapes: 'shapes',
	fixtures: 'fixtures',
	bodies: 'bodies',
	bro: 'bodyRenderOrder',
	joints: 'joints',
	ppm: 'pixelsPerMeter',
} as const;

const boxShape = {
	type: 'type',
	w: 'width',
	h: 'height',
	c: 'center',
	a: 'angle',
	sk: 'shrink',
} as const;

const circleShape = {
	type: 'type',
	r: 'radius',
	c: 'center',
	sk: 'shrink',
} as const;

const polyShape = {
	type: 'type',
	v: 'vertices',
	s: 'scale',
	a: 'angle',
	c: 'center',
} as const;

const chainShape = {
	type: 'type',
	v: 'vertices',
	s: 'scale',
	a: 'angle',
	c: 'center',
	l: 'loop',
	sk: 'shrink',
} as const;

const fixture = {
	sh: 'shapeIndex',
	n: 'name',
	fr: 'friction',
	fp: 'frictionPlayers',
	re: 'restitution',
	de: 'density',
	f: 'color',
	d: 'death',
	np: 'noPhysics',
	ng: 'noGrapple',
	sn: 'snap',
	fs: 'fixtureString',
	zp: 'zPosition',
	ig: 'innerGrapple',
} as const;

const bodyForce = {
	x: 'x',
	y: 'y',
	w: 'absolute',
	ct: 'torque',
} as const;

const bodyForceZone = {
	on: 'enabled',
	x: 'x',
	y: 'y',
	d: 'pushPlayers',
	p: 'pushPlatforms',
	a: 'pushArrows',
	t: 'forceType',
	cf: 'centerForce',
} as const;

const bodySettings = {
	type: 'type',
	n: 'name',
	fric: 'friction',
	fricp: 'frictionPlayers',
	re: 'restitution',
	de: 'density',
	ld: 'linearDamping',
	ad: 'angularDamping',
	fr: 'fixedRotation',
	bu: 'antiTunneling',
	f_c: 'collisionGroup',
	f_p: 'collidePlayers',
	f_1: 'collideLayerA',
	f_2: 'collideLayerB',
	f_3: 'collideLayerC',
	f_4: 'collideLayerD',
} as const;

const body = {
	n: 'name',
	p: 'position',
	a: 'angle',
	lv: 'linearVelocity',
	av: 'angularVelocity',
	cf: 'constantForce',
	fx: 'fixtureIndices',
	fz: 'forceZone',
	s: 'settings',
} as const;

const jointProperties = {
	em: 'enableMotor',
	el: 'enableLimit',
	bf: 'breakForce',
	la: 'lowerAngle',
	ua: 'upperAngle',
	mmt: 'motorMaxTorque',
	ms: 'motorSpeed',
	dr: 'dampingRatio',
	fh: 'softness',
	cc: 'collideConnected',
	dl: 'drawLine',
	lt: 'lowerTranslation',
	ut: 'upperTranslation',
	mmf: 'maxMotorForce',
	cd: 'changeDirection',
} as const;

const joint = {
	type: 'type',
	n: 'name',
	ba: 'bodyA',
	bb: 'bodyB',
	aa: 'anchorA',
	ab: 'anchorB',
	d: 'properties',
	pa: 'pathAngle',
	pax: 'pathStartX',
	pay: 'pathStartY',
	sax: 'springStartX',
	say: 'springStartY',
	pf: 'pathForce',
	pl: 'pathLower',
	plen: 'pathLength',
	pms: 'pathMaxSpeed',
	pu: 'pathUpper',
	sf: 'springForce',
	slen: 'springLength',
	ja: 'jointA',
	jb: 'jointB',
	r: 'gearRatio',
	axa: 'axisA',
} as const;

const spawn = {
	x: 'x',
	y: 'y',
	xv: 'velocityX',
	yv: 'velocityY',
	priority: 'priority',
	r: 'red',
	f: 'ffa',
	b: 'blue',
	gr: 'green',
	ye: 'yellow',
	n: 'name',
} as const;

const capZone = {
	n: 'name',
	ty: 'captureType',
	l: 'captureTime',
	i: 'fixtureIndex',
} as const;

export const NAME_MAPS = {
	mapData,
	mapProperties,
	mapMetadata,
	mapPhysics,
	boxShape,
	circleShape,
	polyShape,
	chainShape,
	fixture,
	bodyForce,
	bodyForceZone,
	bodySettings,
	body,
	jointProperties,
	joint,
	spawn,
	capZone,
} as const;

type Mapping = Readonly<Record<string, string>>;
type MappingSource = Mapping | ((obj: Record<string, unknown>) => Mapping);

type TransformNode = {
	expand: MappingSource;
	compact: MappingSource;
	objects?: Record<string, TransformNode>;
	arrays?: Record<string, TransformNode>;
};

function invertMapping(map: Mapping): Mapping {
	const inverted: Record<string, string> = {};
	for (const key in map) {
		inverted[map[key]] = key;
	}
	return inverted;
}

function dual(fwd: Mapping): Pick<TransformNode, 'expand' | 'compact'> {
	return { expand: fwd, compact: invertMapping(fwd) };
}

function renameKeys(obj: Record<string, unknown>, mapping: Mapping): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const key in obj) {
		result[mapping[key] ?? key] = obj[key];
	}
	return result;
}

const SHAPE_EXPAND: Record<string, Mapping> = {
	bx: boxShape,
	ci: circleShape,
	po: polyShape,
	ch: chainShape,
};

const SHAPE_COMPACT: Record<string, Mapping> = {
	bx: invertMapping(boxShape),
	ci: invertMapping(circleShape),
	po: invertMapping(polyShape),
	ch: invertMapping(chainShape),
};

const schema: TransformNode = {
	...dual(mapData),
	objects: {
		settings: { ...dual(mapProperties) },
		metadata: { ...dual(mapMetadata) },
		physics: {
			...dual(mapPhysics),
			arrays: {
				shapes: {
					expand: (obj) => SHAPE_EXPAND[obj['type'] as string] ?? {},
					compact: (obj) => SHAPE_COMPACT[obj['type'] as string] ?? {},
				},
				fixtures: { ...dual(fixture) },
				bodies: {
					...dual(body),
					objects: {
						constantForce: { ...dual(bodyForce) },
						forceZone: { ...dual(bodyForceZone) },
						settings: { ...dual(bodySettings) },
					},
				},
				joints: {
					...dual(joint),
					objects: {
						properties: { ...dual(jointProperties) },
					},
				},
			},
		},
	},
	arrays: {
		spawns: { ...dual(spawn) },
		capZones: { ...dual(capZone) },
	},
};

function transform(
	obj: Record<string, unknown>,
	node: TransformNode,
	dir: 'expand' | 'compact',
): Record<string, unknown> {
	const source = node[dir];
	const mapping = typeof source === 'function' ? source(obj) : source;
	const result = renameKeys(obj, mapping);

	if (node.objects) {
		for (const [longName, child] of Object.entries(node.objects)) {
			const k = dir === 'expand' ? longName : (mapping[longName] ?? longName);
			if (result[k] && typeof result[k] === 'object') {
				result[k] = transform(result[k] as Record<string, unknown>, child, dir);
			}
		}
	}
	if (node.arrays) {
		for (const [longName, child] of Object.entries(node.arrays)) {
			const k = dir === 'expand' ? longName : (mapping[longName] ?? longName);
			if (Array.isArray(result[k])) {
				result[k] = (result[k] as Record<string, unknown>[]).map((item) =>
					transform(item, child, dir),
				);
			}
		}
	}
	return result;
}

export function expandMap(map: Record<string, unknown>): Record<string, unknown> {
	return transform(map, schema, 'expand');
}

export function compactMap(map: Record<string, unknown>): Record<string, unknown> {
	return transform(map, schema, 'compact');
}
