import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, Star, Trophy, Award, Target, Zap, Calendar, 
  Medal, Crown, ChevronRight, Play, Check, RefreshCw,
  Gift as GiftIcon, Sparkles, Loader2, ChevronUp, ChevronDown
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface SpinResult {
  id: string;
  prize: string;
  amount: number;
  token: string;
  date: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  rewardToken: string;
  progress: number;
  goal: number;
  completed: boolean;
  expiresAt: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  dateUnlocked?: string;
}

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  score: number;
  isYou?: boolean;
}

const WHEEL_SECTORS = [
  { label: "10 USDC", color: "#EF4444", value: 10 },
  { label: "50 USDC", color: "#F97316", value: 50 },
  { label: "100 USDC", color: "#EAB308", value: 100 },
  { label: "5 USDC", color: "#22C55E", value: 5 },
  { label: "200 USDC", color: "#3B82F6", value: 200 },
  { label: "25 USDC", color: "#8B5CF6", value: 25 },
  { label: "500 USDC", color: "#EC4899", value: 500 },
  { label: "Try Again", color: "#6B7280", value: 0 },
];

const DAILY_CHALLENGES: Challenge[] = [
  { id: "1", title: "Complete 3 Transactions", description: "Send 3 payments today", reward: 10, rewardToken: "USDC", progress: 2, goal: 3, completed: false, expiresAt: "2026-03-18" },
  { id: "2", title: "Invite a Friend", description: "Refer someone to Peys", reward: 25, rewardToken: "USDC", progress: 0, goal: 1, completed: false, expiresAt: "2026-03-18" },
  { id: "3", title: "Daily Login", description: "Login to the app", reward: 5, rewardToken: "USDC", progress: 1, goal: 1, completed: true, expiresAt: "2026-03-18" },
  { id: "4", title: "First Send", description: "Send your first payment", reward: 15, rewardToken: "USDC", progress: 1, goal: 1, completed: true, expiresAt: "2026-03-18" },
];

const BADGES: Badge[] = [
  { id: "1", name: "Newcomer", description: "Complete your first transaction", icon: "👋", unlocked: true, dateUnlocked: "2026-03-15" },
  { id: "2", name: "Regular", description: "Complete 10 transactions", icon: "⭐", unlocked: true, dateUnlocked: "2026-03-17" },
  { id: "3", name: "Power User", description: "Complete 50 transactions", icon: "🚀", unlocked: false },
  { id: "4", name: "Whale", description: "Send 1000 USDC total", icon: "🐋", unlocked: false },
  { id: "5", name: "Early Adopter", description: "Join before public launch", icon: "🕐", unlocked: true, dateUnlocked: "2026-03-01" },
  { id: "6", name: "Social Butterfly", description: "Refer 10 friends", icon: "🦋", unlocked: false },
  { id: "7", name: "Streak Master", description: "7 day login streak", icon: "🔥", unlocked: false },
  { id: "8", name: "Explorer", description: "Use 3 different networks", icon: "🗺️", unlocked: true, dateUnlocked: "2026-03-16" },
];

const LEADERBOARD: LeaderboardEntry[] = [
  { id: "1", rank: 1, name: "CryptoKing", score: 12500 },
  { id: "2", rank: 2, name: "DeFiDiva", score: 11200 },
  { id: "3", rank: 3, name: "BlockMaster", score: 10500 },
  { id: "4", rank: 4, name: "You", score: 8750, isYou: true },
  { id: "5", rank: 5, name: "TokenTiger", score: 7800 },
  { id: "6", rank: 6, name: "MoonWalker", score: 6500 },
  { id: "7", rank: 7, name: "HODLer", score: 5200 },
  { id: "8", rank: 8, name: "DiamondHands", score: 4100 },
];

