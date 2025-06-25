import { component$ } from '@builder.io/qwik';

interface TitleProps {
  text: string;
}

export default component$(({ text }: TitleProps) => {
  return <h1 class="text-4xl font-semibold mb-2">{text}</h1>;
});
