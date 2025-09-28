import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift, Users, Play, RotateCcw, Plus, Trash2, History, Shuffle, Trophy, Clock, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DrawRecord } from "@shared/schema";

const Confetti = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full"
    initial={{ y: -100, opacity: 1, rotate: 0 }}
    animate={{
      y: window.innerHeight + 100,
      opacity: 0,
      rotate: 720,
      x: [0, 50, -30, 20, -10]
    }}
    transition={{
      duration: 3,
      delay,
      ease: "linear"
    }}
    style={{
      backgroundColor: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#E74C3C"][Math.floor(Math.random() * 5)]
    }}
  />
);

export default function LotteryPage() {
  const [participantsText, setParticipantsText] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [giftsText, setGiftsText] = useState("");
  const [gifts, setGifts] = useState<string[]>([]);
  const [selectedGift, setSelectedGift] = useState<string>("all");
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [preventDuplicates, setPreventDuplicates] = useState(false);
  const [usedWinners, setUsedWinners] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch draw history
  const { data: drawHistory = [], isLoading: historyLoading } = useQuery<DrawRecord[]>({
    queryKey: ['/api/draw-history'],
  });

  // Add draw record mutation
  const addDrawRecordMutation = useMutation({
    mutationFn: async (data: { winner: string; gift?: string; totalParticipants: number; participants: string[] }) => {
      const response = await apiRequest("POST", "/api/draw-record", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/draw-history'] });
    },
  });

  // Clear history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/draw-history");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/draw-history'] });
      toast({ title: "기록이 삭제되었습니다" });
    },
  });

  // Update participants when text changes
  useEffect(() => {
    const text = participantsText.trim();
    const newParticipants = text ? text.split(',').filter(name => name.trim()).map(name => name.trim()) : [];
    setParticipants(newParticipants);
  }, [participantsText]);

  // Update gifts when text changes
  useEffect(() => {
    const text = giftsText.trim();
    const newGifts = text ? text.split(',').filter(gift => gift.trim()).map(gift => gift.trim()) : [];
    setGifts(newGifts);
    // Reset selected gift if it's no longer in the list
    if (selectedGift !== "all" && !newGifts.includes(selectedGift)) {
      setSelectedGift("all");
    }
  }, [giftsText, selectedGift]);

  // Get available participants (excluding used winners if prevent duplicates is on)
  const availableParticipants = preventDuplicates 
    ? participants.filter(p => !usedWinners.has(p))
    : participants;

  const canDraw = availableParticipants.length > 0 && !isDrawing;

  const startLottery = async () => {
    if (!canDraw) return;
    
    setIsDrawing(true);
    setWinner(null);
    setShowConfetti(false);
    
    // Simulate drawing time for suspense
    const drawTime = Math.random() * 2000 + 2000;
    
    setTimeout(async () => {
      // Select random winner
      const randomIndex = Math.floor(Math.random() * availableParticipants.length);
      const selectedWinner = availableParticipants[randomIndex];
      
      // Add to used winners if duplicate prevention is on
      if (preventDuplicates) {
        setUsedWinners(prev => new Set(prev).add(selectedWinner));
      }
      
      // Record the draw
      try {
        await addDrawRecordMutation.mutateAsync({
          winner: selectedWinner,
          gift: selectedGift === "all" ? undefined : selectedGift,
          totalParticipants: participants.length,
          participants: participants
        });
      } catch (error) {
        console.error("Failed to save draw record:", error);
      }
      
      setWinner(selectedWinner);
      setShowConfetti(true);
      setIsDrawing(false);
      
      toast({ 
        title: "🎉 추첨 완료!", 
        description: selectedGift !== "all"
          ? `${selectedWinner}님이 ${selectedGift}에 당첨되었습니다!`
          : `${selectedWinner}님이 당첨되었습니다!`
      });
    }, drawTime);
  };

  const drawAgain = () => {
    setWinner(null);
    setShowConfetti(false);
    setTimeout(() => startLottery(), 100);
  };

  const newDraw = () => {
    setWinner(null);
    setShowConfetti(false);
    setUsedWinners(new Set());
  };

  const clearParticipants = () => {
    setParticipantsText("");
    setParticipants([]);
    setUsedWinners(new Set());
    setWinner(null);
    setShowConfetti(false);
  };

  const clearGifts = () => {
    setGiftsText("");
    setGifts([]);
    setSelectedGift("all");
  };

  const shuffleGifts = () => {
    if (gifts.length < 2) return;
    
    // Fisher-Yates shuffle
    const shuffled = [...gifts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setGiftsText(shuffled.join(', '));
  };

  const shuffleParticipants = () => {
    if (participants.length < 2) return;
    
    // Fisher-Yates shuffle
    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setParticipantsText(shuffled.join(', '));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2 flex items-center justify-center">
              <Gift className="mr-3" />
              선물 추첨 앱
            </h1>
            <p className="text-muted-foreground text-lg">공정하고 재미있는 랜덤 추첨을 경험해보세요!</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Participant Input */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-card-foreground flex items-center">
                <Users className="mr-2 text-primary" />
                참가자 명단
              </h2>
              <div className="flex items-center space-x-4">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {participants.length}명
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearParticipants}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-clear-participants"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <Textarea
                placeholder="참가자 이름을 쉼표로 구분해서 입력해주세요.&#10;예시: 김철수, 이영희, 박민수, 최지훈, 정수연"
                className="h-40 resize-none"
                value={participantsText}
                onChange={(e) => setParticipantsText(e.target.value)}
                data-testid="textarea-participants"
              />
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prevent-duplicates"
                    checked={preventDuplicates}
                    onCheckedChange={(checked) => setPreventDuplicates(!!checked)}
                    data-testid="checkbox-prevent-duplicates"
                  />
                  <label htmlFor="prevent-duplicates" className="text-sm text-muted-foreground flex items-center space-x-1">
                    <span>중복 당첨 방지</span>
                    <Info className="h-3 w-3" />
                  </label>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shuffleParticipants}
                  disabled={participants.length < 2}
                  className="text-primary hover:text-primary/80"
                  data-testid="button-shuffle"
                >
                  <Shuffle className="h-4 w-4 mr-1" />
                  명단 섞기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gift Management */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-card-foreground flex items-center">
                <Gift className="mr-2 text-primary" />
                선물 목록
              </h2>
              <div className="flex items-center space-x-4">
                <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {gifts.length}개
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearGifts}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-clear-gifts"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <Textarea
                placeholder="선물 이름을 쉼표로 구분해서 입력해주세요.&#10;예시: 아이폰 15, 에어팟 프로, 스타벅스 기프티콘, 도서상품권, 치킨 쿠폰"
                className="h-32 resize-none"
                value={giftsText}
                onChange={(e) => setGiftsText(e.target.value)}
                data-testid="textarea-gifts"
              />
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    추첨할 선물 선택 (선택사항)
                  </label>
                  <Select value={selectedGift} onValueChange={setSelectedGift}>
                    <SelectTrigger data-testid="select-gift">
                      <SelectValue placeholder="선물을 선택하세요 (전체 추첨시 비워두세요)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 선물 (랜덤)</SelectItem>
                      {gifts.map((gift) => (
                        <SelectItem key={gift} value={gift}>
                          {gift}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shuffleGifts}
                  disabled={gifts.length < 2}
                  className="text-primary hover:text-primary/80 self-end"
                  data-testid="button-shuffle-gifts"
                >
                  <Shuffle className="h-4 w-4 mr-1" />
                  선물 섞기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lottery Draw */}
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="relative">
                {/* Confetti */}
                <AnimatePresence>
                  {showConfetti && Array.from({ length: 50 }, (_, i) => (
                    <Confetti key={i} delay={i * 0.05} />
                  ))}
                </AnimatePresence>

                {/* Lottery Wheel */}
                <motion.div
                  className="mx-auto w-32 h-32 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center mb-6"
                  animate={isDrawing ? { rotate: 360 } : {}}
                  transition={isDrawing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}
                  data-testid="lottery-wheel"
                >
                  <Gift className="text-primary-foreground text-4xl" />
                </motion.div>

                {/* Draw Button */}
                <Button
                  onClick={startLottery}
                  disabled={!canDraw}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-8 text-lg shadow-lg"
                  data-testid="button-start-draw"
                >
                  {availableParticipants.length === 0 && participants.length > 0 && preventDuplicates ? (
                    "모든 참가자가 당첨됨"
                  ) : (
                    <>
                      <Play className="mr-2" />
                      추첨 시작
                    </>
                  )}
                </Button>

                {/* Drawing Status */}
                <AnimatePresence>
                  {isDrawing && (
                    <motion.div
                      className="mt-4 flex items-center justify-center space-x-2 text-primary"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      data-testid="drawing-status"
                    >
                      <motion.div
                        className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="font-medium">추첨 중...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Winner Announcement */}
                <AnimatePresence>
                  {winner && (
                    <motion.div
                      className="mt-6"
                      initial={{ scale: 0, rotate: -360, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      data-testid="winner-announcement"
                    >
                      <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-xl p-6 mb-4">
                        <h3 className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mb-2 flex items-center justify-center">
                          <Trophy className="mr-2" />
                          🎉 축하합니다! 🎉
                        </h3>
                        <div className="text-3xl font-bold text-primary mb-2" data-testid="winner-name">
                          {winner}
                        </div>
                        {selectedGift !== "all" && (
                          <div className="text-xl font-semibold text-secondary-foreground mb-2" data-testid="selected-gift">
                            🎁 {selectedGift}
                          </div>
                        )}
                        <p className="text-muted-foreground">
                          축하드립니다! 선물을 받아가세요!
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                          onClick={drawAgain}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          data-testid="button-draw-again"
                        >
                          <RotateCcw className="mr-2" />
                          다시 추첨
                        </Button>
                        <Button
                          onClick={newDraw}
                          variant="secondary"
                          data-testid="button-new-draw"
                        >
                          <Plus className="mr-2" />
                          새 추첨
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Draw History */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                <History className="mr-2 text-primary" />
                추첨 기록
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending || drawHistory.length === 0}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-clear-history"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                기록 삭제
              </Button>
            </div>
            
            <div className="space-y-3" data-testid="history-list">
              {historyLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>기록을 불러오는 중...</p>
                </div>
              ) : drawHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="text-2xl mb-2 mx-auto" />
                  <p>아직 추첨 기록이 없습니다.</p>
                  <p className="text-sm">첫 번째 추첨을 시작해보세요!</p>
                </div>
              ) : (
                drawHistory.map((record, index) => (
                  <motion.div
                    key={record.id}
                    className="bg-muted rounded-lg p-4 border border-border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    data-testid={`history-item-${record.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <Trophy className="text-primary-foreground text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-card-foreground" data-testid={`winner-${record.id}`}>
                            {record.winner}
                          </div>
                          {record.gift && (
                            <div className="text-sm font-medium text-primary" data-testid={`gift-${record.id}`}>
                              🎁 {record.gift}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground" data-testid={`timestamp-${record.id}`}>
                            {new Date(record.timestamp).toLocaleString('ko-KR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`participants-count-${record.id}`}>
                        {record.totalParticipants}명 중 선정
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground text-sm flex items-center justify-center">
            <Shield className="mr-1 h-4 w-4" />
            공정한 추첨을 위해 JavaScript Math.random() 함수를 사용합니다
          </p>
        </div>
      </footer>
    </div>
  );
}
