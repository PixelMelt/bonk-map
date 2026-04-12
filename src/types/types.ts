export interface MapBoxShape {
	type: 'bx';
	width: number;
	height: number;
	center: [number, number];
	angle: number;
	shrink: boolean;
}

export interface MapCircleShape {
	type: 'ci';
	radius: number;
	center: [number, number];
	shrink: boolean;
}

export interface MapPolyShape {
	type: 'po';
	vertices: [number, number][];
	scale: number;
	angle: number;
	center: [number, number];
}

export interface MapChainShape {
	type: 'ch';
	vertices: [number, number][];
	scale: number;
	angle: number;
	center: [number, number];
	loop: boolean;
	shrink: boolean;
}

export type MapShape = MapBoxShape | MapCircleShape | MapPolyShape | MapChainShape;

export interface MapFixture {
	shapeIndex: number;
	name: string;
	friction: number | null;
	frictionPlayers: boolean | null;
	restitution: number | null;
	density: number | null;
	color: number;
	death: boolean;
	noPhysics: boolean;
	noGrapple: boolean;
	snap?: boolean;
	fixtureString?: string;
	zPosition?: number;
	innerGrapple?: boolean;
}

export interface MapBodyForce {
	x: number;
	y: number;
	absolute: boolean;
	torque: number;
}

export interface MapBodyForceZone {
	enabled: boolean;
	x: number;
	y: number;
	pushPlayers: boolean;
	pushPlatforms: boolean;
	pushArrows: boolean;
	forceType: number;
	centerForce: number;
}

export interface MapBodySettings {
	type: string;
	name: string;
	friction: number;
	frictionPlayers: boolean;
	restitution: number;
	density: number;
	linearDamping: number;
	angularDamping: number;
	fixedRotation: boolean;
	antiTunneling: boolean;
	collisionGroup: number;
	collidePlayers: boolean;
	collideLayerA: boolean;
	collideLayerB: boolean;
	collideLayerC: boolean;
	collideLayerD: boolean;
}

export interface MapBody {
	name?: string;
	position: [number, number];
	angle: number;
	linearVelocity: [number, number];
	angularVelocity: number;
	constantForce: MapBodyForce;
	fixtureIndices: number[];
	forceZone: MapBodyForceZone;
	settings: MapBodySettings;
}

export interface MapJointProperties {
	enableMotor?: boolean;
	enableLimit?: boolean;
	breakForce?: number;
	lowerAngle?: number;
	upperAngle?: number;
	motorMaxTorque?: number;
	motorSpeed?: number;
	dampingRatio?: number;
	softness?: number;
	collideConnected: boolean;
	drawLine?: boolean;
	lowerTranslation?: number;
	upperTranslation?: number;
	maxMotorForce?: number;
	changeDirection?: boolean;
}

export interface MapJoint {
	type: string;
	name?: string;
	bodyA?: number;
	bodyB?: number;
	anchorA?: [number, number];
	anchorB?: [number, number];
	properties?: MapJointProperties;
	pathAngle?: number;
	pathStartX?: number;
	pathStartY?: number;
	springStartX?: number;
	springStartY?: number;
	pathForce?: number;
	pathLower?: number;
	pathLength?: number;
	pathMaxSpeed?: number;
	pathUpper?: number;
	springForce?: number;
	springLength?: number;
	jointA?: number;
	jointB?: number;
	gearRatio?: number;
	axisA?: [number, number];
}

export interface MapSpawn {
	x: number;
	y: number;
	velocityX: number;
	velocityY: number;
	priority: number;
	red: boolean;
	ffa: boolean;
	blue: boolean;
	green: boolean;
	yellow: boolean;
	name: string;
}

export interface MapCapZone {
	name: string;
	captureType: number;
	captureTime: number;
	fixtureIndex: number;
}

export interface MapProperties {
	respawnOnDeath: boolean;
	noCollision: boolean;
	complexPhysics: number;
	gridSize: number;
	canFly: boolean;
	legacyFlag1?: boolean;
	legacyFlag2?: boolean;
	legacyFlag3?: boolean;
}

export interface MapMetadata {
	author: string;
	name: string;
	databaseVersion: number;
	databaseId: number;
	authorId: number;
	date: string;
	originalId: number;
	originalName: string;
	originalAuthor: string;
	originalDatabaseVersion: number;
	contributors: string[];
	published: boolean;
	mode: string;
	votesUp?: number;
	votesDown?: number;
}

export interface MapPhysics {
	shapes: MapShape[];
	fixtures: MapFixture[];
	bodies: MapBody[];
	bodyRenderOrder: number[];
	joints: MapJoint[];
	pixelsPerMeter: number;
}

