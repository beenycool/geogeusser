"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { useGameStore, Round, Guess, Player, Party } from '@/store/gameStore'
import { MapillaryViewer } from '@/components/game/MapillaryViewer'
import { getDistanceInMeters, calculateScore } from '@/lib/scoring'
import { useToast } from '@/hooks/use-toast'

// Need to dynamically import LeafletMap with ssr: false because it uses window object
const LeafletMap = dynamic(() => import('@/components/game/LeafletMap').then(mod => mod.LeafletMap), { ssr: false })

export default function Game({ params }: { params: { code: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const partyCode = params.code.toUpperCase()

  const player = useGameStore(state => state.player)
  const party = useGameStore(state => state.party)
  const players = useGameStore(state => state.players)
  const currentRound = useGameStore(state => state.currentRound)
  const guesses = useGameStore(state => state.guesses)

  const setCurrentRound = useGameStore(state => state.setCurrentRound)
  const setGuesses = useGameStore(state => state.setGuesses)
  const setParty = useGameStore(state => state.setParty)
  const setPlayer = useGameStore(state => state.setPlayer)

  const [loading, setLoading] = useState(true)
  const [hasGuessed, setHasGuessed] = useState(false)

  // Redirect if no player state
  useEffect(() => {
    if (!player || !party) {
      router.push('/')
      return
    }
  }, [player, party, router])

  // Fetch current round data and listen for round/guess updates
  useEffect(() => {
    if (!party) return

    const fetchRoundData = async () => {
      // 1. Get the current round
      const { data: roundData, error: roundError } = await supabase
        .from('rounds')
        .select('*')
        .eq('party_id', party.id)
        .eq('round_number', party.current_round)
        .single()

      if (!roundError && roundData) {
        setCurrentRound(roundData as Round)

        // 2. Get any existing guesses for this round
        const { data: guessesData, error: guessesError } = await supabase
          .from('guesses')
          .select('*')
          .eq('round_id', roundData.id)

        if (!guessesError && guessesData) {
          setGuesses(guessesData as Guess[])

          // Check if WE have already guessed
          const ourGuess = guessesData.find((g: any) => g.player_id === player?.id)
          if (ourGuess) setHasGuessed(true)
        }
      }
      setLoading(false)
    }

    fetchRoundData()

    // Listen for NEW guesses in this round
    // We filter by client side due to supabase realtime limitation on joined tables
    const guessSub = supabase
      .channel(`round_${party.current_round}_guesses`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'guesses',
      }, payload => {
        const newGuess = payload.new as Guess
        // we can check if currentRound is loaded and IDs match, but we know it's for this party round
        setGuesses([...useGameStore.getState().guesses, newGuess])
      })
      .subscribe()

    // Listen for party status changes (e.g. moving to next round or finishing)
    const partySub = supabase
      .channel(`game_${party.id}_status`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'parties',
        filter: `id=eq.${party.id}`
      }, payload => {
        const updatedParty = payload.new as Party
        setParty(updatedParty)

        if (updatedParty.current_round > party.current_round) {
           // Clear hasGuessed for next round
           setHasGuessed(false)
           router.push(`/results/${params.code}`)
        } else if (updatedParty.status === 'finished') {
           router.push(`/leaderboard/${params.code}`)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(guessSub)
      supabase.removeChannel(partySub)
    }
  }, [party, player?.id, params.code, router, setCurrentRound, setGuesses, setParty])

  // Automatically end round if everyone has guessed
  useEffect(() => {
    if (!party || !player || !currentRound || !player.is_host) return

    // Only host triggers the end of round redirect to avoid race conditions
    if (guesses.length === players.length && guesses.length > 0) {
      router.push(`/results/${partyCode}`)
    }
  }, [guesses.length, players.length, party, player, currentRound, router, partyCode])


  const handleGuessSubmit = async (guessLat: number, guessLng: number) => {
    if (!currentRound || !player || !party) return

    setHasGuessed(true)

    const distance = getDistanceInMeters(guessLat, guessLng, currentRound.lat, currentRound.lng)
    const score = calculateScore(distance)

    try {
      // 1. Insert Guess
      const { error: guessError } = await supabase
        .from('guesses')
        .insert([{
          round_id: currentRound.id,
          player_id: player.id,
          lat: guessLat,
          lng: guessLng,
          distance: distance,
          score: score
        }])

      if (guessError) throw guessError

      // 2. Update local Player total score in DB atomically via a select then update
      const { data: pData } = await supabase.from('players').select('score').eq('id', player.id).single()
      if (pData) {
         const newTotalScore = pData.score + score
         await supabase.from('players').update({ score: newTotalScore }).eq('id', player.id)
         // Update local Zustand store
         setPlayer({ ...player, score: newTotalScore } as Player)
      }

      toast({ title: "Guess submitted!", description: `Waiting for ${players.length - guesses.length - 1} other players...` })

    } catch (error: any) {
      console.error(error)
      toast({ title: "Failed to submit guess", description: error.message, variant: "destructive" })
      setHasGuessed(false)
    }
  }

  if (loading || !currentRound || !party) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading Mapillary Image...</div>
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-slate-900">

      {/* 1. Mapillary Viewer Background */}
      <MapillaryViewer imageId={currentRound.location_id} />

      {/* 2. Top Bar UI */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between px-8 pointer-events-none">
        <div className="text-white font-bold tracking-widest uppercase drop-shadow-md text-xl bg-black/30 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
          Round <span className="text-yellow-400">{party.current_round}</span> / {party.total_rounds}
        </div>
        <div className="text-white bg-black/60 px-6 py-2 rounded-full border border-white/20 backdrop-blur-sm font-mono flex items-center gap-6 shadow-xl">
          <span className="font-semibold">{player?.nickname}</span>
          <span className="font-bold text-green-400 text-xl">{player?.score} <span className="text-sm font-normal text-slate-300">pts</span></span>
        </div>
      </div>

      {/* 3. Bottom Right Progress UI */}
      <div className="absolute bottom-6 right-6 z-10 bg-black/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-white flex flex-col items-end shadow-2xl pointer-events-none">
         <div className="text-xs text-slate-300 font-bold mb-1 uppercase tracking-widest">Guesses Submitted</div>
         <div className="text-4xl font-black">{guesses.length} <span className="text-slate-400 text-2xl font-medium">/ {players.length}</span></div>
      </div>

      {/* 4. Bottom Left Interactive Map */}
      <LeafletMap
        onGuessSubmit={handleGuessSubmit}
        disabled={hasGuessed}
      />

    </main>
  )
}
