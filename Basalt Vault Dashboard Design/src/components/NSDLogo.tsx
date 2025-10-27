export function NSDLogo({ className = "", size = 120 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.5}
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Gradients for 3D beveled effect */}
        <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#39FF14" stopOpacity="1" />
          <stop offset="50%" stopColor="#2DD10F" stopOpacity="1" />
          <stop offset="100%" stopColor="#1AA309" stopOpacity="1" />
        </linearGradient>
        
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6495ED" stopOpacity="1" />
          <stop offset="50%" stopColor="#4A7BCF" stopOpacity="1" />
          <stop offset="100%" stopColor="#3461B1" stopOpacity="1" />
        </linearGradient>

        {/* Glows */}
        <filter id="greenGlow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <filter id="blueGlow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <filter id="electricGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Letter N - Bold with bevel effect */}
      <g filter="url(#greenGlow)">
        {/* Outer stroke - dark */}
        <path
          d="M 20 40 L 20 160 L 45 160 L 45 85 L 95 160 L 120 160 L 120 40 L 95 40 L 95 115 L 45 40 Z"
          fill="none"
          stroke="#1AA309"
          strokeWidth="8"
          strokeLinejoin="bevel"
        />
        {/* Inner fill - bright gradient */}
        <path
          d="M 20 40 L 20 160 L 45 160 L 45 85 L 95 160 L 120 160 L 120 40 L 95 40 L 95 115 L 45 40 Z"
          fill="url(#greenGrad)"
          stroke="#39FF14"
          strokeWidth="3"
          strokeLinejoin="bevel"
        />
        {/* Highlight for 3D effect */}
        <path
          d="M 25 45 L 25 90 L 40 90 L 40 70"
          fill="none"
          stroke="#39FF14"
          strokeWidth="2"
          opacity="0.7"
          strokeLinecap="round"
        />
      </g>

      {/* Letter S as CHAIN with dramatic break */}
      <g filter="url(#blueGlow)">
        {/* Top chain link */}
        <ellipse 
          cx="200" 
          cy="55" 
          rx="20" 
          ry="14" 
          fill="none" 
          stroke="#3461B1" 
          strokeWidth="10"
        />
        <ellipse 
          cx="200" 
          cy="55" 
          rx="20" 
          ry="14" 
          fill="none" 
          stroke="url(#blueGrad)" 
          strokeWidth="6"
        />
        
        {/* Second link */}
        <ellipse 
          cx="185" 
          cy="75" 
          rx="20" 
          ry="14" 
          fill="none" 
          stroke="#3461B1" 
          strokeWidth="10"
        />
        <ellipse 
          cx="185" 
          cy="75" 
          rx="20" 
          ry="14" 
          fill="none" 
          stroke="url(#blueGrad)" 
          strokeWidth="6"
        />

        {/* Third link - just before break */}
        <ellipse 
          cx="200" 
          cy="95" 
          rx="20" 
          ry="14" 
          fill="none" 
          stroke="#3461B1" 
          strokeWidth="10"
        />
        <ellipse 
          cx="200" 
          cy="95" 
          rx="20" 
          ry="14" 
          fill="none" 
          stroke="url(#blueGrad)" 
          strokeWidth="6"
        />
      </g>

      {/* BREAK SECTION - Electric lightning effect */}
      <g filter="url(#electricGlow)">
        {/* Top broken pieces - RED */}
        <path
          d="M 190 108 Q 182 108 178 112 L 175 115"
          fill="none"
          stroke="#FF3131"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 210 108 Q 218 108 222 112 L 225 115"
          fill="none"
          stroke="#FF3131"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Lightning bolts - CYAN/BLUE */}
        <path
          d="M 200 100 L 195 115 L 202 115 L 197 130"
          fill="none"
          stroke="#6495ED"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="miter"
        >
          <animate attributeName="opacity" values="1;0.3;1;0.5;1" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path
          d="M 200 100 L 205 115 L 198 115 L 203 130"
          fill="none"
          stroke="#39FF14"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="miter"
        >
          <animate attributeName="opacity" values="0.5;1;0.3;1;0.5" dur="0.8s" repeatCount="indefinite" />
        </path>

        {/* Electric particles */}
        <circle cx="190" cy="110" r="3" fill="#FFD700">
          <animate attributeName="r" values="2;4;2" dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="210" cy="110" r="3" fill="#FFD700">
          <animate attributeName="r" values="3;5;3" dur="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="120" r="2" fill="#FF3131">
          <animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" />
        </circle>

        {/* Energy burst lines */}
        <line x1="200" y1="115" x2="185" y2="105" stroke="#6495ED" strokeWidth="2" opacity="0.6">
          <animate attributeName="opacity" values="0;0.8;0" dur="1.2s" repeatCount="indefinite" />
        </line>
        <line x1="200" y1="115" x2="215" y2="105" stroke="#39FF14" strokeWidth="2" opacity="0.6">
          <animate attributeName="opacity" values="0.8;0;0.8" dur="1.2s" repeatCount="indefinite" />
        </line>
        <line x1="200" y1="115" x2="180" y2="120" stroke="#FFD700" strokeWidth="1.5" opacity="0.5">
          <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" />
        </line>
        <line x1="200" y1="115" x2="220" y2="120" stroke="#FFD700" strokeWidth="1.5" opacity="0.5">
          <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
        </line>

        {/* Bottom broken pieces - RED */}
        <path
          d="M 175 135 L 178 138 Q 182 142 190 142"
          fill="none"
          stroke="#FF3131"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 225 135 L 222 138 Q 218 142 210 142"
          fill="none"
          stroke="#FF3131"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </g>

      {/* Continuation of chain after break */}
      <g filter="url(#blueGlow)">
        {/* Fourth link - after break */}
        <ellipse 
          cx="185" 
          cy="155" 
          rx="20" 
          ry="14" 
          fill="none" 
          stroke="#3461B1" 
          strokeWidth="10"
        />
        <ellipse 
          cx="185" 
          cy="155" 
          rx="20" 
          ry="14" 
          fill="none" 
          stroke="url(#blueGrad)" 
          strokeWidth="6"
        />

        {/* Bottom chain link */}
        <ellipse 
          cx="200" 
          cy="175" 
          rx="20" 
          ry="14" 
          fill="none" 
          stroke="#3461B1" 
          strokeWidth="10"
        />
        <ellipse 
          cx="200" 
          cy="175" 
          rx="20" 
          ry="14" 
          fill="none" 
          stroke="url(#blueGrad)" 
          strokeWidth="6"
        />
      </g>

      {/* Letter D - Bold with bevel effect */}
      <g filter="url(#greenGlow)">
        {/* Outer stroke - dark */}
        <path
          d="M 280 40 L 280 160 L 330 160 Q 380 160 380 100 Q 380 40 330 40 Z M 305 60 L 330 60 Q 355 60 355 100 Q 355 140 330 140 L 305 140 Z"
          fill="none"
          stroke="#1AA309"
          strokeWidth="8"
          strokeLinejoin="bevel"
        />
        {/* Inner fill - bright gradient */}
        <path
          d="M 280 40 L 280 160 L 330 160 Q 380 160 380 100 Q 380 40 330 40 Z M 305 60 L 330 60 Q 355 60 355 100 Q 355 140 330 140 L 305 140 Z"
          fill="url(#greenGrad)"
          stroke="#39FF14"
          strokeWidth="3"
          strokeLinejoin="bevel"
        />
        {/* Highlight for 3D effect */}
        <path
          d="M 285 45 L 285 90"
          fill="none"
          stroke="#39FF14"
          strokeWidth="2"
          opacity="0.7"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
