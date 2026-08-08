export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Inkorium Logo"
      >
        <path
          d="M24 2L42.1865 12.5V33.5L24 44L5.81346 33.5V12.5L24 2Z"
          fill="#233B5D"
        />
        <text
          x="24"
          y="32"
          fontFamily="Inter, sans-serif"
          fontSize="24"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          K
        </text>
      </svg>
    </div>
  )
}
