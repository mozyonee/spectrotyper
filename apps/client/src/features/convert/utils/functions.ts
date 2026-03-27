import { FREQ_MAX, FREQ_MIN, SAMPLES_PER_COL } from "@spectrotyper/shared";

export const render = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, blob: Blob) => {
	const horizontalScale = 5;
	const ac = new AudioContext();
	const buf = await ac.decodeAudioData(await blob.arrayBuffer());
	ac.close();

	const pcm = buf.getChannelData(0);
	const rows = 50;
	const cols = Math.floor(pcm.length / SAMPLES_PER_COL);

	canvas.width = cols * horizontalScale;
	canvas.height = rows;

	for (let col = 0; col < cols; col++) {
		for (let row = 0; row < rows; row++) {
			const freq = FREQ_MAX - (row / (rows - 1)) * (FREQ_MAX - FREQ_MIN);
			let re = 0, im = 0;
			for (let n = 0; n < SAMPLES_PER_COL; n++) {
				const a = (2 * Math.PI * freq * n) / buf.sampleRate;
				re += pcm[col * SAMPLES_PER_COL + n] * Math.cos(a);
				im -= pcm[col * SAMPLES_PER_COL + n] * Math.sin(a);
			}
			const v = Math.min(1, Math.sqrt(re * re + im * im) / SAMPLES_PER_COL * 20);
			ctx.fillStyle = `hsl(${(1 - v) * 240},100%,${v * 50}%)`;
			ctx.fillRect(col * horizontalScale, row, horizontalScale, 1);
		}
	}
};