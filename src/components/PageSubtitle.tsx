import { component$ } from "@builder.io/qwik";

interface TitleProps {
	text: string;
}

export default component$(({ text }: TitleProps) => {
	return (
		<h1 class="text-2xl font-bold mb-2">{text}</h1>
	)
})