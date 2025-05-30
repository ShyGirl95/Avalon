"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { User, LogIn } from 'lucide-react';

export default function NameEntryForm() {
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isMounted) return; // Prevent submission if not mounted (for localStorage access)

    if (!playerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please choose a valiant name for your legend.",
        variant: "destructive",
      });
      return;
    }
    if (playerName.trim().length > 20) {
      toast({
        title: "Name Too Long",
        description: "Your name must be 20 characters or less.",
        variant: "destructive",
      });
      return;
    }


    setIsLoading(true);
    
    localStorage.setItem('playerName', playerName.trim()); 
    
    toast({
      title: `Welcome, Sir/Dame ${playerName.trim()}!`,
      description: "The gates of the lobby swing open for you...",
      duration: 3000,
    });

    setTimeout(() => {
      router.push('/lobby');
      // setIsLoading(false); // No need to set false if navigating away
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="playerName" className="text-lg font-medium text-foreground/90 sr-only">Player Name</Label>
        <div className="relative flex items-center">
          <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="playerName"
            type="text"
            placeholder="e.g., Sir Lancelot"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
            className="pl-11 pr-4 py-3 text-lg h-14 rounded-lg border-border/70 focus:border-primary focus:ring-primary/50"
            aria-label="Player Name"
            maxLength={25}
          />
        </div>
      </div>
      <Button type="submit" className="w-full text-lg py-4 h-14 rounded-lg shadow-md hover:shadow-accent/30 transition-all duration-300 ease-out transform hover:scale-105 focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background" size="lg" disabled={isLoading} variant="default">
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Entering...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-5 w-5" />
            Enter Lobby
          </>
        )}
      </Button>
    </form>
  );
}
