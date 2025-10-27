export function BasaltLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Giant's Causeway-inspired hexagonal basalt columns */}
      {/* The stacked hexagons represent strength, stability, and the layered security of the protocol */}
      
      {/* Bottom layer - largest, foundation */}
      <path
        d="M 50 85 L 35 76.34 L 35 59.02 L 50 50.36 L 65 59.02 L 65 76.34 Z"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />
      
      {/* Middle layer - medium sized */}
      <path
        d="M 50 65 L 37.5 57.17 L 37.5 41.51 L 50 33.68 L 62.5 41.51 L 62.5 57.17 Z"
        fill="currentColor"
        opacity="0.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      
      {/* Top layer - smallest, representing the peak */}
      <path
        d="M 50 45 L 40 39.34 L 40 28.02 L 50 22.36 L 60 28.02 L 60 39.34 Z"
        fill="currentColor"
        opacity="0.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      
      {/* Central accent - the core hexagon representing the protocol's core strength */}
      <path
        d="M 50 35 L 42.5 30.67 L 42.5 22.01 L 50 17.68 L 57.5 22.01 L 57.5 30.67 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="miter"
      />
    </svg>
  );
}