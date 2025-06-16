
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, ShieldCheck, ShieldAlert, Users, MessageSquare, Crown, Swords, SendHorizontal, Check, X, Settings, Shield, Lock, Unlock, RefreshCcw, Play, Eye, ChevronUp, ChevronDown, UserPlus, UserX, ThumbsUp, ThumbsDown, CircleDot, Circle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

type GamePhase = 'loading' | 'lobby_setup' | 'role_reveal' | 'team_selection' | 'team_voting' | 'mission_play' | 'assassination' | 'game_over';
type AvalonRole = 'Merlin' | 'Percival' | 'Loyal Servant of Arthur' | 'Morgana' | 'Assassin' | 'Mordred' | 'Oberon' | 'Minion of Mordred' | 'Unknown';

interface RoleDetail {
  name: AvalonRole;
  alignment: 'Good' | 'Evil';
  isActiveRole: boolean;
  description: string;
  longDescription?: string;
}

const ROLES_DATA: Record<AvalonRole, RoleDetail> = {
  'Merlin': { name: 'Merlin', alignment: 'Good', isActiveRole: true, description: "Sees Evil (except Mordred)", longDescription: "You are Merlin! You know who is Evil, but they must not discover you. Mordred is hidden from your sight." },
  'Percival': { name: 'Percival', alignment: 'Good', isActiveRole: true, description: "Sees Merlin & Morgana", longDescription: "You are Percival! You see Merlin and Morgana, but do not know which is which." },
  'Loyal Servant of Arthur': { name: 'Loyal Servant of Arthur', alignment: 'Good', isActiveRole: false, description: "Servant of Good", longDescription: "You are a Loyal Servant of Arthur. Uphold the light and identify your allies!" },
  'Morgana': { name: 'Morgana', alignment: 'Evil', isActiveRole: true, description: "Appears as Merlin to Percival", longDescription: "You are Morgana! You appear as Merlin to Percival. Deceive him to protect your Evil comrades." },
  'Assassin': { name: 'Assassin', alignment: 'Evil', isActiveRole: true, description: "Can assassinate Merlin", longDescription: "You are the Assassin! If Good wins 3 quests, you have one chance to identify and assassinate Merlin to seize victory for Evil." },
  'Mordred': { name: 'Mordred', alignment: 'Evil', isActiveRole: true, description: "Unknown to Merlin", longDescription: "You are Mordred! Merlin does not know your identity. Lead the forces of Evil from the shadows." },
  'Oberon': { name: 'Oberon', alignment: 'Evil', isActiveRole: true, description: "Unknown to other Evil", longDescription: "You are Oberon! You are Evil, but do not know your fellow Minions of Mordred, and they do not know you." },
  'Minion of Mordred': { name: 'Minion of Mordred', alignment: 'Evil', isActiveRole: false, description: "Servant of Evil", longDescription: "You are a Minion of Mordred. Work with your allies to sabotage quests and ensure Evil prevails!" },
  'Unknown': { name: 'Unknown', alignment: 'Good', isActiveRole: false, description: "Role not yet assigned", longDescription: "Your destiny will soon be revealed." }
};


interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: AvalonRole;
  isMuted?: boolean;
  isCurrentLeader?: boolean;
  isOnline?: boolean;
  isBot?: boolean;
}

const initialPlayersSetup = (playerId: string, playerName: string): { players: Player[], spectators: Player[] } => {
  const humanPlayer: Player = { id: playerId, name: playerName, avatarUrl: `https://placehold.co/40x40.png`, isOnline: true, role: 'Unknown', isBot: false };
  const botSpectators: Player[] = [
    { id: 'bot-alice', name: 'Bot Alice', avatarUrl: `https://placehold.co/40x40.png`, isOnline: true, role: 'Unknown', isBot: true, "data-ai-hint": "female robot" },
    { id: 'bot-bob', name: 'Bot Bob', avatarUrl: `https://placehold.co/40x40.png`, isOnline: true, role: 'Unknown', isBot: true, "data-ai-hint": "male robot" },
    { id: 'bot-charlie', name: 'Bot Charlie', avatarUrl: `https://placehold.co/40x40.png`, isOnline: true, role: 'Unknown', isBot: true, "data-ai-hint": "neutral robot" },
    { id: 'bot-dave', name: 'Bot Dave', avatarUrl: `https://placehold.co/40x40.png`, isOnline: true, role: 'Unknown', isBot: true, "data-ai-hint": "cool robot" },
  ];
  return { players: [humanPlayer], spectators: botSpectators };
};


interface Mission {
  id: number;
  status: 'pending' | 'team_selection' | 'voting' | 'in_progress' | 'success' | 'fail';
  requiredPlayers: number;
  failsRequired: number;
  team?: string[];
  votes?: Record<string, 'approve' | 'reject'>;
  results?: Record<string, 'success' | 'fail'>;
}

const initialMissions: Mission[] = [
    { id: 1, status: 'pending', requiredPlayers: 2, failsRequired: 1, votes: {}, results: {} },
    { id: 2, status: 'pending', requiredPlayers: 3, failsRequired: 1, votes: {}, results: {} },
    { id: 3, status: 'pending', requiredPlayers: 2, failsRequired: 1, votes: {}, results: {} },
    { id: 4, status: 'pending', requiredPlayers: 3, failsRequired: 1, votes: {}, results: {} },
    { id: 5, status: 'pending', requiredPlayers: 3, failsRequired: 1, votes: {}, results: {} },
];


interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const gameId = params.gameId as string;

  const [isMounted, setIsMounted] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  const [gameTitle, setGameTitle] = useState<string>('Loading game...');
  const [players, setPlayers] = useState<Player[]>([]);
  const [spectators, setSpectators] = useState<Player[]>([]);
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);

  const [goodScore, setGoodScore] = useState(0);
  const [evilScore, setEvilScore] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('loading');

  const [playerRoleDisplay, setPlayerRoleDisplay] = useState<string>('Unknown');
  const [isRoleRevealModalOpen, setIsRoleRevealModalOpen] = useState(false);
  const [revealedRoleDetails, setRevealedRoleDetails] = useState<RoleDetail | null>(null);
  const [seenPlayerIds, setSeenPlayerIds] = useState<Record<string, 'evil' | 'merlin_morgana_ambiguous'>>({});

  const [isLobbyLocked, setIsLobbyLocked] = useState<boolean>(true);
  const [isSpectatorsPanelOpen, setIsSpectatorsPanelOpen] = useState(true);
  const [currentLeaderId, setCurrentLeaderId] = useState<string | null>(null);

  const [isProposingTeam, setIsProposingTeam] = useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<Player[]>([]);

  const [playerVotes, setPlayerVotes] = useState<Record<string, 'approve' | 'reject'>>({});
  const [playerHasVotedOnTeam, setPlayerHasVotedOnTeam] = useState<Record<string, boolean>>({});
  const [consecutiveRejections, setConsecutiveRejections] = useState(0);
  const [missionPlays, setMissionPlays] = useState<Record<string, 'success' | 'fail'>>({});
  const [playerHasPlayedMissionCard, setPlayerHasPlayedMissionCard] = useState<Record<string,boolean>>({});

  useEffect(() => {
    setIsMounted(true);
    const name = localStorage.getItem('playerName');
    if (!name) {
      router.push('/');
    } else {
      setPlayerName(name);
      const id = name.toLowerCase().replace(/\s+/g, '-');
      setPlayerId(id);

      setGameTitle(`Avalon Game (ID: ${gameId.substring(0,6)})`);

      const { players: initialP, spectators: initialS } = initialPlayersSetup(id, name);
      setPlayers(initialP); 
      setSpectators(initialS);
      resetGameProgress(id, initialP, initialS); 
      setGamePhase('lobby_setup'); 


      toast({
        title: "Welcome to the Lobby!",
        description: `You are ${name}. Manage the lobby and start the game when ready. Add bots from spectators to start.`,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, gameId]);

  useEffect(() => {
    if (chatScrollAreaRef.current) {
      chatScrollAreaRef.current.scrollTo({ top: chatScrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages]);


  const resetGameProgress = (leaderPId: string | null, currentPlayers: Player[], currentSpectators: Player[]) => {
    setGoodScore(0);
    setEvilScore(0);
    const resetMissionsList = initialMissions.map(m => ({ ...m, status: 'pending' as Mission['status'], team: [], votes: {}, results: {} }));
    setMissions(resetMissionsList);
    setGamePhase('lobby_setup');
    
    setPlayers(currentPlayers.map(p => ({
        ...p, 
        role: 'Unknown', 
        isCurrentLeader: p.id === leaderPId
    })));
    setSpectators(currentSpectators.map(s => ({ ...s, role: 'Unknown' }))); // Ensure spectators also have roles reset conceptually

    if (leaderPId) {
        setCurrentLeaderId(leaderPId);
    }
    
    setPlayerRoleDisplay('Unknown');
    setRevealedRoleDetails(null);
    setSeenPlayerIds({});
    setIsProposingTeam(false);
    setSelectedTeam([]);
    setPlayerVotes({});
    setPlayerHasVotedOnTeam({});
    setConsecutiveRejections(0);
    setMissionPlays({});
    setPlayerHasPlayedMissionCard({});
    setIsLobbyLocked(true); 
  };


  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && playerName && playerId) {
      const newMessage: ChatMessage = {
        id: String(Date.now()),
        senderId: playerId,
        senderName: playerName,
        text: chatInput.trim(),
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');
    }
  };

  const handleProposeTeamClick = () => {
    const currentLeaderPlayer = players.find(p => p.id === currentLeaderId);
    if (currentLeaderPlayer?.id === playerId && gamePhase === 'team_selection') {
      setIsProposingTeam(true);
      setSelectedTeam([]);
      toast({
        title: "Team Selection Started",
        description: "Click on players from the list to add them to the quest team.",
      });
    } else if (currentLeaderPlayer?.id !== playerId) {
         toast({
            title: "Not Your Turn",
            description: "Only the current quest leader can propose a team.",
            variant: "destructive"
        });
    }
  };

  const handlePlayerClickForTeamSelection = (player: Player) => {
    if (!isProposingTeam || playerId !== currentLeaderId) return;

    const currentMissionDetails = missions.find(m => m.status === 'team_selection');
    if (!currentMissionDetails) return;

    const isPlayerSelected = selectedTeam.find(p => p.id === player.id);

    if (isPlayerSelected) {
      setSelectedTeam(prevTeam => prevTeam.filter(p => p.id !== player.id));
    } else {
      if (selectedTeam.length < currentMissionDetails.requiredPlayers) {
        setSelectedTeam(prevTeam => [...prevTeam, player]);
      } else {
        toast({
          title: "Team Full",
          description: `You can only select ${currentMissionDetails.requiredPlayers} players for this quest.`,
          variant: "destructive",
        });
      }
    }
  };

  const handleConfirmTeamProposal = () => {
    const currentMissionDetails = missions.find(m => m.status === 'team_selection');
    if (!currentMissionDetails || selectedTeam.length !== currentMissionDetails.requiredPlayers) {
      toast({
        title: "Team Incomplete",
        description: `Please select exactly ${currentMissionDetails.requiredPlayers} players for the quest.`,
        variant: "destructive",
      });
      return;
    }

    const updatedMissions = missions.map(m =>
      m.id === currentMissionDetails.id
        ? { ...m, team: selectedTeam.map(p => p.id), status: 'team_voting' as const, votes: {} }
        : m
    );
    setMissions(updatedMissions);
    setGamePhase('team_voting');
    setIsProposingTeam(false);
    setPlayerVotes({});
    setPlayerHasVotedOnTeam({});

    toast({
      title: "Team Proposed!",
      description: "The proposed team will now be put to a vote.",
    });
  };

  const handleVote = (vote: 'approve' | 'reject') => {
    if (!playerId || playerHasVotedOnTeam[playerId] || playerId === currentLeaderId) {
        toast({ title: "Cannot Vote", description: playerId === currentLeaderId ? "Leader does not vote on teams." : "You have already voted.", variant: "destructive" });
        return;
    }

    const currentMissionIdx = missions.findIndex(m => m.status === 'team_voting');
    if (currentMissionIdx === -1) return;

    const newPlayerVotes = { ...playerVotes, [playerId]: vote };
    setPlayerVotes(newPlayerVotes);
    setPlayerHasVotedOnTeam(prev => ({ ...prev, [playerId]: true }));

    const botPlayers = players.filter(p => p.isBot && p.id !== currentLeaderId);
    let allVotes = { ...newPlayerVotes };

    // Simulate bot votes - FOR TESTING: ALL BOTS APPROVE
    botPlayers.forEach(bot => {
        if (!allVotes[bot.id]) { 
            allVotes[bot.id] = 'approve'; 
        }
    });
    setPlayerVotes(allVotes); 

    const totalPlayersEligibleToVote = players.filter(p => p.id !== currentLeaderId).length;

    if (Object.keys(allVotes).length >= totalPlayersEligibleToVote) {
        processVoteResults(allVotes, currentMissionIdx);
    }
  };

  const processVoteResults = (votes: Record<string, 'approve' | 'reject'>, missionIdx: number) => {
    let approveVotes = 0;
    let rejectVotes = 0;
    Object.values(votes).forEach(v => {
        if (v === 'approve') approveVotes++;
        else rejectVotes++;
    });

    const updatedMissions = [...missions];
    updatedMissions[missionIdx].votes = votes;

    if (approveVotes > rejectVotes) {
        toast({ title: "Team Approved!", description: `The quest will now begin. (${approveVotes} For, ${rejectVotes} Against)` });
        updatedMissions[missionIdx].status = 'in_progress';
        setMissions(updatedMissions);
        setGamePhase('mission_play');
        setConsecutiveRejections(0); 
        setPlayerHasPlayedMissionCard({});
        setMissionPlays({});
    } else {
        const newConsecutiveRejections = consecutiveRejections + 1;
        setConsecutiveRejections(newConsecutiveRejections);
        toast({ title: "Team Rejected!", description: `Leadership passes. (${approveVotes} For, ${rejectVotes} Against). Rejection ${newConsecutiveRejections} of 4.` });

        if (newConsecutiveRejections >= 4) {
            toast({ title: "Evil Wins!", description: "Four consecutive teams were rejected.", variant: "destructive" });
            setEvilScore(prev => Math.min(3, prev + 3));  // Cap at 3 points for evil
            setGamePhase('game_over');
        } else {
            updatedMissions[missionIdx].status = 'team_selection';
            updatedMissions[missionIdx].team = []; 
            setMissions(updatedMissions);
            setGamePhase('team_selection');
            passLeadership();
        }
    }
    setPlayerVotes({}); 
    setPlayerHasVotedOnTeam({});
    setSelectedTeam([]); 
  };

  const handlePlayMissionCard = (card: 'success' | 'fail') => {
    if (!playerId || playerHasPlayedMissionCard[playerId]) {
        toast({ title: "Cannot Play Card", description: "You have already played a card for this mission.", variant: "destructive" });
        return;
    }

    const currentMissionDetails = missions.find(m => m.status === 'in_progress');
    if (!currentMissionDetails || !currentMissionDetails.team?.includes(playerId)) {
        toast({ title: "Not on Mission", description: "You are not part of the current quest team.", variant: "destructive" });
        return;
    }

    const player = players.find(p => p.id === playerId);
    if (player?.role && ROLES_DATA[player.role].alignment === 'Good' && card === 'fail') {
        toast({ title: "Invalid Play", description: "As a Good player, you must play 'Success'.", variant: "destructive" });
        return;
    }

    const newMissionPlays = { ...missionPlays, [playerId]: card };
    setMissionPlays(newMissionPlays);
    setPlayerHasPlayedMissionCard(prev => ({ ...prev, [playerId]: true }));

    let allPlays = { ...newMissionPlays };
    const teamMemberBots = players.filter(p => p.isBot && currentMissionDetails.team?.includes(p.id));

    teamMemberBots.forEach(bot => {
        if (!allPlays[bot.id]) { 
            const botRoleDetails = bot.role ? ROLES_DATA[bot.role] : null;
            if (botRoleDetails?.alignment === 'Good') {
                allPlays[bot.id] = 'success';
            } else {
                allPlays[bot.id] = 'fail';
            }
        }
    });
    setMissionPlays(allPlays); 

    if (currentMissionDetails.team && Object.keys(allPlays).length === currentMissionDetails.team.length) {
        processMissionResults(allPlays, currentMissionDetails.id);
    }
  };

  const processMissionResults = (plays: Record<string, 'success' | 'fail'>, missionId: number) => {
    const currentMissionIdx = missions.findIndex(m => m.id === missionId);
    if (currentMissionIdx === -1) return;

    const missionDetails = missions[currentMissionIdx];
    const failCount = Object.values(plays).filter(p => p === 'fail').length;

    const updatedMissions = [...missions];
    updatedMissions[currentMissionIdx].results = plays;

    let newGoodScore = goodScore;
    let newEvilScore = evilScore;

    if (failCount >= missionDetails.failsRequired) {
        updatedMissions[currentMissionIdx].status = 'fail';
        newEvilScore = Math.min(3, evilScore + 1);
        setEvilScore(newEvilScore);
        toast({ title: `Mission ${missionDetails.id} Failed!`, description: `${failCount} fail card(s) played.` });
    } else {
        updatedMissions[currentMissionIdx].status = 'success';
        newGoodScore = Math.min(3, goodScore + 1);
        setGoodScore(newGoodScore);
        toast({ title: `Mission ${missionDetails.id} Succeeded!`, description: `${failCount} fail card(s) played.` });
    }
    setMissions(updatedMissions);

    if (newGoodScore >= 3) {
        toast({ title: "Good Wins 3 Quests!", description: "The Assassin now has a chance to strike!" });
        setGamePhase('assassination'); 
    } else if (newEvilScore >= 3) {
        toast({ title: "Evil Wins 3 Quests!", description: "The forces of Mordred are victorious!", variant: "destructive" });
        setGamePhase('game_over');
    } else {
        passLeadership();
        const missionsAfterCurrentComplete = updatedMissions.map(m => m.id === missionId ? updatedMissions[currentMissionIdx] : m);
        const nextMissionIdx = missionsAfterCurrentComplete.findIndex(m => m.status === 'pending');

        if (nextMissionIdx !== -1) {
             const newMissionsForNextRound = missionsAfterCurrentComplete.map((m, idx) =>
                idx === nextMissionIdx ? { ...m, status: 'team_selection' as const, team:[], votes: {}, results: {} } : m
            );
            setMissions(newMissionsForNextRound);
            setGamePhase('team_selection');
            setSelectedTeam([]);
            setPlayerVotes({});
            setPlayerHasVotedOnTeam({});
            setMissionPlays({});
            setPlayerHasPlayedMissionCard({});
        } else {
             toast({title: "Game State Error", description: "No pending missions, but game not decided by score.", variant:"destructive"});
             setGamePhase('game_over'); 
        }
    }
  };

  const passLeadership = () => {
    if (players.length === 0) return;
    const currentLeaderIndex = players.findIndex(p => p.id === currentLeaderId);
    const nextLeaderIndex = (currentLeaderIndex + 1) % players.length;
    const nextLeader = players[nextLeaderIndex];
    setCurrentLeaderId(nextLeader.id);
    setPlayers(prevPlayers => prevPlayers.map((p, idx) => ({
        ...p,
        isCurrentLeader: idx === nextLeaderIndex
    })));
  };


  const handleToggleLobbyLock = () => {
    if (playerId === currentLeaderId) {
        setIsLobbyLocked(!isLobbyLocked);
        toast({
            title: `Lobby ${!isLobbyLocked ? 'Unlocked' : 'Locked'}`,
            description: `Players can ${!isLobbyLocked ? 'now join from spectators' : 'no longer join from spectators'}.`,
        });
    }
  };

  const handleRefreshLobby = () => {
    if (playerName && playerId) {
        resetGameProgress(playerId, players, spectators); 
        toast({
            title: "Game Progress Refreshed",
            description: "Game scores, missions, and roles have been reset. Current players and spectators remain.",
        });
    }
  };

const assignRoles = (currentPlayers: Player[]): Player[] => {
    const numPlayers = currentPlayers.length;
    let rolesToAssign: AvalonRole[];

    if (numPlayers === 5) {
        rolesToAssign = ['Merlin', 'Percival', 'Loyal Servant of Arthur', 'Morgana', 'Assassin'];
    } else {
        toast({
            title: "Role Assignment Error",
            description: `Cannot assign roles for ${numPlayers} players. Standard setup is for 5.`,
            variant: "destructive"
        });
        return currentPlayers.map(p => ({...p, role: 'Unknown'}));
    }

    const shuffledRoles = [...rolesToAssign].sort(() => Math.random() - 0.5);

    return currentPlayers.map((player, index) => ({
        ...player,
        role: shuffledRoles[index % shuffledRoles.length] || 'Unknown',
    }));
};


  const handleStartGame = () => {
    if (playerId === currentLeaderId) {
        if (players.length !== 5) {
            toast({
                title: "Incorrect Number of Players",
                description: `You need exactly 5 players to start with the standard Avalon roles. Currently: ${players.length}. Please add bots from spectators.`,
                variant: "destructive",
            });
            return;
        }

        const playersWithRoles = assignRoles(players);
        setPlayers(playersWithRoles);

        const currentPlayerAssigned = playersWithRoles.find(p => p.id === playerId);
        if (currentPlayerAssigned && currentPlayerAssigned.role && currentPlayerAssigned.role !== 'Unknown') {
            setRevealedRoleDetails(ROLES_DATA[currentPlayerAssigned.role]);
        } else {
            setRevealedRoleDetails(ROLES_DATA['Unknown']); 
        }

        setGamePhase('role_reveal');
        setIsRoleRevealModalOpen(true);
        setIsLobbyLocked(true); 
        setIsProposingTeam(false);
        setSelectedTeam([]);
        setConsecutiveRejections(0); 

        toast({
            title: "Game Starting!",
            description: "Roles are being assigned. Check your role!",
        });
    }
  };

  const handleConfirmRole = () => {
    setIsRoleRevealModalOpen(false);
    const currentRoleDetails = revealedRoleDetails;
    if (currentRoleDetails) {
        const display = currentRoleDetails.isActiveRole ? currentRoleDetails.name : currentRoleDetails.alignment;
        setPlayerRoleDisplay(display);

        const newSeenPlayerIds: Record<string, 'evil' | 'merlin_morgana_ambiguous'> = {};
        const myRoleName = currentRoleDetails.name;
        const myAlignment = currentRoleDetails.alignment;

        const allPlayers = players; 

        if (myRoleName === 'Merlin') {
            allPlayers.forEach(p => {
                if (p.id !== playerId && p.role && ROLES_DATA[p.role]) { 
                    const targetRoleDetails = ROLES_DATA[p.role];
                    if (targetRoleDetails.alignment === 'Evil' && p.role !== 'Mordred') { 
                        newSeenPlayerIds[p.id] = 'evil';
                    }
                }
            });
        } else if (myRoleName === 'Percival') {
            allPlayers.forEach(p => {
                if (p.id !== playerId && (p.role === 'Merlin' || p.role === 'Morgana')) {
                    newSeenPlayerIds[p.id] = 'merlin_morgana_ambiguous';
                }
            });
        } else if (myAlignment === 'Evil' && myRoleName !== 'Oberon') { 
            allPlayers.forEach(p => {
                if (p.id !== playerId && p.role && ROLES_DATA[p.role]) {
                     const targetRoleDetails = ROLES_DATA[p.role];
                    if (targetRoleDetails.alignment === 'Evil' && p.role !== 'Oberon') { 
                        newSeenPlayerIds[p.id] = 'evil';
                    }
                }
            });
        }
        setSeenPlayerIds(newSeenPlayerIds);

        setTimeout(() => {
            setSeenPlayerIds({});
        }, 10000); 
    }

    setGamePhase('team_selection');
    const newMissions = missions.map((m, index) => ({
        ...m,
        status: index === 0 ? ('team_selection' as const) : ('pending' as const), 
        team: [], votes: {}, results: {} 
    }));
    setMissions(newMissions);
     toast({
        title: "Roles Confirmed!",
        description: "Your vision (if any) is active for 10 seconds. Proceed to team selection.",
    });
  };

  const handleJoinAsPlayer = (spectatorId: string) => {
    if (gamePhase !== 'lobby_setup') {
        toast({ title: "Game in Progress", description: "Cannot join as player once the game has started.", variant: "destructive"});
        return;
    }
    if (isLobbyLocked && playerId !== currentLeaderId) { 
         toast({
            title: "Lobby Locked",
            description: "The leader needs to unlock the lobby to allow spectators to join as players.",
            variant: "destructive",
        });
        return;
    }
    const spectatorToMove = spectators.find(s => s.id === spectatorId);
    if (spectatorToMove) {
        if (players.length >= 10) { 
            toast({ title: "Lobby Full", description: "Maximum number of players reached.", variant: "destructive"});
            return;
        }
        setPlayers(prev => [...prev, { ...spectatorToMove, role: 'Unknown' }]);
        setSpectators(prev => prev.filter(s => s.id !== spectatorId));
        toast({
            title: `${spectatorToMove.name} Joined Game`,
            description: "They are now an active player.",
        });
    }
  };


  const currentMission = missions.find(m => m.status === 'team_selection' || m.status === 'team_voting' || m.status === 'in_progress');
  const currentLeader = players.find(p => p.id === currentLeaderId);

  if (!isMounted || !playerName || !playerId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Swords className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading game session...</p>
      </div>
    );
  }

  const getPlayerInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length -1]) {
      return (parts[0][0] + parts[parts.length -1][0]).toUpperCase();
    }
    return name.substring(0,2).toUpperCase();
  };

  return (
    <TooltipProvider delayDuration={100}>
    <div className="flex h-screen max-h-screen flex-col bg-background text-foreground selection:bg-primary/40 selection:text-primary-foreground">
      <header className="flex items-center justify-between p-3 border-b border-border/60 bg-card shadow-sm h-16 shrink-0">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push('/lobby')} className="hover:bg-accent/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-primary flex items-center">
              <Swords className="mr-2 h-6 w-6" /> {gameTitle}
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Role: <strong className={`font-semibold ${revealedRoleDetails?.alignment === 'Good' ? 'text-blue-400' : revealedRoleDetails?.alignment === 'Evil' ? 'text-red-400' : 'text-accent'}`}>{playerRoleDisplay}</strong></span>
            {gamePhase === 'lobby_setup' && playerId === currentLeaderId && (
                <Button onClick={handleToggleLobbyLock} variant="outline" size="sm">
                    {isLobbyLocked ? <Unlock className="mr-1.5 h-4 w-4" /> : <Lock className="mr-1.5 h-4 w-4" />}
                    {isLobbyLocked ? 'Unlock' : 'Lock'}
                </Button>
            )}
            {playerId === currentLeaderId && (
                <Button onClick={handleRefreshLobby} variant="outline" size="sm">
                    <RefreshCcw className="mr-1.5 h-4 w-4" /> Refresh
                </Button>
            )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[280px] lg:w-[320px] border-r border-border/60 p-4 overflow-y-auto bg-card flex flex-col space-y-5 shrink-0">
           <div className="shrink-0">
                <h2 className="text-lg font-semibold mb-2.5 text-accent flex items-center"><Shield className="mr-2 h-5 w-5" />Game Progress</h2>
                <div className="flex justify-around items-center mb-3 p-3 bg-background/50 rounded-lg shadow-inner">
                    <div className="text-center">
                        <ShieldCheck className="h-8 w-8 text-blue-400 mx-auto mb-1" />
                        <span className="text-2xl font-bold text-blue-400">{goodScore}</span>
                        <p className="text-xs text-muted-foreground">Good Quests</p>
                    </div>
                    <div className="text-center">
                        <ShieldAlert className="h-8 w-8 text-red-400 mx-auto mb-1" />
                        <span className="text-2xl font-bold text-red-400">{evilScore}</span>
                         <p className="text-xs text-muted-foreground">Evil Quests</p>
                    </div>
                </div>
                <div className="space-y-1.5 mb-3">
                    {missions.map(mission => (
                        <div key={mission.id} className={`flex items-center justify-between p-2.5 rounded-md text-sm shadow-sm ${mission.status === 'success' ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50' : mission.status === 'fail' ? 'bg-red-600/30 text-red-200 border border-red-500/50' : 'bg-muted/40 border border-transparent'}`}>
                           <span className="font-medium">Quest {mission.id} ({mission.requiredPlayers}P, {mission.failsRequired}F)</span>
                           {mission.status === 'success' && <ShieldCheck className="h-5 w-5 text-blue-300"/>}
                           {mission.status === 'fail' && <ShieldAlert className="h-5 w-5 text-red-300"/>}
                           {mission.status !== 'success' && mission.status !== 'fail' && <span className="text-xs capitalize px-2 py-0.5 bg-foreground/10 rounded-full">{mission.status.replace('_', ' ')}</span>}
                        </div>
                    ))}
                </div>
                <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1 text-center">Consecutive Team Rejections:</p>
                    <div className="flex justify-center space-x-2">
                        {Array(4).fill(0).map((_, index) => (
                            index < consecutiveRejections
                            ? <CircleDot key={index} className="h-4 w-4 text-destructive" />
                            : <Circle key={index} className="h-4 w-4 text-muted-foreground/50" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-grow flex flex-col min-h-0">
                <h2 className="text-lg font-semibold mb-2.5 text-accent flex items-center"><Users className="mr-2 h-5 w-5" /> Players ({players.length})</h2>
                <ScrollArea className="h-full pr-2">
                <ul className="space-y-2.5">
                {players.map(player => {
                  const highlightType = seenPlayerIds[player.id];
                  let highlightClasses = '';
                  if (highlightType === 'evil') {
                    highlightClasses = 'shadow-[0_0_10px_3px_hsl(var(--destructive))] border-destructive transition-all duration-300';
                  } else if (highlightType === 'merlin_morgana_ambiguous') {
                     highlightClasses = 'shadow-[0_0_10px_3px_hsl(var(--foreground))] border-foreground/70 transition-all duration-300';
                  }

                  if (gamePhase === 'team_voting' && playerId === currentLeaderId && playerVotes[player.id] && player.id !== playerId) {
                      if (playerVotes[player.id] === 'approve') {
                          highlightClasses = 'shadow-[0_0_8px_2px_hsl(120,70%,60%)] border-green-500 transition-all duration-300';
                      } else if (playerVotes[player.id] === 'reject') {
                          highlightClasses = 'shadow-[0_0_8px_2px_hsl(0,70%,60%)] border-red-500 transition-all duration-300';
                      }
                  }

                  const isSelectedForTeam = selectedTeam.find(p => p.id === player.id);
                  const canBeSelected = currentLeader?.id === playerId && isProposingTeam && gamePhase === 'team_selection';

                  return (
                    <li
                      key={player.id}
                      onClick={() => canBeSelected && handlePlayerClickForTeamSelection(player)}
                      className={`
                        flex items-center justify-between p-2.5 rounded-lg shadow-sm transition-all duration-150 group
                        ${player.id === playerId ? 'bg-primary/25 border-primary/50' : 'bg-background/60 border'}
                        ${highlightClasses || 'border-transparent'}
                        ${canBeSelected ? 'cursor-pointer hover:bg-accent/30' : ''}
                        ${isSelectedForTeam && isProposingTeam ? 'opacity-20' : 'opacity-100'}
                      `}
                    >
                      <div className="flex items-center">
                          <Avatar className="h-9 w-9 mr-3 border-2 border-border">
                          <AvatarImage data-ai-hint="knight medieval" src={player.avatarUrl || `https://placehold.co/40x40.png`} alt={player.name} />
                          <AvatarFallback className="bg-muted-foreground/20 text-muted-foreground font-semibold">{getPlayerInitials(player.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                              <span className={`font-semibold text-sm ${player.id === currentLeader?.id ? 'text-amber-400' : 'text-foreground/90'}`}>
                              {player.name}
                              {player.id === currentLeader?.id &&
                                  <Tooltip>
                                      <TooltipTrigger asChild><Crown className="inline ml-1.5 h-4 w-4 text-amber-400" /></TooltipTrigger>
                                      <TooltipContent><p>Current Quest Leader</p></TooltipContent>
                                  </Tooltip>
                              }
                              </span>
                              <span className={`text-xs ${player.isOnline ? 'text-green-400' : 'text-muted-foreground/70'}`}>{player.isOnline ? 'Online' : 'Offline'}</span>
                          </div>
                      </div>
                       {canBeSelected && (
                        <div className={`transition-opacity ${isSelectedForTeam ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isSelectedForTeam ? <UserX className="h-5 w-5 text-destructive" /> : <UserPlus className="h-5 w-5 text-green-400" /> }
                        </div>
                      )}
                    </li>
                  );
                })}
                </ul>
                </ScrollArea>
            </div>

            <div className="shrink-0">
                <div
                  className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity mb-2.5"
                  onClick={() => setIsSpectatorsPanelOpen(!isSpectatorsPanelOpen)}
                >
                  <div className="flex items-center">
                    <Eye className="mr-2 h-5 w-5 text-accent" />
                    <h2 className="text-lg font-semibold text-accent">Spectators ({spectators.length})</h2>
                  </div>
                  {isSpectatorsPanelOpen ? <ChevronDown className="h-5 w-5 text-accent" /> : <ChevronUp className="h-5 w-5 text-accent" />}
                </div>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSpectatorsPanelOpen ? 'max-h-[30vh] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <ScrollArea className="h-full pr-2">
                    <ul className="space-y-2.5">
                        {spectators.map(spectator => (
                        <li key={spectator.id} className={`flex items-center justify-between p-2.5 rounded-lg shadow-sm hover:bg-muted/60 transition-colors duration-150 group bg-background/60 border border-transparent`}>
                            <div className="flex items-center">
                            <Avatar className="h-9 w-9 mr-3 border-2 border-border">
                                <AvatarImage data-ai-hint={spectator.id.startsWith('bot-') ? "robot character" : "person silhouette"} src={spectator.avatarUrl || `https://placehold.co/40x40.png`} alt={spectator.name} />
                                <AvatarFallback className="bg-muted-foreground/20 text-muted-foreground font-semibold">{getPlayerInitials(spectator.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                               <span className="font-semibold text-sm text-foreground/90">{spectator.name}</span>
                               <span className={`text-xs ${spectator.isOnline ? 'text-green-400' : 'text-muted-foreground/70'}`}>{spectator.isOnline ? 'Online' : 'Offline'}</span>
                            </div>
                            </div>
                             {gamePhase === 'lobby_setup' && (playerId === currentLeaderId || !isLobbyLocked) && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={() => handleJoinAsPlayer(spectator.id)} size="sm" variant="outline" disabled={(isLobbyLocked && playerId !== currentLeaderId) || players.length >=10}>
                                            Join Game
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{(isLobbyLocked && playerId !== currentLeaderId) ? "Lobby is locked by leader" : players.length >= 10 ? "Lobby is full" : `Move ${spectator.name} to active players`}</p></TooltipContent>
                                </Tooltip>
                            )}
                        </li>
                        ))}
                        {spectators.length === 0 && isSpectatorsPanelOpen && <p className="text-sm text-muted-foreground text-center py-2">No spectators.</p>}
                    </ul>
                    </ScrollArea>
                </div>
            </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center overflow-y-auto bg-background/70">
          <Card className="w-full max-w-3xl text-center shadow-xl border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl lg:text-4xl font-bold text-primary">
                {gamePhase === 'lobby_setup' && "Waiting for Players..."}
                {gamePhase === 'role_reveal' && "Your Destiny is Revealed!"}
                {gamePhase === 'team_selection' && !isProposingTeam && "Assemble Your Knights!"}
                {gamePhase === 'team_selection' && isProposingTeam && "The Team is Gathering..."}
                {gamePhase === 'team_voting' && "Approve the Quest Team?"}
                {gamePhase === 'mission_play' && "The Quest is Underway!"}
                {gamePhase === 'assassination' && "The Assassin Strikes!"}
                {gamePhase === 'game_over' && "The Battle Concludes!"}
                {gamePhase === 'loading' && "Awaiting Orders..."}
              </CardTitle>
              {currentMission && gamePhase !== 'role_reveal' && gamePhase !== 'game_over' && gamePhase !== 'lobby_setup' && (
                <CardDescription className="text-lg text-muted-foreground mt-1">
                    Currently on <span className="font-semibold text-accent">Quest {currentMission.id}</span>.
                    Leader: <span className="font-bold text-amber-400">{currentLeader?.name || 'N/A'}</span>.
                    {!isProposingTeam && ` Requires ${currentMission.requiredPlayers} players.`}
                    {gamePhase === 'team_voting' && currentMission.team && currentMission.team.length > 0 && (
                        <>
                         Proposed team: {players.filter(p => currentMission.team?.includes(p.id)).map(p=>p.name).join(', ')}.
                        </>
                    )}
                </CardDescription>
              )}
               {gamePhase === 'lobby_setup' && (
                 <CardDescription className="text-lg text-muted-foreground mt-1">
                    Leader: <span className="font-bold text-amber-400">{currentLeader?.name || 'N/A'}</span>.
                    Lobby is <span className={`font-semibold ${isLobbyLocked ? 'text-red-400' : 'text-green-400'}`}>{isLobbyLocked ? 'Locked' : 'Unlocked'}</span>.
                    Players: <span className="font-semibold text-accent">{players.length}</span> (Need 5 to start).
                </CardDescription>
               )}
            </CardHeader>
            <CardContent className="space-y-6 min-h-[200px] flex flex-col items-center justify-center">
                {gamePhase === 'lobby_setup' && playerId === currentLeaderId && (
                    <>
                        <p className="text-md text-foreground/90">
                            As the leader, manage the lobby using the controls above. Add {Math.max(0, 5 - players.length)} more bot players from spectators.
                            When 5 players are ready, start the game.
                        </p>
                        <Button
                            variant="default"
                            size="lg"
                            className="mt-6 px-10 py-3 text-lg bg-green-600 hover:bg-green-700 text-white disabled:bg-muted disabled:text-muted-foreground"
                            onClick={handleStartGame}
                            disabled={players.length !== 5}
                        >
                            <Play className="mr-2 h-6 w-6" /> Start Game ({players.length}/5 needed)
                        </Button>
                         {players.length !== 5 && <p className="text-xs text-destructive mt-1">Exactly 5 players required to start.</p>}
                    </>
                )}
                 {gamePhase === 'lobby_setup' && playerId !== currentLeaderId && (
                    <p className="text-md text-foreground/90">
                        Waiting for the leader (<span className="font-bold text-amber-400">{currentLeader?.name || 'N/A'}</span>) to start the game.
                        {isLobbyLocked ? " The lobby is currently locked." : " The lobby is open for new players to be added by the leader."}
                    </p>
                 )}

                {gamePhase === 'role_reveal' && !isRoleRevealModalOpen && (
                     <p className="text-md text-foreground/90">
                        All players are viewing their roles. Waiting to proceed...
                    </p>
                )}


                {gamePhase === 'team_selection' && currentMission && !isProposingTeam && (
                    <>
                        <p className="text-md text-foreground/90">
                            {currentLeader?.id === playerId ? "You are the leader. " : `${currentLeader?.name} is leading. `}
                            Select <span className="font-semibold text-accent">{currentMission.requiredPlayers}</span> players for Quest {currentMission.id}.
                        </p>
                        <div className="flex justify-center space-x-4 mt-4">
                            <Button
                                variant="default"
                                size="lg"
                                className="px-8 py-3 text-base"
                                disabled={currentLeader?.id !== playerId}
                                onClick={handleProposeTeamClick}
                            >
                                Propose Team
                            </Button>
                        </div>
                    </>
                )}
                {gamePhase === 'team_selection' && currentMission && isProposingTeam && (
                    <>
                        <p className="text-md text-foreground/90 mb-3">
                            Leader: <span className="font-bold text-amber-400">{currentLeader?.name || 'N/A'}</span> is selecting <span className="font-semibold text-accent">{currentMission.requiredPlayers}</span> players for Quest {currentMission.id}.
                        </p>
                        <div className="w-full max-w-xs space-y-2 mb-4">
                            {Array.from({ length: currentMission.requiredPlayers }).map((_, index) => {
                                const playerInSlot = selectedTeam[index];
                                return (
                                <div key={index} className="flex items-center p-2.5 rounded-lg bg-muted/60 border border-dashed border-border h-[60px] min-h-[60px] w-full justify-center shadow-inner">
                                    {playerInSlot ? (
                                    <div className="flex items-center">
                                        <Avatar className="h-8 w-8 mr-2 border border-border">
                                        <AvatarImage data-ai-hint="knight medieval" src={playerInSlot.avatarUrl} alt={playerInSlot.name} />
                                        <AvatarFallback>{getPlayerInitials(playerInSlot.name)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold text-sm">{playerInSlot.name}</span>
                                    </div>
                                    ) : (
                                    <span className="text-xs text-muted-foreground italic">Empty Slot</span>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center space-x-4 mt-4">
                            <Button variant="outline" onClick={() => { setIsProposingTeam(false); setSelectedTeam([]); }}>Cancel</Button>
                            <Button
                                onClick={handleConfirmTeamProposal}
                                disabled={selectedTeam.length !== currentMission.requiredPlayers}
                            >
                                Confirm Team ({selectedTeam.length}/{currentMission.requiredPlayers})
                            </Button>
                        </div>
                    </>
                )}

                {gamePhase === 'team_voting' && playerId && currentMission && (
                    <>
                        <p className="text-md text-foreground/90 mb-2">A team has been proposed for Quest {currentMission.id}. Cast your vote!</p>
                        <div className="mb-4 p-3 bg-muted/30 rounded-lg shadow-inner max-w-md mx-auto">
                            <p className="text-sm font-semibold mb-1 text-accent">Proposed Team:</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {players.filter(p => currentMission.team?.includes(p.id)).map(member => (
                                    <div key={member.id} className="flex items-center gap-1.5 p-1.5 bg-background/50 rounded text-xs">
                                        <Avatar className="h-5 w-5 border">
                                            <AvatarImage data-ai-hint="knight player" src={member.avatarUrl} />
                                            <AvatarFallback>{getPlayerInitials(member.name)}</AvatarFallback>
                                        </Avatar>
                                        {member.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-center space-x-6 mt-4">
                            <Button
                                variant="outline"
                                size="lg"
                                className="px-10 py-3 text-lg border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleVote('approve')}
                                disabled={playerHasVotedOnTeam[playerId] || playerId === currentLeaderId}
                            >
                                <ThumbsUp className="mr-2 h-6 w-6"/> Approve
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="px-10 py-3 text-lg border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleVote('reject')}
                                disabled={playerHasVotedOnTeam[playerId] || playerId === currentLeaderId}
                            >
                                <ThumbsDown className="mr-2 h-6 w-6"/> Reject
                            </Button>
                        </div>
                        {playerId === currentLeaderId && <p className="text-xs text-muted-foreground mt-3">As leader, you oversee the vote but do not participate.</p>}
                        {playerHasVotedOnTeam[playerId] && <p className="text-sm text-accent mt-3">You have voted. Waiting for others.</p>}
                    </>
                )}

                {gamePhase === 'mission_play' && playerId && currentMission && currentMission.team?.includes(playerId) && (
                     <>
                        <p className="text-md text-foreground/90">You are on Quest {currentMission.id}. Play your card.</p>
                        <div className="flex justify-center space-x-6 mt-6">
                            <Button
                                variant="outline"
                                size="lg"
                                className="px-10 py-3 text-lg border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-50"
                                onClick={() => handlePlayMissionCard('success')}
                                disabled={playerHasPlayedMissionCard[playerId]}
                            >
                                <ShieldCheck className="mr-2 h-6 w-6"/> Success
                            </Button>
                            {revealedRoleDetails?.alignment === 'Evil' && (
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="px-10 py-3 text-lg border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                                    onClick={() => handlePlayMissionCard('fail')}
                                    disabled={playerHasPlayedMissionCard[playerId]}
                                >
                                    <ShieldAlert className="mr-2 h-6 w-6"/> Fail
                                </Button>
                            )}
                        </div>
                        {playerHasPlayedMissionCard[playerId] && <p className="text-sm text-accent mt-3">You have played your card. Waiting for other team members.</p>}
                     </>
                )}
                 {gamePhase === 'mission_play' && playerId && currentMission && !currentMission.team?.includes(playerId) && (
                     <p className="text-md text-muted-foreground">Quest {currentMission.id} is in progress. Waiting for the team to complete their mission.</p>
                 )}

                 {gamePhase === 'loading' && <p className="text-lg text-muted-foreground">Loading game state...</p>}
                 {gamePhase === 'assassination' && <p className="text-2xl font-bold text-red-400">ASSASSINATION PHASE! The Assassin targets Merlin...</p>}
                 {gamePhase === 'game_over' && (
                    <div className="text-2xl font-bold">
                        <p className="mb-2">GAME OVER!</p>
                        {goodScore >=3 && evilScore < 3 && consecutiveRejections < 4 ? <p className="text-blue-400">GOOD PREVAILS!</p> : <p className="text-red-400">EVIL TRIUMPHS!</p>}
                        {consecutiveRejections >= 4 && <p className="text-red-400 text-sm mt-1">(Due to 4 rejected teams)</p>}
                    </div>
                 )}
            </CardContent>
            <CardFooter className="pt-4">
                <p className="text-xs text-muted-foreground w-full">"The only thing necessary for the triumph of evil is for good men to do nothing."</p>
            </CardFooter>
          </Card>
        </main>

        <aside className="w-[280px] lg:w-[320px] border-l border-border/60 flex flex-col bg-card shrink-0">
          <div className="p-4 border-b border-border/60 h-16 flex items-center">
            <h2 className="text-lg font-semibold text-accent flex items-center"><MessageSquare className="mr-2 h-5 w-5" /> Game Chat</h2>
          </div>
          <ScrollArea className="flex-1 p-4" ref={chatScrollAreaRef}>
            <div className="space-y-3.5">
            {chatMessages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No messages yet. Break the silence!</p>}
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.senderId === playerId ? 'items-end' : 'items-start'}`}>
                <div className={`p-2.5 rounded-lg max-w-[90%] shadow-sm ${msg.senderId === playerId ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-foreground rounded-bl-none'}`}>
                  {msg.senderId !== playerId && <p className="text-xs font-semibold mb-0.5 text-accent/80">{msg.senderName}</p> }
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
                <p className="text-xs text-muted-foreground/80 mt-1 px-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))}
            </div>
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border/60 bg-card">
            <div className="flex space-x-2 items-center">
              <Input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 h-11 text-sm bg-background/80 focus:ring-primary/50 border-border/70"
                autoComplete="off"
              />
              <Button type="submit" size="icon" aria-label="Send message" className="h-11 w-11 shrink-0">
                <SendHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </aside>
      </div>

      {revealedRoleDetails && (
        <Dialog open={isRoleRevealModalOpen} onOpenChange={(isOpen) => { if (!isOpen && gamePhase === 'role_reveal') {} else { setIsRoleRevealModalOpen(isOpen) }}}>
            <DialogContent className="sm:max-w-md text-center" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className={`text-3xl font-bold ${revealedRoleDetails.alignment === 'Good' ? 'text-blue-400' : 'text-red-400'}`}>
                        {revealedRoleDetails.isActiveRole ? `You are ${revealedRoleDetails.name}!` : `You are on the side of ${revealedRoleDetails.alignment}!`}
                    </DialogTitle>
                     <DialogDescription className="text-md text-muted-foreground pt-2">
                        {revealedRoleDetails.longDescription}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-4 sm:justify-center">
                    <Button onClick={handleConfirmRole} size="lg">Understood</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
    </TooltipProvider>
  );
}

    
    