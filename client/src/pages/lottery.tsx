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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-navy-800/80 to-purple-800/80 backdrop-blur-sm border-b border-purple-500/20 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4 flex items-center justify-center">
              <Gift className="mr-4 text-pink-400" size={48} />
              선물 추첨 앱
            </h1>
            <p className="text-purple-200 text-xl font-medium">✨ 공정하고 재미있는 랜덤 추첨을 경험해보세요! ✨</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Participant Input */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm border-purple-200 shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <Users className="mr-3 text-pink-500" size={28} />
                참가자 명단
              </h2>
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  {participants.length}명
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearParticipants}
                  className="text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full"
                  data-testid="button-clear-participants"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-6">
              <Textarea
                placeholder="참가자 이름을 쉼표로 구분해서 입력해주세요.&#10;예시: 김철수, 이영희, 박민수, 최지훈, 정수연"
                className="h-40 resize-none bg-gray-50 border-purple-200 text-gray-800 placeholder:text-gray-500 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl"
                value={participantsText}
                onChange={(e) => setParticipantsText(e.target.value)}
                data-testid="textarea-participants"
              />
              
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="prevent-duplicates"
                    checked={preventDuplicates}
                    onCheckedChange={(checked) => setPreventDuplicates(!!checked)}
                    data-testid="checkbox-prevent-duplicates"
                    className="border-purple-400 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-purple-600"
                  />
                  <label htmlFor="prevent-duplicates" className="text-gray-700 font-medium flex items-center space-x-2">
                    <span>중복 당첨 방지</span>
                    <Info className="h-4 w-4 text-pink-500" />
                  </label>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shuffleParticipants}
                  disabled={participants.length < 2}
                  className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-full font-semibold"
                  data-testid="button-shuffle"
                >
                  <Shuffle className="h-5 w-5 mr-2" />
                  명단 섞기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gift Management */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm border-purple-200 shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
                <Gift className="mr-3 text-purple-500" size={28} />
                선물 목록
              </h2>
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  {gifts.length}개
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearGifts}
                  className="text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full"
                  data-testid="button-clear-gifts"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-6">
              <Textarea
                placeholder="선물 이름을 쉼표로 구분해서 입력해주세요.&#10;예시: 아이폰 15, 에어팟 프로, 스타벅스 기프티콘, 도서상품권, 치킨 쿠폰"
                className="h-32 resize-none bg-gray-50 border-purple-200 text-gray-800 placeholder:text-gray-500 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl"
                value={giftsText}
                onChange={(e) => setGiftsText(e.target.value)}
                data-testid="textarea-gifts"
              />
              
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <label className="text-gray-700 font-semibold mb-3 block">
                    🎁 추첨할 선물 선택 (선택사항)
                  </label>
                  <Select value={selectedGift} onValueChange={setSelectedGift}>
                    <SelectTrigger data-testid="select-gift" className="bg-gray-50 border-purple-200 text-gray-800 focus:border-pink-400 rounded-xl">
                      <SelectValue placeholder="선물을 선택하세요 (전체 추첨시 비워두세요)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-purple-200">
                      <SelectItem value="all" className="text-gray-800 focus:bg-purple-50">전체 선물 (랜덤)</SelectItem>
                      {gifts.map((gift) => (
                        <SelectItem key={gift} value={gift} className="text-gray-800 focus:bg-purple-50">
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
                  className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-full font-semibold self-end"
                  data-testid="button-shuffle-gifts"
                >
                  <Shuffle className="h-5 w-5 mr-2" />
                  선물 섞기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lottery Draw */}
        <Card className="mb-8 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border-purple-500/30 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="space-y-8">
              <div className="relative">
                {/* Confetti */}
                <AnimatePresence>
                  {showConfetti && Array.from({ length: 50 }, (_, i) => (
                    <Confetti key={i} delay={i * 0.05} />
                  ))}
                </AnimatePresence>

                {/* Lottery Wheel */}
                <motion.div
                  className="mx-auto w-40 h-40 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center mb-8 shadow-2xl"
                  animate={isDrawing ? { rotate: 360 } : {}}
                  transition={isDrawing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}
                  data-testid="lottery-wheel"
                >
                  <Gift className="text-white text-5xl drop-shadow-lg" />
                </motion.div>

                {/* Draw Button */}
                <Button
                  onClick={startLottery}
                  disabled={!canDraw}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-6 px-12 text-xl shadow-2xl rounded-full transform hover:scale-105 transition-all duration-200"
                  data-testid="button-start-draw"
                >
                  {availableParticipants.length === 0 && participants.length > 0 && preventDuplicates ? (
                    "모든 참가자가 당첨됨"
                  ) : (
                    <>
                      <Play className="mr-3" size={24} />
                      ✨ 추첨 시작 ✨
                    </>
                  )}
                </Button>

                {/* Drawing Status */}
                <AnimatePresence>
                  {isDrawing && (
                    <motion.div
                      className="mt-6 flex items-center justify-center space-x-3 text-pink-300"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      data-testid="drawing-status"
                    >
                      <motion.div
                        className="w-8 h-8 border-3 border-pink-400 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="font-bold text-lg">🎲 추첨 중... 🎲</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Winner Announcement */}
                <AnimatePresence>
                  {winner && (
                    <motion.div
                      className="mt-8"
                      initial={{ scale: 0, rotate: -360, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      data-testid="winner-announcement"
                    >
                      <div className="bg-gradient-to-r from-yellow-400/20 to-pink-400/20 backdrop-blur-sm border-2 border-yellow-400/50 rounded-2xl p-8 mb-6 shadow-2xl">
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent mb-4 flex items-center justify-center">
                          <Trophy className="mr-3 text-yellow-400" size={32} />
                          🎉 축하합니다! 🎉
                        </h3>
                        <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-3" data-testid="winner-name">
                          {winner}
                        </div>
                        {selectedGift !== "all" && (
                          <div className="text-2xl font-bold text-yellow-300 mb-3" data-testid="selected-gift">
                            🎁 {selectedGift}
                          </div>
                        )}
                        <p className="text-purple-200 text-lg font-medium">
                          ✨ 축하드립니다! 선물을 받아가세요! ✨
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                          onClick={drawAgain}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-full shadow-lg"
                          data-testid="button-draw-again"
                        >
                          <RotateCcw className="mr-2" />
                          다시 추첨
                        </Button>
                        <Button
                          onClick={newDraw}
                          className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold py-3 px-6 rounded-full shadow-lg"
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
        <Card className="bg-white/95 backdrop-blur-sm border-purple-200 shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <History className="mr-3 text-indigo-500" size={28} />
                추첨 기록
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending || drawHistory.length === 0}
                className="text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full font-semibold"
                data-testid="button-clear-history"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                기록 삭제
              </Button>
            </div>
            
            <div className="space-y-4" data-testid="history-list">
              {historyLoading ? (
                <div className="text-center py-12 text-gray-600">
                  <div className="animate-spin w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-lg font-medium">기록을 불러오는 중...</p>
                </div>
              ) : drawHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <Clock className="text-4xl mb-4 mx-auto text-purple-400" />
                  <p className="text-lg font-medium">아직 추첨 기록이 없습니다.</p>
                  <p className="text-purple-500">첫 번째 추첨을 시작해보세요! ✨</p>
                </div>
              ) : (
                drawHistory.map((record, index) => (
                  <motion.div
                    key={record.id}
                    className="bg-gray-50 rounded-xl p-6 border border-purple-200 shadow-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    data-testid={`history-item-${record.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <Trophy className="text-white text-lg" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 text-lg" data-testid={`winner-${record.id}`}>
                            {record.winner}
                          </div>
                          {record.gift && (
                            <div className="text-pink-600 font-semibold" data-testid={`gift-${record.id}`}>
                              🎁 {record.gift}
                            </div>
                          )}
                          <div className="text-gray-500 text-sm" data-testid={`timestamp-${record.id}`}>
                            {new Date(record.timestamp).toLocaleString('ko-KR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-600 font-medium" data-testid={`participants-count-${record.id}`}>
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
      <footer className="bg-gradient-to-r from-slate-900/80 to-purple-900/80 backdrop-blur-sm border-t border-purple-500/20 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p className="text-purple-300 font-medium flex items-center justify-center">
            <Shield className="mr-2 h-5 w-5 text-pink-400" />
            ⚡ 공정한 추첨을 위해 JavaScript Math.random() 함수를 사용합니다 ⚡
          </p>
        </div>
      </footer>
    </div>
  );
}
