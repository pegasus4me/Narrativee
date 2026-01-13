"use client"

export function TriggerIllustration() {
    return (
        <div className="flex items-center justify-center py-6">
            <div className="relative">
                {/* Popup/Modal illustration */}
                <div className="w-[180px] h-[120px] bg-white rounded-lg shadow-lg border border-gray-200 p-4 relative">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary text-xs">🎯</span>
                        </div>
                        <div className="h-2 w-16 bg-gray-200 rounded"></div>
                    </div>
                    {/* Body text lines */}
                    <div className="space-y-2 mb-3">
                        <div className="h-2 w-full bg-gray-100 rounded"></div>
                        <div className="h-2 w-3/4 bg-gray-100 rounded"></div>
                    </div>
                    {/* CTA Button */}
                    <div className="h-6 w-20 bg-primary rounded text-[8px] text-white flex items-center justify-center font-medium">
                        Upgrade Now
                    </div>

                    {/* Notification badge */}
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px]">✓</span>
                    </div>
                </div>

                {/* Trigger arrow */}
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
                    <div className="w-3 h-0.5 bg-primary"></div>
                </div>
            </div>
        </div>
    )
}
