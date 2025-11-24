import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

const Messages = () => {
  // Mock data - will be replaced with real data
  const conversations = [
    {
      id: 1,
      name: "Alex Johnson",
      lastMessage: "Looking forward to our meeting!",
      timestamp: "2h ago",
      unread: true,
      matchType: "Friendly",
    },
    {
      id: 2,
      name: "Maria Silva",
      lastMessage: "Thanks for accepting the connection",
      timestamp: "1d ago",
      unread: false,
      matchType: "Mentoring",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-screen-sm mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Messages</h1>

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No messages yet. Start connecting with people!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {conv.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {conv.name}
                      </h3>
                      <span className="text-xs text-muted-foreground ml-2">
                        {conv.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {conv.lastMessage}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {conv.matchType}
                    </Badge>
                  </div>
                  {conv.unread && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;
