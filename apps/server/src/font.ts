// @ts-ignore
import { fonts } from "js-pixel-fonts";

const font = fonts.sevenPlus as {
	lineHeight: number;
	glyphs: Record<string, { pixels: number[][]; }>;
};

export const GLYPH_HEIGHT = font.lineHeight; // 7

export function getGlyph(char: string): number[][] {
	const glyph = font.glyphs[char] ?? font.glyphs[" "];
	// Pad shorter glyphs to lineHeight by centering vertically
	const h = glyph.pixels.length;
	if (h === GLYPH_HEIGHT) return glyph.pixels;
	const padTop = Math.floor((GLYPH_HEIGHT - h) / 2);
	const padBottom = GLYPH_HEIGHT - h - padTop;
	const emptyRow = (w: number) => new Array(w).fill(0);
	const w = glyph.pixels[0]?.length ?? 1;
	return [
		...Array.from({ length: padTop }, () => emptyRow(w)),
		...glyph.pixels,
		...Array.from({ length: padBottom }, () => emptyRow(w)),
	];
}
