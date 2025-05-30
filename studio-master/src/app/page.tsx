
import NameEntryForm from '@/components/landing/name-entry-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Swords } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background selection:bg-primary/40 selection:text-primary-foreground">
      <Card className="w-full max-w-md shadow-2xl border-border/60">
        <CardHeader className="text-center">
          <div className="mb-6">
            <Swords className="mx-auto h-20 w-20 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-5xl font-extrabold tracking-tight text-primary">
            Avalon Online
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xl mt-2">
            Enter your name to join the battle for Camelot.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <NameEntryForm />
        </CardContent>
      </Card>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>Created by Adam Asuev</p>
        <p className="mt-1">Inspired by the classic game "The Resistance: Avalon".</p>
      </footer>
    </main>
  );
}
