"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useGameStore, Player } from '@/store/gameStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trophy, Medal, Home } from 'lucide-react'

export default function Leaderboard({ params }: { params: { code: string } }) {
  const router = useRouter()
  const partyCode = params.code.toUpperCase()

  const party = useGameStore(state => state.party)
  const players = useGameStore(state => state.players)
  const setPlayers = useGameStore(state => state.setPlayers)
  const resetGame = useGameStore(state => state.resetGame)

  const [finalPlayers, setFinalPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFinalScores = async () => {
      // Fetch all players for this party and sort by score
      const { data: playersData, error } = await supabase
        .from('players')
        .select('*')
        .eq('party_id', party?.id)
        .order('score', { ascending: false })

      if (!error && playersData) {
        setFinalPlayers(playersData as Player[])
        setPlayers(playersData as Player[])
      }
      setLoading(false)
    }

    if (party) {
       fetchFinalScores()
    } else {
       // if accessed directly, redirect home
       router.push('/')
    }
  }, [party, router, setPlayers])

  const handleReturnHome = () => {
    resetGame()
    router.push('/')
  }

  if (loading || !party) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Calculating final scores...</div>
  }

  const sortedPlayers = [...finalPlayers].sort((a, b) => b.score - a.score)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-lg mx-auto shadow-2xl border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto text-white mb-4 drop-shadow-md" />
          <CardTitle className="text-4xl font-extrabold text-white tracking-tight">Final Leaderboard</CardTitle>
          <CardDescription className="text-amber-100 font-medium text-lg mt-2">Party {partyCode}</CardDescription>
        </div>

        <CardContent className="p-0">
          <ul className="divide-y divide-slate-100">
            {sortedPlayers.map((player, index) => (
              <li
                key={player.id}
                className={`flex items-center justify-between p-6 ${
                  index === 0 ? 'bg-yellow-50/50' :
                  index === 1 ? 'bg-slate-50' :
                  index === 2 ? 'bg-orange-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-400 w-6 text-center text-lg">{index + 1}</span>
                  {index === 0 && <Medal className="w-6 h-6 text-yellow-500" />}
                  {index === 1 && <Medal className="w-6 h-6 text-slate-400" />}
                  {index === 2 && <Medal className="w-6 h-6 text-orange-400" />}
                  {index > 2 && <span className="w-6 h-6" />}
                  <span className={`font-semibold text-lg ${index === 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                    {player.nickname}
                  </span>
                </div>
                <div className={`font-black tracking-tight ${index === 0 ? 'text-2xl text-yellow-600' : 'text-xl text-slate-600'}`}>
                  {player.score.toLocaleString()} <span className="text-sm font-medium text-slate-400 uppercase">pts</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>

        <div className="p-6 bg-slate-50 border-t">
          <Button size="lg" className="w-full text-lg gap-2" onClick={handleReturnHome}>
            <Home className="w-5 h-5" />
            Return to Home
          </Button>
        </div>
      </Card>
    </main>
  )
}
