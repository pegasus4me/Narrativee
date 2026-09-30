import styles from "./hero-gradient.module.css";

const WIDTH = 1271;
const HEIGHT = 599;
const BAR_COUNT = 9;

const stops = [
  { offset: 0, color: "#340B05" },
  { offset: 0.1827, color: "#0358F7" },
  { offset: 0.2837, color: "#5092C7" },
  { offset: 0.4135, color: "#E1ECFE" },
  { offset: 0.5866, color: "#FFD400" },
  { offset: 0.6827, color: "#FA3D1D" },
  { offset: 0.8029, color: "#FD02F5" },
  { offset: 1, color: "#FFC0FD00" },
];

const heights = Array.from({ length: BAR_COUNT }, (_, index) => {
  const distanceFromCenter = Math.abs(index - (BAR_COUNT - 1) / 2);
  const normalizedDistance = distanceFromCenter / ((BAR_COUNT - 1) / 2);
  const curve = 1 - normalizedDistance ** 1.24;

  return 0.98 * HEIGHT * (0.55 + 0.45 * curve);
});

export default function HeroGradient(): React.ReactNode {
  const barWidth = WIDTH / BAR_COUNT;

  return (
    <div className={styles.backdrop} aria-hidden="true">
      <svg
        className={styles.art}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="narrativee-hero-rainbow"
            x1="0"
            y1="1"
            x2="0"
            y2="0"
          >
            {stops.map((stop) => (
              <stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
              />
            ))}
          </linearGradient>
          <linearGradient
            id="narrativee-hero-rainbow-flow"
            href="#narrativee-hero-rainbow"
            x1="0"
            y1="1"
            x2="0"
            y2="0"
            spreadMethod="reflect"
          >
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="0 0"
              to="0 2"
              dur="18s"
              begin="1.1s"
              repeatCount="indefinite"
            />
          </linearGradient>
          <filter
            id="narrativee-hero-blur"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="15" />
          </filter>
        </defs>
        {heights.map((height, index) => (
          <g key={index} filter="url(#narrativee-hero-blur)">
            <rect
              x={index * barWidth}
              y={HEIGHT - height}
              width={barWidth * 1.23}
              height={height}
              fill="url(#narrativee-hero-rainbow-flow)"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
