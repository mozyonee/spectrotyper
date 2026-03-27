import cors from "cors";
import express from "express";
import { textToWav } from "./spectrotyper";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

app.post("/convert", (req, res) => {
	const raw = req.body?.text;
	if (typeof raw !== "string" || raw.trim().length === 0) {
		res.status(400).json({ error: "text is required and must be a non-empty string" });
		return;
	}
	const text = raw.slice(0, 200);
	const wav = textToWav(text);
	res
		.status(200)
		.set("Content-Type", "audio/wav")
		.set("Content-Length", String(wav.length))
		.set("Content-Disposition", 'attachment; filename="spectrogram.wav"')
		.end(wav);
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
