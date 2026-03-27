import { FREQ_MAX, FREQ_MIN, SAMPLE_RATE, SAMPLES_PER_COL } from "@spectrotyper/shared";
import { fonts, renderPixels } from "js-pixel-fonts";
import wav from "node-wav";

const GLYPH_HEIGHT: number = fonts.sevenPlus.lineHeight; // 7 rows

// Spectrograms draw high frequencies at the top, so row 0 → highest pitch, last row → lowest.
function rowToFreq(row: number): number {
	return FREQ_MAX - (row * (FREQ_MAX - FREQ_MIN)) / (GLYPH_HEIGHT - 1);
}

function synthesize(pixels: number[][]): Float32Array {
	const numCols = pixels[0].length;
	// Each pixel column becomes SAMPLES_PER_COL audio samples (~23ms at 44100 Hz).
	const pcm = new Float32Array(numCols * SAMPLES_PER_COL);

	for (let col = 0; col < numCols; col++) {
		// Each lit pixel in this column is a frequency we want to play simultaneously.
		const activeFreqs = pixels
			.map((row, i) => row[col] === 1 ? rowToFreq(i) : null)
			.filter((f): f is number => f !== null);

		if (activeFreqs.length === 0) continue;

		const offset = col * SAMPLES_PER_COL;
		for (let s = 0; s < SAMPLES_PER_COL; s++) {
			const t = s / SAMPLE_RATE;
			// Hann window: fades the column in and out so adjacent columns don't click when they meet.
			const window = 0.5 * (1 - Math.cos((2 * Math.PI * s) / (SAMPLES_PER_COL - 1)));
			// Sum all frequencies into one sample — this is what makes multiple pixels sound as a chord.
			pcm[offset + s] = activeFreqs.reduce((sum, freq) => sum + Math.sin(2 * Math.PI * freq * t), 0) * window;
		}
	}

	// Scale so the loudest sample hits 90% volume — as loud as possible without clipping.
	const peak = pcm.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
	if (peak > 0) pcm.forEach((_, i) => pcm[i] *= 0.9 / peak);

	return pcm;
}

export function textToWav(text: string): Buffer {
	// Render text as a 7-row pixel grid — each column is a moment in time, each row is a pitch band.
	const pixels: number[][] = renderPixels(text, fonts.sevenPlus);
	const pcm = synthesize(pixels);
	const result = wav.encode([pcm], { sampleRate: SAMPLE_RATE });
	return result;
}
