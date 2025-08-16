const SimpleLogo = ({ size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="inline-block"
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="#0a0a0a" stroke="#262626" strokeWidth="2"/>
      
      {/* Grid lines */}
      <line x1="10" y1="50" x2="90" y2="50" stroke="#404040" strokeWidth="0.5" opacity="0.5"/>
      <line x1="50" y1="10" x2="50" y2="90" stroke="#404040" strokeWidth="0.5" opacity="0.5"/>
      
      {/* Constant Product Curve (X*Y = k) - Red */}
      <path
        d="M 20,80 Q 35,50 50,35 T 80,20"
        fill="none"
        stroke="#dc2626"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Constant Sum Curve (X+Y = k) - Green */}
      <line
        x1="20"
        y1="80"
        x2="80"
        y2="20"
        stroke="#16a34a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Intersection point */}
      <circle cx="50" cy="50" r="4" fill="#f97316"/>
      
      {/* Small labels */}
      {size > 60 && (
        <>
          <text x="70" y="30" fontSize="8" fill="#dc2626" fontFamily="monospace" fontWeight="bold">
            X·Y
          </text>
          <text x="25" y="75" fontSize="8" fill="#16a34a" fontFamily="monospace" fontWeight="bold">
            X+Y
          </text>
        </>
      )}
    </svg>
  );
};

export default SimpleLogo;