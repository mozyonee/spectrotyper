import { FREQ_MAX, FREQ_MIN, SAMPLE_RATE, SAMPLES_PER_COL } from "@spectrotyper/shared";
import { getGlyph, GLYPH_HEIGHT } from "./font";

function rowToFreq(row: number): number {
	return FREQ_MAX - (row * (FREQ_MAX - FREQ_MIN)) / (GLYPH_HEIGHT - 1);
}

function buildColumns(text: string): boolean[][] {
	const columns: boolean[][] = [];
	const blank: boolean[] = new Array(GLYPH_HEIGHT).fill(false);

	for (const char of text) {
		const pixels = getGlyph(char);
		const glyphWidth = pixels[0]?.length ?? 1;
		for (let col = 0; col < glyphWidth; col++) {
			const frame: boolean[] = [];
			for (let row = 0; row < GLYPH_HEIGHT; row++) {
				frame.push((pixels[row]?.[col] ?? 0) === 1);
			}
			columns.push(frame);
		}
		columns.push(blank); // spacer between characters
	}

	return columns;
}

function synthesize(columns: boolean[][]): Float64Array {
	const totalSamples = columns.length * SAMPLES_PER_COL;
	const pcm = new Float64Array(totalSamples);

	for (let colIdx = 0; colIdx < columns.length; colIdx++) {
		const frame = columns[colIdx];
		const activeFreqs: number[] = [];
		for (let row = 0; row < GLYPH_HEIGHT; row++) {
			if (frame[row]) activeFreqs.push(rowToFreq(row));
		}
		if (activeFreqs.length === 0) continue;

		const offset = colIdx * SAMPLES_PER_COL;
		for (let s = 0; s < SAMPLES_PER_COL; s++) {
			const t = s / SAMPLE_RATE;
			// Hann window: tapers signal to 0 at both ends, eliminating discontinuity noise
			const window = 0.5 * (1 - Math.cos((2 * Math.PI * s) / (SAMPLES_PER_COL - 1)));
			let sum = 0;
			for (const freq of activeFreqs) {
				sum += Math.sin(2 * Math.PI * freq * t);
			}
			pcm[offset + s] = sum * window;
		}
	}

	// Normalize to 90% of 16-bit range
	let peak = 0;
	for (let i = 0; i < pcm.length; i++) {
		if (Math.abs(pcm[i]) > peak) peak = Math.abs(pcm[i]);
	}
	if (peak > 0) {
		const scale = (32767 * 0.9) / peak;
		for (let i = 0; i < pcm.length; i++) {
			pcm[i] *= scale;
		}
	}

	return pcm;
}

function encodeWav(pcm: Float64Array): Buffer {
	const dataLen = pcm.length * 2;
	const header = Buffer.alloc(44);

	header.write("RIFF", 0, "ascii");
	header.writeUInt32LE(36 + dataLen, 4);
	header.write("WAVE", 8, "ascii");
	header.write("fmt ", 12, "ascii");
	header.writeUInt32LE(16, 16);
	header.writeUInt16LE(1, 20); // PCM
	header.writeUInt16LE(1, 22); // mono
	header.writeUInt32LE(SAMPLE_RATE, 24);
	header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byteRate
	header.writeUInt16LE(2, 32); // blockAlign
	header.writeUInt16LE(16, 34); // bitsPerSample
	header.write("data", 36, "ascii");
	header.writeUInt32LE(dataLen, 40);

	const samples = Buffer.alloc(dataLen);
	for (let i = 0; i < pcm.length; i++) {
		const clamped = Math.max(-32768, Math.min(32767, Math.round(pcm[i])));
		samples.writeInt16LE(clamped, i * 2);
	}

	return Buffer.concat([header, samples]);
}

export function textToWav(text: string): Buffer {
	const columns = buildColumns(text);
	const pcm = synthesize(columns);
	return encodeWav(pcm);
}
