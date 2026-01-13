"use client"

export function EngagementScoreChart() {
    const score = 78
    const circumference = 2 * Math.PI * 45
    const progress = (score / 100) * circumference

    return (
        <div className="flex items-center justify-center py-6">
            <div className="relative w-[160px] h-[160px]">
                {/* Background circle */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#000ABF"
                        strokeWidth="8"
                        strokeDasharray={`${progress} ${circumference}`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{score}</span>
                    <span className="text-xs text-gray-500 font-manrope">Score</span>
                </div>
            </div>
        </div>
    )
}
