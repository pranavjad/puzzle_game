import React from 'react'

function LoadingSpinner() {
  return (
    <div>
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" style={{margin: 'auto', background: 'rgb(0, 0, 0, 0)', display: 'block', shapeRenderin: 'auto'}} width="200px" height="600px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
        <circle cx="50" cy="50" fill="none" stroke="#ffff" strokeWidth="5" r="28" strokeDasharray="131.94689145077132 45.982297150257104">
          <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50" keyTimes="0;1"></animateTransform>
        </circle>
        </svg>
    </div>
  )
}

export default LoadingSpinner