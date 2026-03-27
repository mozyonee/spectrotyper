"use client";

import api from "@/lib/api";
import { useState } from "react";

type State = "idle" | "loading" | "ready";

interface Props {
	onConvert: (blob: Blob) => void;
}

export default function ConvertForm({ onConvert }: Props) {
	const [text, setText] = useState("");
	const [state, setState] = useState<State>("idle");
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

	function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
		setText(e.target.value);
		if (state === "ready") {
			if (audioUrl) URL.revokeObjectURL(audioUrl);
			setAudioUrl(null);
			setAudio(null);
			setState("idle");
		}
	}

	async function handleClick() {
		if (state === "ready" && audioUrl) {
			audio?.play();
		} else if (state === "idle" && text.trim().length > 0) {
			setState("loading");
			try {
				const res = await api.post("/convert", { text }, { responseType: "blob" });
				const url = URL.createObjectURL(res.data);
				setAudioUrl(url);
				setAudio(new Audio(url));
				onConvert(res.data);
				setState("ready");
			} catch {
				setState("idle");
			}
		}
	}

	return (
		<div className="flex w-full max-w-md flex-col gap-4">
			<h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
				Text to Spectrogram
			</h1>
			<input
				type="text"
				value={text}
				onChange={handleTextChange}
				placeholder="Enter text..."
				className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-black outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-500"
			/>
			<button
				onClick={handleClick}
				disabled={!text.trim() || state === "loading"}
				className={`" flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-zinc-200" ${state === "loading" ? "cursor-wait" : "cursor-pointer"}`}
			>
				{state === "loading" ? "Generating..." : state === "ready" && audioUrl ? "Play" : "Send"}
			</button>
		</div>
	);
}
