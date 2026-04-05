import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { byteBuffer } from './util/byteBuffer';
import type { MapData, MapJoint } from './types/types';
import {
	getBlankMap,
	getNewBody,
	getNewFixture,
	getNewBoxShape,
	getNewCircleShape,
	getNewPolyShape,
	getNewRevoluteJoint,
	getNewDistanceJoint,
	getNewLPJJoint,
	getNewLSJJoint,
	getNewGearJoint,
	getNewCapZone,
	getNewSpawn,
} from './templates';

// Current map format version supported by this codec
const MAP_VERSION = 15;

export function encodeToDatabase(map: MapData): string {
	const buf = new byteBuffer();

	buf.writeShort(MAP_VERSION);
	buf.writeBoolean(map.settings.respawnOnDeath);
	buf.writeBoolean(map.settings.noCollision);
	buf.writeShort(map.settings.complexPhysics);
	buf.writeFloat(map.settings.gridSize);
	buf.writeBoolean(map.settings.canFly);

	// Metadata
	buf.writeUTF(map.metadata.originalName);
	buf.writeUTF(map.metadata.originalAuthor);
	buf.writeUint(map.metadata.originalId);
	buf.writeShort(map.metadata.originalDatabaseVersion);
	buf.writeUTF(map.metadata.name);
	buf.writeUTF(map.metadata.author);
	buf.writeUint(map.metadata.votesUp ?? 0);
	buf.writeUint(map.metadata.votesDown ?? 0);
	buf.writeShort(map.metadata.contributors.length);
	for (let i = 0; i < map.metadata.contributors.length; i++) {
		buf.writeUTF(map.metadata.contributors[i]);
	}
	buf.writeUTF(map.metadata.mode);
	buf.writeInt(map.metadata.databaseId);
	buf.writeBoolean(map.metadata.published);
	buf.writeInt(map.metadata.databaseVersion);

	// Physics
	buf.writeShort(map.physics.pixelsPerMeter);

	// Body render order
	buf.writeShort(map.physics.bodyRenderOrder.length);
	for (let i = 0; i < map.physics.bodyRenderOrder.length; i++) {
		buf.writeShort(map.physics.bodyRenderOrder[i]);
	}

	// Shapes
	buf.writeShort(map.physics.shapes.length);
	for (let i = 0; i < map.physics.shapes.length; i++) {
		const shape = map.physics.shapes[i];
		if (shape.type === 'bx') {
			buf.writeShort(1);
			buf.writeDouble(shape.width);
			buf.writeDouble(shape.height);
			buf.writeDouble(shape.center[0]);
			buf.writeDouble(shape.center[1]);
			buf.writeDouble(shape.angle);
			buf.writeBoolean(shape.shrink);
		}
		if (shape.type === 'ci') {
			buf.writeShort(2);
			buf.writeDouble(shape.radius);
			buf.writeDouble(shape.center[0]);
			buf.writeDouble(shape.center[1]);
			buf.writeBoolean(shape.shrink);
		}
		if (shape.type === 'po') {
			buf.writeShort(3);
			buf.writeDouble(shape.scale);
			buf.writeDouble(shape.angle);
			buf.writeDouble(shape.center[0]);
			buf.writeDouble(shape.center[1]);
			buf.writeShort(shape.vertices.length);
			for (let vi = 0; vi < shape.vertices.length; vi++) {
				buf.writeDouble(shape.vertices[vi][0]);
				buf.writeDouble(shape.vertices[vi][1]);
			}
		}
		// Note: chain shapes ('ch') are not written in the official encoder
	}

	// Fixtures
	buf.writeShort(map.physics.fixtures.length);
	for (let i = 0; i < map.physics.fixtures.length; i++) {
		const fixture = map.physics.fixtures[i];
		buf.writeShort(fixture.shapeIndex);
		buf.writeUTF(fixture.name);

		if (fixture.friction === null) {
			buf.writeDouble(Number.MAX_VALUE);
		} else {
			buf.writeDouble(fixture.friction);
		}

		if (fixture.frictionPlayers === null) {
			buf.writeShort(0);
		} else if (fixture.frictionPlayers === false) {
			buf.writeShort(1);
		} else {
			buf.writeShort(2);
		}

		if (fixture.restitution === null) {
			buf.writeDouble(Number.MAX_VALUE);
		} else {
			buf.writeDouble(fixture.restitution);
		}

		if (fixture.density === null) {
			buf.writeDouble(Number.MAX_VALUE);
		} else {
			buf.writeDouble(fixture.density);
		}

		buf.writeUint(fixture.color);
		buf.writeBoolean(fixture.death);
		buf.writeBoolean(fixture.noPhysics);
		buf.writeBoolean(fixture.noGrapple);
		buf.writeBoolean(fixture.innerGrapple ?? false);
	}

	// Bodies
	buf.writeShort(map.physics.bodies.length);
	for (let i = 0; i < map.physics.bodies.length; i++) {
		const body = map.physics.bodies[i];
		buf.writeUTF(body.settings.type);
		buf.writeUTF(body.settings.name);
		buf.writeDouble(body.position[0]);
		buf.writeDouble(body.position[1]);
		buf.writeDouble(body.angle);
		buf.writeDouble(body.settings.friction);
		buf.writeBoolean(body.settings.frictionPlayers);
		buf.writeDouble(body.settings.restitution);
		buf.writeDouble(body.settings.density);
		buf.writeDouble(body.linearVelocity[0]);
		buf.writeDouble(body.linearVelocity[1]);
		buf.writeDouble(body.angularVelocity);
		buf.writeDouble(body.settings.linearDamping);
		buf.writeDouble(body.settings.angularDamping);
		buf.writeBoolean(body.settings.fixedRotation);
		buf.writeBoolean(body.settings.antiTunneling);
		buf.writeDouble(body.constantForce.x);
		buf.writeDouble(body.constantForce.y);
		buf.writeDouble(body.constantForce.torque);
		buf.writeBoolean(body.constantForce.absolute);
		buf.writeShort(body.settings.collisionGroup);
		buf.writeBoolean(body.settings.collideLayerA);
		buf.writeBoolean(body.settings.collideLayerB);
		buf.writeBoolean(body.settings.collideLayerC);
		buf.writeBoolean(body.settings.collideLayerD);
		buf.writeBoolean(body.settings.collidePlayers);

		// Force zone (v14+)
		buf.writeBoolean(body.forceZone.enabled);
		if (body.forceZone.enabled) {
			buf.writeDouble(body.forceZone.x);
			buf.writeDouble(body.forceZone.y);
			buf.writeBoolean(body.forceZone.pushPlayers);
			buf.writeBoolean(body.forceZone.pushPlatforms);
			buf.writeBoolean(body.forceZone.pushArrows);
			// v15+ fields
			buf.writeShort(body.forceZone.forceType);
			buf.writeDouble(body.forceZone.centerForce);
		}

		// Fixture indices
		buf.writeShort(body.fixtureIndices.length);
		for (let fi = 0; fi < body.fixtureIndices.length; fi++) {
			buf.writeShort(body.fixtureIndices[fi]);
		}
	}

	// Spawns
	buf.writeShort(map.spawns.length);
	for (let i = 0; i < map.spawns.length; i++) {
		const spawn = map.spawns[i];
		buf.writeDouble(spawn.x);
		buf.writeDouble(spawn.y);
		buf.writeDouble(spawn.velocityX);
		buf.writeDouble(spawn.velocityY);
		buf.writeShort(spawn.priority);
		buf.writeBoolean(spawn.red);
		buf.writeBoolean(spawn.ffa);
		buf.writeBoolean(spawn.blue);
		buf.writeBoolean(spawn.green);
		buf.writeBoolean(spawn.yellow);
		buf.writeUTF(spawn.name);
	}

	// Cap zones
	buf.writeShort(map.capZones.length);
	for (let i = 0; i < map.capZones.length; i++) {
		const capZone = map.capZones[i];
		buf.writeUTF(capZone.name);
		buf.writeDouble(capZone.captureTime);
		buf.writeShort(capZone.fixtureIndex);
		buf.writeShort(capZone.captureType);
	}

	// Joints
	buf.writeShort(map.physics.joints.length);
	for (let i = 0; i < map.physics.joints.length; i++) {
		const joint = map.physics.joints[i];
		if (joint.type === 'rv') {
			buf.writeShort(1);
			buf.writeDouble(joint.properties!.lowerAngle!);
			buf.writeDouble(joint.properties!.upperAngle!);
			buf.writeDouble(joint.properties!.motorMaxTorque!);
			buf.writeDouble(joint.properties!.motorSpeed!);
			buf.writeBoolean(joint.properties!.enableLimit!);
			buf.writeBoolean(joint.properties!.enableMotor!);
			buf.writeDouble(joint.anchorA![0]);
			buf.writeDouble(joint.anchorA![1]);
		}
		if (joint.type === 'd') {
			buf.writeShort(2);
			buf.writeDouble(joint.properties!.softness!);
			buf.writeDouble(joint.properties!.dampingRatio!);
			buf.writeDouble(joint.anchorA![0]);
			buf.writeDouble(joint.anchorA![1]);
			buf.writeDouble(joint.anchorB![0]);
			buf.writeDouble(joint.anchorB![1]);
		}
		if (joint.type === 'lpj') {
			buf.writeShort(3);
			buf.writeDouble(joint.pathStartX!);
			buf.writeDouble(joint.pathStartY!);
			buf.writeDouble(joint.pathAngle!);
			buf.writeDouble(joint.pathForce!);
			buf.writeDouble(joint.pathLower!);
			buf.writeDouble(joint.pathUpper!);
			buf.writeDouble(joint.pathLength!);
			buf.writeDouble(joint.pathMaxSpeed!);
		}
		if (joint.type === 'lsj') {
			buf.writeShort(4);
			buf.writeDouble(joint.springStartX!);
			buf.writeDouble(joint.springStartY!);
			buf.writeDouble(joint.springForce!);
			buf.writeDouble(joint.springLength!);
		}
		if (joint.type === 'g') {
			buf.writeShort(5);
			buf.writeUTF(joint.name!);
			buf.writeShort(joint.jointA!);
			buf.writeShort(joint.jointB!);
			buf.writeDouble(joint.gearRatio!);
		} else {
			// All non-gear joints share these trailing fields
			buf.writeShort(joint.bodyA!);
			buf.writeShort(joint.bodyB!);
			buf.writeBoolean(joint.properties!.collideConnected);
			buf.writeDouble(joint.properties!.breakForce!);
			buf.writeBoolean(joint.properties!.drawLine!);
		}
	}

	const base64 = buf.toBase64();
	return compressToEncodedURIComponent(base64);
}

