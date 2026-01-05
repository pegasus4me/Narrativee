import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { SaasUser } from "./columns";
import { authClient } from "@/lib/auth-client";
import { formatDistanceToNow } from "date-fns";
import { API_URL } from "@/lib/api-config";

interface UserDetailsDialogProps {
    user: SaasUser;
    children: React.ReactNode;
}

interface EventLog {
    id: string;
    eventName: string;
    metadata: any;
    createdAt: string;
    scoreValue: number;
}

export function UserDetailsDialog({ user, children }: UserDetailsDialogProps) {
    const { data: session } = authClient.useSession();
    const [events, setEvents] = useState<EventLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Calculate Live Status (Active within last 5 minutes)
    const isLive = new Date().getTime() - new Date(user.lastSeen).getTime() < 5 * 60 * 1000;

    useEffect(() => {
        if (isOpen && session?.user?.id) {
            setLoading(true);
            fetch(`${API_URL}/events/user/${user.id}`, {
                headers: {
                    'x-user-id': session.user.id
                }
            })
                .then(res => res.json())
                .then((data: any) => {
                    if (data.events) setEvents(data.events);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen, user.id, session]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <DialogTitle className="text-2xl">{user.metadata?.name || user.metadata?.Name || user.id}</DialogTitle>
                        {isLive ? (
                            <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                Online Now
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="text-gray-500">
                                Last seen {formatDistanceToNow(new Date(user.lastSeen))} ago
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    {/* Metrics Card */}
                    <Card className="shadow-none border-none" >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-6xl font-geist-mono">{user.score}</div>
                            <p className="text-xs text-muted-foreground mt-1">Based on recent activity</p>
                        </CardContent>
                    </Card>

                    {/* Metadata Card (Placeholder/Simple) */}
                    <Card className="shadow-none border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">User Info</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span>{user.metadata?.email || user.metadata?.Email || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Plan:</span>
                                <span className="capitalize">{user.metadata?.plan || user.metadata?.Plan || 'free'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex-1 min-h-0">
                    <h3 className="text-sm font-medium mb-2">Activity Feed</h3>
                    <Card className="h-full shadow-none border">
                        <ScrollArea className="h-[300px] w-full rounded-md p-4">
                            {loading ? (
                                <div className="text-center py-4 text-muted-foreground">Loading activity...</div>
                            ) : events.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground">No recent activity</div>
                            ) : (
                                <div className="space-y-4">
                                    {events.map((event) => (
                                        <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                <span className="font-medium text-sm">{event.eventName}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-sm font-mono ${event.scoreValue > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {event.scoreValue > 0 ? `+${event.scoreValue}` : '0'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(event.createdAt))} ago
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </Card>
                </div>

            </DialogContent>
        </Dialog>
    );
}