export default function MiniGamesPage() {
  const { isLoggedIn, login } = useApp();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"spin" | "scratch" | "challenges" | "badges" | "leaderboard">("spin");

  // Spin wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastSpin, setLastSpin] = useState<SpinResult | null>(null);

  // Scratch card state
  const [scratched, setScratched] = useState(false);
  const [scratchAmount, setScratchAmount] = useState(25);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(false);
  }, [isLoggedIn]);

  const spinWheel = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    const randomSector = Math.floor(Math.random() * WHEEL_SECTORS.length);
    const baseRotation = randomSector * 45;
    const extraRotations = 5 * 360;
    const finalRotation = extraRotations + baseRotation;

    setRotation(finalRotation);

    setTimeout(() => {
      const result = WHEEL_SECTORS[randomSector];
      const spinResult: SpinResult = {
        id: crypto.randomUUID(),
        prize: result.label,
        amount: result.value,
        token: "USDC",
        date: new Date().toISOString(),
      };
      setLastSpin(spinResult);
      setIsSpinning(false);

      if (result.value > 0) {
        toast.success(`Won ${result.label}!`);
      } else {
        toast.info("Better luck next time!");
      }
    }, 3000);
  };

  const scratchCard = async () => {
    if (scratched) return;

    setScratched(true);
    const amount = Math.floor(Math.random() * 50) + 5;
    setScratchAmount(amount);
    toast.success(`You won ${amount} USDC!`);
  };

  const claimReward = async (challengeId: string) => {
    const challenge = DAILY_CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return;

    toast.success(`Claimed ${challenge.reward} ${challenge.rewardToken}!`);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Mini Games</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Play games, complete challenges, and earn rewards!
          </p>
          <button onClick={login} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            Sign In to Play
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto max-w-3xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Mini Games</h1>
            <p className="mt-1 text-sm text-muted-foreground">Win USDC rewards by playing!</p>
          </div>
        </div>

        {/* Game Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-primary">
              <Trophy className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">Total Won</span>
            </div>
            <p className="mt-1 font-display text-lg text-foreground">1,247 USDC</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-primary">
              <Award className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">Badges</span>
            </div>
            <p className="mt-1 font-display text-lg text-foreground">
              {BADGES.filter(b => b.unlocked).length} / {BADGES.length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex overflow-x-auto gap-1 rounded-xl border border-border bg-card p-1">
          {[
            { id: "spin", label: "Spin", icon: <Zap className="h-4 w-4" /> },
            { id: "scratch", label: "Scratch", icon: <Gift className="h-4 w-4" /> },
            { id: "challenges", label: "Challenges", icon: <Target className="h-4 w-4" /> },
            { id: "badges", label: "Badges", icon: <Medal className="h-4 w-4" /> },
            { id: "leaderboard", label: "Leaderboard", icon: <Crown className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "spin" | "scratch" | "challenges" | "badges" | "leaderboard")}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Spin Wheel Tab */}
            {activeTab === "spin" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="relative flex items-center justify-center py-8">
                  {/* Arrow */}
                  <div className="absolute top-0 z-10 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-primary" />
                  
                  {/* Wheel */}
                  <div
                    className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full border-4 border-border shadow-lg"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: isSpinning ? "transform 3s ease-out" : "none",
                    }}
                  >
                    {WHEEL_SECTORS.map((sector, i) => {
                      const angle = i * 45;
                      return (
                        <div
                          key={i}
                          className="absolute w-1/2 h-1/2 origin-bottom-left flex items-center justify-center"
                          style={{
                            transform: `rotate(${angle}deg)`,
                            left: "50%",
                            bottom: "50%",
                          }}
                        >
                          <div
                            className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: sector.color }}
                          >
                            <span
                              className="transform -rotate-90"
                              style={{ transform: `rotate(${angle + 22.5}deg)` }}
                            >
                              {sector.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={spinWheel}
                    disabled={isSpinning}
                    className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-primary-foreground font-semibold shadow-glow hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isSpinning ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Spinning...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        Spin to Win!
                      </>
                    )}
                  </button>
                  {lastSpin && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <p className="text-sm text-muted-foreground">Last Spin:</p>
                      <p className="font-medium text-foreground">
                        {lastSpin.amount > 0 ? (
                          <span className="text-green-600">+{lastSpin.prize}</span>
                        ) : (
                          <span className="text-muted-foreground">Try Again</span>
                        )}
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Scratch Card Tab */}
            {activeTab === "scratch" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div
                  onClick={scratchCard}
                  className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 cursor-pointer overflow-hidden shadow-lg"
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <GiftIcon className="h-12 w-12 mb-2" />
                    <p className="text-lg font-bold">SCRATCH TO WIN</p>
                    <p className="text-sm opacity-80">Up to 50 USDC</p>
                  </div>
                  {!scratched ? (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: scratched ? 0 : 1 }}
                    >
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center text-gray-600">
                          <Sparkles className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Click to scratch!</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p className="text-sm text-white/80">You Won!</p>
                      <p className="text-3xl font-bold text-white">{scratchAmount} USDC</p>
                      <Check className="h-8 w-8 mt-2 text-white" />
                    </motion.div>
                  )}
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setScratched(false)}
                    className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm text-foreground"
                  >
                    <RefreshCw className="h-4 w-4" />
                    New Card
                  </button>
                </div>
              </motion.div>
            )}

            {/* Challenges Tab */}
            {activeTab === "challenges" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {DAILY_CHALLENGES.map((challenge) => (
                  <div
                    key={challenge.id}
                    className={`rounded-xl border border-border bg-card p-4 ${
                      challenge.completed ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{challenge.title}</h3>
                          {challenge.completed && (
                            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-600">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{challenge.progress} / {challenge.goal}</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${(challenge.progress / challenge.goal) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-green-600">
                          +{challenge.reward} {challenge.rewardToken}
                        </p>
                        {challenge.completed && challenge.progress >= challenge.goal ? (
                          <button
                            onClick={() => claimReward(challenge.id)}
                            className="mt-2 rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground"
                          >
                            Claim
                          </button>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(challenge.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Badges Tab */}
            {activeTab === "badges" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                {BADGES.map((badge) => (
                  <motion.div
                    key={badge.id}
                    className={`rounded-xl border border-border p-4 text-center ${
                      badge.unlocked
                        ? "bg-card border-yellow-500/30"
                        : "bg-secondary/30 opacity-60"
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center mx-auto mb-2 rounded-full bg-primary/10 text-2xl">
                      {badge.icon}
                    </div>
                    <p className="font-medium text-foreground">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    {badge.unlocked && badge.dateUnlocked && (
                      <p className="mt-1 text-xs text-yellow-600">
                        Unlocked {new Date(badge.dateUnlocked).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === "leaderboard" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Top Players</h3>
                  <span className="text-xs text-muted-foreground">This Month</span>
                </div>

                {LEADERBOARD.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center justify-between rounded-lg border border-border p-3 ${
                      entry.isYou ? "bg-primary/10 border-primary/30" : "bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          entry.rank <= 3
                            ? entry.rank === 1
                              ? "bg-yellow-500 text-white"
                              : entry.rank === 2
                              ? "bg-gray-400 text-white"
                              : "bg-amber-700 text-white"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {entry.name}
                          {entry.isYou && (
                            <span className="ml-1 rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                              You
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {entry.score.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