export function decodeFromDatabase(encodedString: string): MapData {
	const base64 = decompressFromEncodedURIComponent(encodedString);
	if (!base64) {
		throw new Error('Failed to decompress map data');
	}
	const buf = new byteBuffer();
	buf.fromBase64(base64);

	const map = getBlankMap();
	map.version = buf.readShort();

	if (map.version > MAP_VERSION) {
		throw new Error(`Future map version ${map.version}, max supported is ${MAP_VERSION}`);
	}

	// Settings
	map.settings.respawnOnDeath = buf.readBoolean();
	map.settings.noCollision = buf.readBoolean();
	if (map.version >= 3) {
		map.settings.complexPhysics = buf.readShort();
	}
	if (map.version >= 4 && map.version <= 12) {
		map.settings.gridSize = buf.readShort();
	} else if (map.version >= 13) {
		map.settings.gridSize = buf.readFloat();
	}
	if (map.version >= 9) {
		map.settings.canFly = buf.readBoolean();
	}

	// Metadata
	map.metadata.originalName = buf.readUTF();
	map.metadata.originalAuthor = buf.readUTF();
	map.metadata.originalId = buf.readUint();
	map.metadata.originalDatabaseVersion = buf.readShort();
	map.metadata.name = buf.readUTF();
	map.metadata.author = buf.readUTF();

	if (map.version >= 10) {
		map.metadata.votesUp = buf.readUint();
		map.metadata.votesDown = buf.readUint();
	}
	if (map.version >= 4) {
		const crCount = buf.readShort();
		for (let i = 0; i < crCount; i++) {
			map.metadata.contributors.push(buf.readUTF());
		}
	}
	if (map.version >= 5) {
		map.metadata.mode = buf.readUTF();
		map.metadata.databaseId = buf.readInt();
	}
	if (map.version >= 7) {
		map.metadata.published = buf.readBoolean();
	}
	if (map.version >= 8) {
		map.metadata.databaseVersion = buf.readInt();
	}

	// Physics
	map.physics.pixelsPerMeter = buf.readShort();

	// Body render order
	const broCount = buf.readShort();
	for (let i = 0; i < broCount; i++) {
		map.physics.bodyRenderOrder[i] = buf.readShort();
	}

	// Shapes
	const shapesCount = buf.readShort();
	for (let i = 0; i < shapesCount; i++) {
		const shapeType = buf.readShort();
		if (shapeType === 1) {
			const shape = getNewBoxShape();
			shape.width = buf.readDouble();
			shape.height = buf.readDouble();
			shape.center = [buf.readDouble(), buf.readDouble()];
			shape.angle = buf.readDouble();
			shape.shrink = buf.readBoolean();
			map.physics.shapes[i] = shape;
		}
		if (shapeType === 2) {
			const shape = getNewCircleShape();
			shape.radius = buf.readDouble();
			shape.center = [buf.readDouble(), buf.readDouble()];
			shape.shrink = buf.readBoolean();
			map.physics.shapes[i] = shape;
		}
		if (shapeType === 3) {
			const shape = getNewPolyShape();
			shape.scale = buf.readDouble();
			shape.angle = buf.readDouble();
			shape.center = [buf.readDouble(), buf.readDouble()];
			shape.vertices = [];
			const verticesCount = buf.readShort();
			for (let vi = 0; vi < verticesCount; vi++) {
				shape.vertices.push([buf.readDouble(), buf.readDouble()]);
			}
			map.physics.shapes[i] = shape;
		}
	}

	// Fixtures
	const fixturesCount = buf.readShort();
	for (let i = 0; i < fixturesCount; i++) {
		const fixture = getNewFixture();
		fixture.shapeIndex = buf.readShort();
		fixture.name = buf.readUTF();

		fixture.friction = buf.readDouble();
		if (fixture.friction === Number.MAX_VALUE) {
			fixture.friction = null;
		}

		const fricPlayers = buf.readShort();
		if (fricPlayers === 0) {
			fixture.frictionPlayers = null;
		} else if (fricPlayers === 1) {
			fixture.frictionPlayers = false;
		} else {
			fixture.frictionPlayers = true;
		}

		fixture.restitution = buf.readDouble();
		if (fixture.restitution === Number.MAX_VALUE) {
			fixture.restitution = null;
		}

		fixture.density = buf.readDouble();
		if (fixture.density === Number.MAX_VALUE) {
			fixture.density = null;
		}

		fixture.color = buf.readUint();
		fixture.death = buf.readBoolean();
		fixture.noPhysics = buf.readBoolean();

		if (map.version >= 11) {
			fixture.noGrapple = buf.readBoolean();
		}
		if (map.version >= 12) {
			fixture.innerGrapple = buf.readBoolean();
		}

		map.physics.fixtures[i] = fixture;
	}

	// Bodies
	const bodiesCount = buf.readShort();
	for (let i = 0; i < bodiesCount; i++) {
		const body = getNewBody();
		body.settings.type = buf.readUTF();
		body.settings.name = buf.readUTF();
		body.position = [buf.readDouble(), buf.readDouble()];
		body.angle = buf.readDouble();
		body.settings.friction = buf.readDouble();
		body.settings.frictionPlayers = buf.readBoolean();
		body.settings.restitution = buf.readDouble();
		body.settings.density = buf.readDouble();
		body.linearVelocity = [buf.readDouble(), buf.readDouble()];
		body.angularVelocity = buf.readDouble();
		body.settings.linearDamping = buf.readDouble();
		body.settings.angularDamping = buf.readDouble();
		body.settings.fixedRotation = buf.readBoolean();
		body.settings.antiTunneling = buf.readBoolean();
		body.constantForce.x = buf.readDouble();
		body.constantForce.y = buf.readDouble();
		body.constantForce.torque = buf.readDouble();
		body.constantForce.absolute = buf.readBoolean();
		body.settings.collisionGroup = buf.readShort();
		body.settings.collideLayerA = buf.readBoolean();
		body.settings.collideLayerB = buf.readBoolean();
		body.settings.collideLayerC = buf.readBoolean();
		body.settings.collideLayerD = buf.readBoolean();

		if (map.version >= 2) {
			body.settings.collidePlayers = buf.readBoolean();
		}
		if (map.version >= 14) {
			body.forceZone.enabled = buf.readBoolean();
			if (body.forceZone.enabled) {
				body.forceZone.x = buf.readDouble();
				body.forceZone.y = buf.readDouble();
				body.forceZone.pushPlayers = buf.readBoolean();
				body.forceZone.pushPlatforms = buf.readBoolean();
				body.forceZone.pushArrows = buf.readBoolean();
				if (map.version >= 15) {
					body.forceZone.forceType = buf.readShort();
					body.forceZone.centerForce = buf.readDouble();
				}
			}
		}

		const fxCount = buf.readShort();
		body.fixtureIndices = [];
		for (let fi = 0; fi < fxCount; fi++) {
			body.fixtureIndices.push(buf.readShort());
		}

		map.physics.bodies[i] = body;
	}

	// Spawns
	const spawnsCount = buf.readShort();
	for (let i = 0; i < spawnsCount; i++) {
		const spawn = getNewSpawn();
		spawn.x = buf.readDouble();
		spawn.y = buf.readDouble();
		spawn.velocityX = buf.readDouble();
		spawn.velocityY = buf.readDouble();
		spawn.priority = buf.readShort();
		spawn.red = buf.readBoolean();
		spawn.ffa = buf.readBoolean();
		spawn.blue = buf.readBoolean();
		spawn.green = buf.readBoolean();
		spawn.yellow = buf.readBoolean();
		spawn.name = buf.readUTF();
		map.spawns[i] = spawn;
	}

	// Cap zones
	const capZonesCount = buf.readShort();
	for (let i = 0; i < capZonesCount; i++) {
		const capZone = getNewCapZone();
		capZone.name = buf.readUTF();
		capZone.captureTime = buf.readDouble();
		capZone.fixtureIndex = buf.readShort();
		if (map.version >= 6) {
			capZone.captureType = buf.readShort();
		}
		map.capZones[i] = capZone;
	}

	// Joints
	const jointsCount = buf.readShort();
	for (let i = 0; i < jointsCount; i++) {
		const jointType = buf.readShort();
		let joint: MapJoint;

		if (jointType === 1) {
			joint = getNewRevoluteJoint();
			joint.properties!.lowerAngle = buf.readDouble();
			joint.properties!.upperAngle = buf.readDouble();
			joint.properties!.motorMaxTorque = buf.readDouble();
			joint.properties!.motorSpeed = buf.readDouble();
			joint.properties!.enableLimit = buf.readBoolean();
			joint.properties!.enableMotor = buf.readBoolean();
			joint.anchorA = [buf.readDouble(), buf.readDouble()];
		} else if (jointType === 2) {
			joint = getNewDistanceJoint();
			joint.properties!.softness = buf.readDouble();
			joint.properties!.dampingRatio = buf.readDouble();
			joint.anchorA = [buf.readDouble(), buf.readDouble()];
			joint.anchorB = [buf.readDouble(), buf.readDouble()];
		} else if (jointType === 3) {
			joint = getNewLPJJoint();
			joint.pathStartX = buf.readDouble();
			joint.pathStartY = buf.readDouble();
			joint.pathAngle = buf.readDouble();
			joint.pathForce = buf.readDouble();
			joint.pathLower = buf.readDouble();
			joint.pathUpper = buf.readDouble();
			joint.pathLength = buf.readDouble();
			joint.pathMaxSpeed = buf.readDouble();
		} else if (jointType === 4) {
			joint = getNewLSJJoint();
			joint.springStartX = buf.readDouble();
			joint.springStartY = buf.readDouble();
			joint.springForce = buf.readDouble();
			joint.springLength = buf.readDouble();
		} else if (jointType === 5) {
			joint = getNewGearJoint();
			joint.name = buf.readUTF();
			joint.jointA = buf.readShort();
			joint.jointB = buf.readShort();
			joint.gearRatio = buf.readDouble();
		} else {
			throw new Error(`Unknown joint type: ${jointType}`);
		}

		// All non-gear joints have shared trailing fields
		if (jointType !== 5) {
			joint.bodyA = buf.readShort();
			joint.bodyB = buf.readShort();
			joint.properties!.collideConnected = buf.readBoolean();
			joint.properties!.breakForce = buf.readDouble();
			joint.properties!.drawLine = buf.readBoolean();
		}

		map.physics.joints[i] = joint;
	}

	return map;
}
