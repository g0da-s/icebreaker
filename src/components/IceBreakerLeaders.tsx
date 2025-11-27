import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatDisplayName } from "@/lib/utils";

interface LeaderboardUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  avatar_type: string | null;
  meeting_count: number;
}

interface IceBreakerLeadersProps {
  onUserClick: (userId: string) => void;
}

export const IceBreakerLeaders = ({ onUserClick }: IceBreakerLeadersProps) => {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaders();

    // Real-time subscription for meeting completions
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'meetings',
          filter: 'status=eq.completed'
        },
        () => {
          // Refresh leaderboard when a meeting is completed
          fetchLeaders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaders = async () => {
    try {
      // Fetch all completed meetings
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('requester_id, recipient_id')
        .eq('status', 'completed');

      if (meetingsError) throw meetingsError;

      // Count meetings per user (INCLUDING EVERYONE)
      const userMeetingCounts = new Map<string, number>();
      meetings?.forEach((meeting) => {
        // Count for requester
        userMeetingCounts.set(
          meeting.requester_id,
          (userMeetingCounts.get(meeting.requester_id) || 0) + 1
        );
        // Count for recipient
        userMeetingCounts.set(
          meeting.recipient_id,
          (userMeetingCounts.get(meeting.recipient_id) || 0) + 1
        );
      });

      // Get top 5 users sorted by meeting count
      const topUserIds = Array.from(userMeetingCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (topUserIds.length === 0) {
        setLeaders([]);
        setLoading(false);
        return;
      }

      // Fetch user profiles for top 5
      const userIds = topUserIds.map(([userId]) => userId);
      const { data: profiles, error: profilesError } = await supabase
        .from('public_profiles')
        .select('id, full_name, avatar_url, avatar_type')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const leaderboardUsers: LeaderboardUser[] = topUserIds
        .map(([userId, count]) => {
          const profile = profiles?.find((p) => p.id === userId);
          if (!profile) return null;
          return {
            user_id: userId,
            full_name: profile.full_name || 'No Name',
            avatar_url: profile.avatar_url,
            avatar_type: profile.avatar_type,
            meeting_count: count,
          };
        })
        .filter((user): user is LeaderboardUser => user !== null);

      setLeaders(leaderboardUsers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="mb-12">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-white mb-2 flex items-center gap-2"
        >
          Ice Breaker Leaders 🏆
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-slate-300 mb-4"
        >
          Top members by successful meetings
        </motion.p>
        <p className="text-center text-slate-400 py-8">Loading leaderboard...</p>
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="mb-12">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-white mb-2 flex items-center gap-2"
        >
          Ice Breaker Leaders 🏆
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-slate-300 mb-4"
        >
          Top members by successful meetings
        </motion.p>
        <Card className="p-8 bg-slate-800/40 backdrop-blur-xl border-white/10 text-center">
          <Trophy className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-300">No completed meetings yet</p>
          <p className="text-sm text-slate-400 mt-2">
            Be the first to complete a meeting and earn your spot on the leaderboard!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold text-white mb-2 flex items-center gap-2"
      >
        Ice Breaker Leaders 🏆
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-slate-300 mb-4"
      >
        Top members by successful meetings
      </motion.p>

      <div className="space-y-3">
        {leaders.map((leader, index) => {
          const rank = index + 1;

          return (
            <motion.div
              key={leader.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="p-4 bg-slate-800/40 backdrop-blur-xl border-white/10 hover:bg-slate-800/60 hover:border-cyan-500/30 transition-all shadow-xl cursor-pointer"
                onClick={() => onUserClick(leader.user_id)}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Number */}
                  <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                    <span className="text-2xl font-bold text-cyan-400">{rank}</span>
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-cyan-500/20">
                    <AvatarImage
                      src={leader.avatar_url || undefined}
                      alt={leader.full_name}
                    />
                    <AvatarFallback className="text-lg bg-slate-700">
                      {leader.full_name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-base truncate hover:text-cyan-400 transition-colors">
                      {formatDisplayName(leader.full_name)}
                    </h3>
                  </div>

                  {/* Score Column */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-2xl font-bold text-white">
                      {leader.meeting_count}
                    </span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      Successful Meetings
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
