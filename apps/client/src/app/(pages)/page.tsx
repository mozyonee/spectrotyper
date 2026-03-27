"use client";

import { useState } from "react";
import ConvertForm from "@/features/convert/components/convert-form";
import Spectrogram from "@/features/convert/components/spectrogram";

export default function Home() {
	const [blob, setBlob] = useState<Blob>();

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 bg-zinc-50 dark:bg-black">
			<ConvertForm onConvert={setBlob} />
			<Spectrogram blob={blob} />
		</div>
	);
}
