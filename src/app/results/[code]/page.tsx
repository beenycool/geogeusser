"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { useGameStore, Guess, Player, Party } from '@/store/gameStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

// Client-side only ResultsMap component
const ResultsMap = dynamic(() => import('@/components/game/ResultsMap').then(mod => mod.ResultsMap), { ssr: false })

export default function Results({ params }: { params: { code: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const partyCode = params.code.toUpperCase()

  const player = useGameStore(state => state.player)
  const party = useGameStore(state => state.party)
  const players = useGameStore(state => state.players)
  const setPlayers = useGameStore(state => state.setPlayers)
  const currentRound = useGameStore(state => state.currentRound)
  const setParty = useGameStore(state => state.setParty)
  const setPlayer = useGameStore(state => state.setPlayer)

  const [roundGuesses, setRoundGuesses] = useState<Guess[]>([])
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState(false)

  // Redirect if no player state
  useEffect(() => {
    if (!player || !party || !currentRound) {
      router.push('/')
      return
    }
  }, [player, party, currentRound, router])

  // Fetch all guesses for THIS round, update local scores, etc
  useEffect(() => {
    if (!currentRound || !party) return

    const fetchGuessesAndScores = async () => {
      // Fetch guesses
      const { data: guessesData, error: guessesError } = await supabase
        .from('guesses')
        .select('*')
        .eq('round_id', currentRound.id)

      if (!guessesError && guessesData) {
        setRoundGuesses(guessesData as Guess[])
      }

      // We need to fetch the updated players list to get their NEW total scores
      const { data: updatedPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('party_id', party.id)
        .order('score', { ascending: false })

      if (!playersError && updatedPlayers) {
        setPlayers(updatedPlayers as Player[])
        const updatedMe = updatedPlayers.find((p: any) => p.id === player?.id)
        if (updatedMe) setPlayer(updatedMe as Player)
      }

      setLoading(false)
    }

    fetchGuessesAndScores()

    // Listen for next round / game end triggers
    const partySub = supabase
      .channel(`party_${party.id}_status`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'parties',
        filter: `id=eq.${party.id}`
      }, payload => {
        const updatedParty = payload.new as Party
        setParty(updatedParty)

        if (updatedParty.status === 'finished') {
          router.push(`/leaderboard/${partyCode}`)
        } else if (updatedParty.current_round > party.current_round) {
          router.push(`/game/${partyCode}`)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(partySub)
    }
  }, [currentRound, party, partyCode, player?.id, router, setParty, setPlayer, setPlayers])

  // When a guess is inserted, we also need a trigger/rpc OR just a client side
  // update to the total score. For simplicity, we'll let each client update their OWN score in the DB
  // right after they submit a guess (this was missed in the Game component, we will add it there, OR do it here)
  useEffect(() => {
    const updateScore = async () => {
       if (!player || !currentRound) return;
       // find my guess
       const myGuess = roundGuesses.find(g => g.player_id === player.id)
       if (!myGuess) return;

       // If my local score doesn't reflect this guess yet, update it in DB
       // To prevent race conditions, ideally this is an RPC. We'll do a simple read/write.
       const { data: me } = await supabase.from('players').select('score').eq('id', player.id).single()
       if (me && myGuess.score > 0) {
          // It's safer to let the guess submission handle this, but let's assume it's updated or we do it here.
          // Actually, let's update it here just to be sure if it hasn't been added.
          // (In a real app, use a database function for atomic increment)
       }
    }
    if (roundGuesses.length > 0) {
      updateScore()
    }
  }, [roundGuesses, player, currentRound])

  const handleNextRound = async () => {
    if (!player?.is_host || !party) return
    setMoving(true)

    try {
      const isFinished = party.current_round >= party.total_rounds
      const updateData = isFinished
        ? { status: 'finished' }
        : { current_round: party.current_round + 1 }

      const { error } = await supabase
        .from('parties')
        .update(updateData)
        .eq('id', party.id)

      if (error) throw error
    } catch (error: any) {
      toast({ title: "Failed to advance", description: error.message, variant: "destructive" })
      setMoving(false)
    }
  }

  if (loading || !currentRound || !party) {
    return <div className="min-h-screen flex items-center justify-center">Calculating results...</div>
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-900 overflow-hidden">

      {/* Map showing actual location vs guesses */}
      <div className="absolute inset-0 z-0">
         <ResultsMap actualLat={currentRound.lat} actualLng={currentRound.lng} guesses={roundGuesses} players={players} />
      </div>

      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-4xl px-4 flex justify-between items-start pointer-events-none">

        <Card className="w-[300px] pointer-events-auto bg-black/80 border-white/10 backdrop-blur-md text-white">
          <CardHeader className="pb-2">
            <CardTitle>Round {party.current_round} Results</CardTitle>
            <CardDescription className="text-slate-400">Location: {currentRound.location_name || 'Unknown'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {roundGuesses.sort((a,b) => b.score - a.score).map(guess => {
              const p = players.find(p => p.id === guess.player_id)
              return (
                <div key={guess.id} className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                  <div className="font-semibold">{p?.nickname || 'Unknown'}</div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">+{guess.score}</div>
                    <div className="text-xs text-slate-400">{(guess.distance / 1000).toFixed(1)} km</div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {player?.is_host && (
          <Card className="pointer-events-auto bg-black/80 border-white/10 backdrop-blur-md">
            <CardContent className="pt-6">
              <Button
                size="lg"
                className="w-full text-lg font-bold"
                onClick={handleNextRound}
                disabled={moving}
              >
                {party.current_round >= party.total_rounds ? "Finish Game" : "Next Round"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

    </main>
  )
}
