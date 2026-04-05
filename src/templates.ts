import type {
	MapData,
	MapBoxShape,
	MapCircleShape,
	MapPolyShape,
	MapChainShape,
	MapFixture,
	MapBody,
	MapJoint,
	MapSpawn,
	MapCapZone,
	MapProperties,
	MapMetadata,
	MapPhysics,
} from './types/types';

function getBlankMapProperties(): MapProperties {
	return {
		respawnOnDeath: false,
		noCollision: false,
		complexPhysics: 1,
		gridSize: 25,
		canFly: false,
	};
}

function getBlankMapMetadata(): MapMetadata {
	return {
		author: 'noauthor',
		name: 'noname',
		databaseVersion: 2,
		databaseId: -1,
		authorId: -1,
		date: '',
		originalId: 0,
		originalName: '',
		originalAuthor: '',
		originalDatabaseVersion: 1,
		contributors: [],
		published: false,
		mode: '',
	};
}

function getBlankMapPhysics(): MapPhysics {
	return {
		shapes: [],
		fixtures: [],
		bodies: [],
		bodyRenderOrder: [],
		joints: [],
		pixelsPerMeter: 12,
	};
}

export function getBlankMap(): MapData {
	return {
		version: 1,
		settings: getBlankMapProperties(),
		physics: getBlankMapPhysics(),
		spawns: [],
		capZones: [],
		metadata: getBlankMapMetadata(),
	};
}

export function getNewBody(): MapBody {
	return {
		position: [0, 0],
		angle: 0,
		linearVelocity: [0, 0],
		angularVelocity: 0,
		constantForce: { x: 0, y: 0, absolute: true, torque: 0 },
		fixtureIndices: [],
		forceZone: {
			enabled: false,
			x: 0,
			y: 0,
			pushPlayers: true,
			pushPlatforms: true,
			pushArrows: true,
			forceType: 0,
			centerForce: 0,
		},
		settings: {
			type: 's',
			name: 'Unnamed',
			friction: 0.3,
			frictionPlayers: false,
			restitution: 0.8,
			density: 0.3,
			linearDamping: 0,
			angularDamping: 0,
			fixedRotation: false,
			antiTunneling: false,
			collisionGroup: 1,
			collidePlayers: true,
			collideLayerA: true,
			collideLayerB: true,
			collideLayerC: true,
			collideLayerD: true,
		},
	};
}

export function getNewFixture(shapeID?: number): MapFixture {
	return {
		shapeIndex: shapeID as number,
		name: 'Def Fix',
		friction: 0.3,
		frictionPlayers: null,
		restitution: 0.8,
		density: 0.3,
		color: 0x4f7cac,
		death: false,
		noPhysics: false,
		noGrapple: false,
	};
}

export function getNewBoxShape(): MapBoxShape {
	return { type: 'bx', width: 10, height: 40, center: [0, 0], angle: 0.0, shrink: false };
}

export function getNewCircleShape(): MapCircleShape {
	return { type: 'ci', radius: 25, center: [0, 0], shrink: false };
}

export function getNewPolyShape(): MapPolyShape {
	return { type: 'po', vertices: [], scale: 1, angle: 0, center: [0, 0] };
}

export function getNewChainShape(): MapChainShape {
	return {
		type: 'ch',
		vertices: [],
		scale: 1,
		angle: 0,
		center: [0, 0],
		loop: false,
		shrink: false,
	};
}

export function getNewRevoluteJoint(aID?: number, bID?: number): MapJoint {
	return {
		type: 'rv',
		properties: {
			lowerAngle: 0,
			upperAngle: 0,
			motorMaxTorque: 0,
			motorSpeed: 0,
			enableLimit: false,
			enableMotor: false,
			collideConnected: false,
			breakForce: 0,
			drawLine: true,
		},
		bodyA: aID as number,
		bodyB: bID as number,
		anchorA: [0, 0],
	};
}

export function getNewDistanceJoint(aID?: number, bID?: number): MapJoint {
	return {
		type: 'd',
		properties: {
			softness: 0,
			dampingRatio: 0,
			collideConnected: false,
			breakForce: 0,
			drawLine: true,
		},
		bodyA: aID as number,
		bodyB: bID as number,
		anchorA: [0, 0],
		anchorB: [0, 0],
	};
}

export function getNewLPJJoint(aID?: number, bID?: number): MapJoint {
	return {
		type: 'lpj',
		properties: { collideConnected: false, breakForce: 0, drawLine: true },
		bodyA: aID as number,
		bodyB: bID as number,
		pathStartX: 0,
		pathStartY: 0,
		pathAngle: 0,
		pathForce: 0,
		pathLower: 0,
		pathUpper: 0,
		pathLength: 0,
		pathMaxSpeed: 0,
	};
}

export function getNewLSJJoint(aID?: number, bID?: number): MapJoint {
	return {
		type: 'lsj',
		properties: { collideConnected: false, breakForce: 0, drawLine: true },
		bodyA: aID as number,
		bodyB: bID as number,
		springStartX: 0,
		springStartY: 0,
		springForce: 0,
		springLength: 0,
	};
}

export function getNewGearJoint(): MapJoint {
	return {
		type: 'g',
		name: 'Gear Joint',
		jointA: -1,
		jointB: -1,
		gearRatio: 1,
	};
}

export function getNewCapZone(): MapCapZone {
	return { name: 'Cap Zone', captureType: 1, captureTime: 10, fixtureIndex: -1 };
}

export function getNewSpawn(): MapSpawn {
	return {
		x: 400,
		y: 300,
		velocityX: 0,
		velocityY: 0,
		priority: 5,
		red: true,
		ffa: true,
		blue: true,
		green: false,
		yellow: false,
		name: 'Spawn',
	};
}
