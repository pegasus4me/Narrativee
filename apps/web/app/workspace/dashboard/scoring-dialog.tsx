"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScoringManager } from "@/app/setting/scoring-manager";

interface ScoringDialogProps {
    open: boolean;
    onClose: () => void;
}

export function ScoringDialog({ open, onClose }: ScoringDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold font-manrope">
                        Scoring Rules
                    </DialogTitle>
                    <p className="text-sm text-gray-500">
                        Create a custom event name and assign it a score. When users perform these actions, their engagement score will increase.
                    </p>
                    <p className="text-xs text-gray-500/50 border border-primary p-2 rounded-md text-primary">
                        💡 Use the same event names in your SDK code: <code className="bg-primary/10 px-1 rounded">narrativee.event('your_event_name')</code>
                    </p>
                </DialogHeader>
                <div className="mt-4">
                    <ScoringManager />
                </div>
            </DialogContent>
        </Dialog>
    );
}