export interface MapData {
	version: number;
	settings: MapProperties;
	physics: MapPhysics;
	spawns: MapSpawn[];
	capZones: MapCapZone[];
	metadata: MapMetadata;
}

export interface MapBoxShapeCompact {
	type: 'bx';
	w: number;
	h: number;
	c: [number, number];
	a: number;
	sk: boolean;
}

export interface MapCircleShapeCompact {
	type: 'ci';
	r: number;
	c: [number, number];
	sk: boolean;
}

export interface MapPolyShapeCompact {
	type: 'po';
	v: [number, number][];
	s: number;
	a: number;
	c: [number, number];
}

export interface MapChainShapeCompact {
	type: 'ch';
	v: [number, number][];
	s: number;
	a: number;
	c: [number, number];
	l: boolean;
	sk: boolean;
}

export type MapShapeCompact =
	| MapBoxShapeCompact
	| MapCircleShapeCompact
	| MapPolyShapeCompact
	| MapChainShapeCompact;

export interface MapFixtureCompact {
	sh: number;
	n: string;
	fr: number | null;
	fp: boolean | null;
	re: number | null;
	de: number | null;
	f: number;
	d: boolean;
	np: boolean;
	ng: boolean;
	ig?: boolean;
}

export interface MapBodyForceCompact {
	x: number;
	y: number;
	w: boolean;
	ct: number;
}

export interface MapBodyForceZoneCompact {
	on: boolean;
	x: number;
	y: number;
	d: boolean;
	p: boolean;
	a: boolean;
	t: number;
	cf: number;
}

export interface MapBodySettingsCompact {
	type: string;
	n: string;
	fric: number;
	fricp: boolean;
	re: number;
	de: number;
	ld: number;
	ad: number;
	fr: boolean;
	bu: boolean;
	f_c: number;
	f_p: boolean;
	f_1: boolean;
	f_2: boolean;
	f_3: boolean;
	f_4: boolean;
}

export interface MapBodyCompact {
	p: [number, number];
	a: number;
	lv: [number, number];
	av: number;
	cf: MapBodyForceCompact;
	fx: number[];
	fz: MapBodyForceZoneCompact;
	s: MapBodySettingsCompact;
}

export interface MapJointPropertiesCompact {
	em?: boolean;
	el?: boolean;
	bf?: number;
	la?: number;
	ua?: number;
	mmt?: number;
	ms?: number;
	dr?: number;
	fh?: number;
	cc: boolean;
	dl?: boolean;
	lt?: number;
	ut?: number;
	mmf?: number;
	cd?: boolean;
}

export interface MapJointCompact {
	type: string;
	n?: string;
	ba?: number;
	bb?: number;
	aa?: [number, number];
	ab?: [number, number];
	d?: MapJointPropertiesCompact;
	pa?: number;
	pax?: number;
	pay?: number;
	sax?: number;
	say?: number;
	pf?: number;
	pl?: number;
	plen?: number;
	pms?: number;
	pu?: number;
	sf?: number;
	slen?: number;
	ja?: number;
	jb?: number;
	r?: number;
	axa?: [number, number];
}

export interface MapSpawnCompact {
	x: number;
	y: number;
	xv: number;
	yv: number;
	priority: number;
	r: boolean;
	f: boolean;
	b: boolean;
	gr: boolean;
	ye: boolean;
	n: string;
}

export interface MapCapZoneCompact {
	n: string;
	ty: number;
	l: number;
	i: number;
}

export interface MapPropertiesCompact {
	re: boolean;
	nc: boolean;
	pq: number;
	gd: number;
	fl: boolean;
}

export interface MapMetadataCompact {
	a: string;
	n: string;
	dbv: number;
	dbid: number;
	authid: number;
	date: string;
	rxid: number;
	rxn: string;
	rxa: string;
	rxdb: number;
	cr: string[];
	pub: boolean;
	mo: string;
	vu?: number;
	vd?: number;
}

export interface MapPhysicsCompact {
	shapes: MapShapeCompact[];
	fixtures: MapFixtureCompact[];
	bodies: MapBodyCompact[];
	bro: number[];
	joints: MapJointCompact[];
	ppm: number;
}

export interface MapDataCompact {
	v: number;
	s: MapPropertiesCompact;
	physics: MapPhysicsCompact;
	spawns: MapSpawnCompact[];
	capZones: MapCapZoneCompact[];
	m: MapMetadataCompact;
}

export interface ValidationIssue {
	path: string;
	message: string;
	value?: unknown;
	constraint?: {
		min?: number;
		max?: number;
		maxLength?: number;
		oneOf?: unknown[];
	};
}

export interface ValidationResult {
	valid: boolean;
	issues: ValidationIssue[];
}
