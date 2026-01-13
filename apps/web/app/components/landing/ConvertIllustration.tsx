"use client"

export function ConvertIllustration() {
    return (
        <div className="flex items-center justify-center py-6">
            <div className="relative w-[180px] h-[120px]">
                {/* Simple bar chart */}
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-3 h-[100px]">
                    {/* Bar 1 */}
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-[40px] bg-gray-200 rounded-t"></div>
                        <span className="text-[8px] text-gray-400 mt-1">Mon</span>
                    </div>
                    {/* Bar 2 */}
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-[55px] bg-gray-200 rounded-t"></div>
                        <span className="text-[8px] text-gray-400 mt-1">Tue</span>
                    </div>
                    {/* Bar 3 */}
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-[45px] bg-primary/30 rounded-t"></div>
                        <span className="text-[8px] text-gray-400 mt-1">Wed</span>
                    </div>
                    {/* Bar 4 - highlighted */}
                    <div className="flex flex-col items-center relative">
                        <div className="w-8 h-[80px] bg-primary rounded-t"></div>
                        <span className="text-[8px] text-gray-400 mt-1">Thu</span>
                        {/* Badge */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                            +24%
                        </div>
                    </div>
                    {/* Bar 5 */}
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-[70px] bg-primary/80 rounded-t"></div>
                        <span className="text-[8px] text-gray-400 mt-1">Fri</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
