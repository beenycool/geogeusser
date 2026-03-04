"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useGameStore, Player, Party } from '@/store/gameStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Users, Play } from 'lucide-react'

export default function Lobby({ params }: { params: { code: string } }) {
  const router = useRouter()
  const { toast } = useToast()

  const partyCode = params.code.toUpperCase()

  const player = useGameStore(state => state.player)
  const party = useGameStore(state => state.party)
  const players = useGameStore(state => state.players)
  const setPlayers = useGameStore(state => state.setPlayers)
  const setParty = useGameStore(state => state.setParty)

  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  // Redirect if no player state (refreshed page)
  useEffect(() => {
    if (!player || !party) {
      router.push('/')
      return
    }
  }, [player, party, router])

  // Fetch initial players and set up realtime subscriptions
  useEffect(() => {
    if (!party) return

    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('party_id', party.id)

      if (!error && data) {
        setPlayers(data as Player[])
      }
      setLoading(false)
    }

    fetchPlayers()

    // Combine subscriptions into a single channel with a unique name to avoid conflicts during React Strict Mode re-mounts
    const channel = supabase
      .channel(`party_${party.id}_lobby`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'players',
        filter: `party_id=eq.${party.id}`
      }, payload => {
        useGameStore.getState().addPlayer(payload.new as Player)
        toast({ title: `${payload.new.nickname} joined the party!` })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'parties',
        filter: `id=eq.${party.id}`
      }, payload => {
        const updatedParty = payload.new as Party
        setParty(updatedParty)

        if (updatedParty.status === 'playing') {
          router.push(`/game/${partyCode}`)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [party, partyCode, router, setParty, setPlayers, toast])

  const handleStartGame = async () => {
    if (!player?.is_host || !party) return
    setStarting(true)

    try {
      const { error } = await supabase
        .from('parties')
        .update({ status: 'playing' })
        .eq('id', party.id)

      if (error) throw error
      // Router push happens in the realtime subscription
    } catch (error: any) {
      toast({ title: "Failed to start game", description: error.message, variant: "destructive" })
      setStarting(false)
    }
  }

  if (!player || !party || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading lobby...</div>
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Party Lobby</CardTitle>
          <CardDescription>Share this code with your friends to join</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 text-center">

          <div className="bg-slate-100 py-6 rounded-lg shadow-inner">
            <h2 className="text-5xl font-mono font-black tracking-[0.2em] text-slate-800">
              {partyCode}
            </h2>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
              <Users className="w-5 h-5" />
              Players ({players.length})
            </h3>

            <ul className="space-y-2 max-h-[300px] overflow-y-auto">
              {players.map((p) => (
                <li key={p.id} className="py-2 px-4 rounded-md bg-white border flex justify-between items-center shadow-sm">
                  <span className="font-medium">{p.nickname} {p.id === player.id && "(You)"}</span>
                  {p.is_host && <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Host</span>}
                </li>
              ))}
            </ul>
          </div>

          {player.is_host ? (
            <div className="pt-4 border-t">
              <Button
                size="lg"
                className="w-full text-lg font-bold gap-2"
                onClick={handleStartGame}
                disabled={starting || players.length < 1}
              >
                <Play className="w-5 h-5" />
                {starting ? "Starting..." : "Start Game"}
              </Button>
            </div>
          ) : (
            <div className="pt-4 border-t text-sm text-slate-500 animate-pulse">
              Waiting for host to start the game...
            </div>
          )}

        </CardContent>
      </Card>
    </main>
  )
}
