const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class byteBuffer {
	index: number;
	buffer: ArrayBuffer;
	view: DataView;

	constructor(size = 102400) {
		this.index = 0;
		this.buffer = new ArrayBuffer(size);
		this.view = new DataView(this.buffer);
	}

	readByte(): number {
		const value = this.view.getUint8(this.index);
		this.index += 1;
		return value;
	}

	readShort(): number {
		const value = this.view.getInt16(this.index);
		this.index += 2;
		return value;
	}

	readUShort(): number {
		const value = this.view.getUint16(this.index);
		this.index += 2;
		return value;
	}

	readInt(): number {
		const value = this.view.getInt32(this.index);
		this.index += 4;
		return value;
	}

	readUint(): number {
		const value = this.view.getUint32(this.index);
		this.index += 4;
		return value;
	}

	readFloat(): number {
		const value = this.view.getFloat32(this.index);
		this.index += 4;
		return value;
	}

	readDouble(): number {
		const value = this.view.getFloat64(this.index);
		this.index += 8;
		return value;
	}

	readBoolean(): boolean {
		return this.readByte() === 1;
	}

	readUTF(): string {
		const byte1 = this.readByte();
		const byte2 = this.readByte();
		const length = (byte1 << 8) | byte2;
		const array = new Uint8Array(length);
		for (let i = 0; i < length; i++) {
			array[i] = this.readByte();
		}
		return textDecoder.decode(array);
	}

	writeByte(value: number): void {
		this.view.setUint8(this.index, value);
		this.index += 1;
	}

	writeShort(value: number): void {
		this.view.setInt16(this.index, value);
		this.index += 2;
	}

	writeUShort(value: number): void {
		this.view.setUint16(this.index, value);
		this.index += 2;
	}

	writeInt(value: number): void {
		this.view.setInt32(this.index, value);
		this.index += 4;
	}

	writeUint(value: number): void {
		this.view.setUint32(this.index, value);
		this.index += 4;
	}

	writeFloat(value: number): void {
		this.view.setFloat32(this.index, value);
		this.index += 4;
	}

	writeDouble(value: number): void {
		this.view.setFloat64(this.index, value);
		this.index += 8;
	}

	writeBoolean(value: boolean): void {
		this.writeByte(value ? 1 : 0);
	}

	writeUTF(text: string): void {
		const array = textEncoder.encode(text);
		const length = array.length;
		this.writeByte(Math.floor(length / 256));
		this.writeByte(length % 256);
		for (let i = 0; i < length; i++) {
			this.writeByte(array[i]);
		}
	}

	toBase64(): string {
		const array = new Uint8Array(this.buffer);
		let binary = '';
		for (let i = 0; i < this.index; i++) {
			binary += String.fromCharCode(array[i]);
		}
		return btoa(binary);
	}

	fromBase64(data: string): void {
		const binary = atob(data);
		const length = binary.length;
		const array = new Uint8Array(length);
		for (let i = 0; i < length; i++) {
			array[i] = binary.charCodeAt(i);
		}
		this.buffer = array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset);
		this.view = new DataView(this.buffer);
		this.index = 0;
	}
}
