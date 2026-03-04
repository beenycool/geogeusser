"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useGameStore, Player, Party } from '@/store/gameStore'

export function JoinPartyForm() {
  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const setPlayer = useGameStore(state => state.setPlayer)
  const setParty = useGameStore(state => state.setParty)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !code.trim()) return

    setLoading(true)
    const upperCode = code.toUpperCase().trim()

    try {
      // 1. Find the party
      const { data: partyData, error: partyError } = await supabase
        .from('parties')
        .select('*')
        .eq('code', upperCode)
        .single()

      if (partyError || !partyData) throw new Error("Party not found or invalid code.")

      if (partyData.status !== 'waiting') {
         throw new Error("This game has already started or finished.")
      }

      // 2. Create the player
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert([{ party_id: partyData.id, nickname: nickname.trim() }])
        .select()
        .single()

      if (playerError) throw playerError

      setPlayer(playerData as Player)
      setParty(partyData as Party)

      toast({ title: "Joined party!", description: `Waiting for host to start.` })
      router.push(`/lobby/${upperCode}`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      console.error(error)
      toast({ title: "Error joining party", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleJoin}>
        <CardHeader>
          <CardTitle>Join a Party</CardTitle>
          <CardDescription>Enter a code to join an existing game.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Your Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Party Code (e.g. A1B2C3)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              maxLength={6}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" variant="outline" className="w-full" disabled={loading || !nickname.trim() || !code.trim()}>
            {loading ? "Joining..." : "Join Party"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
