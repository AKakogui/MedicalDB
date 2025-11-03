import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <path
          id="arrow"
          d="M-20 -35 c 15 0, 20 20, 20 20 l -10 0 l 15 15 l 15 -15 l -10 0 c 0 0, -5 -20, -20 -20 Z"
        />
        <path
          id="text-arc"
          d="M 10 50 A 40 40 0 1 1 90 50"
          fill="none"
          stroke="none"
        />
      </defs>

      <g transform="translate(50, 50) scale(1.2)">
        <use href="#arrow" fill="#f44336" transform="rotate(0)" />
        <use href="#arrow" fill="#e91e63" transform="rotate(72)" />
        <use href="#arrow" fill="#2196f3" transform="rotate(144)" />
        <use href="#arrow" fill="#4caf50" transform="rotate(216)" />
        <use href="#arrow" fill="#ff9800" transform="rotate(288)" />
      </g>

      <path
        d="M50 42 c-1.8 0-3.5 0.3-5.2 0.8 l-2.3-2.3 c-2-2-5.2-2-7.2 0 s-2 5.2 0 7.2 l2.3 2.3 C37.3 52.5 37 54.2 37 56 c0 1.8 0.3 3.5 0.8 5.2 l-2.3 2.3 c-2 2-2 5.2 0 7.2 s5.2 2 7.2 0 l2.3-2.3 c2.5 1.5 5.5 2.6 8.7 2.6 v6 c0 1.1 0.9 2 2 2 s2-0.9 2-2 v-6 c3.2 0 6.2-1.1 8.7-2.6 l2.3 2.3 c2 2 5.2 2 7.2 0 s2-5.2 0-7.2 l-2.3-2.3 c0.5-1.7 0.8-3.4 0.8-5.2 c0-1.8-0.3-3.5-0.8-5.2 l2.3-2.3 c2-2 2-5.2 0-7.2 s-5.2-2-7.2 0 l-2.3 2.3 C58.2 42.3 51.8 42 50 42 z M50 50 c1.1 0 2 0.9 2 2 v8 c0 1.1-0.9 2-2 2 s-2-0.9-2-2 v-8 C48 50.9 48.9 50 50 50 z M41 38 c1.1 0 2.1 0.4 2.8 1.2 l2-2 c-1.5-1.5-3.5-2.2-5.6-2.2 c-4.4 0-8 3.6-8 8 c0 2.1 0.8 4.1 2.2 5.6 l2 2 C38.4 49.1 38 47.1 38 45 C38 41.1 41.1 38 45 38 h-4z M59 38 c-1.1 0-2.1 0.4-2.8 1.2 l-2-2 c1.5-1.5 3.5-2.2 5.6-2.2 c4.4 0 8 3.6 8 8 c0 2.1-0.8 4.1-2.2 5.6 l-2 2 c1.6-1.5 2.2-3.5 2.2-5.6 C66 41.1 62.9 38 59 38 z"
        fill="hsl(var(--foreground))"
        transform="scale(0.8) translate(12, 18)"
      />
      
      <text
        fontFamily="sans-serif"
        fontSize="20"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
      >
        <textPath href="#text-arc" startOffset="50%" textAnchor="middle">
          ALL MEDICAL
        </textPath>
      </text>
    </svg>
  );
}
