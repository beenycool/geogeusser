"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useGameStore, Player, Party } from '@/store/gameStore'
import { getRandomLocations } from '@/lib/locations'

export function CreatePartyForm() {
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const setPlayer = useGameStore(state => state.setPlayer)
  const setParty = useGameStore(state => state.setParty)

  const generateCode = () => {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    // Convert to base36 and take first 6 chars, padding if necessary
    return array[0].toString(36).padStart(6, '0').substring(0, 6).toUpperCase();
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return

    setLoading(true)
    const partyCode = generateCode()

    try {
      // 1. Create the party
      const { data: partyData, error: partyError } = await supabase
        .from('parties')
        .insert([{ code: partyCode, status: 'waiting', total_rounds: 5 }])
        .select()
        .single()

      if (partyError) throw partyError

      // 2. Create the host player
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert([{ party_id: partyData.id, nickname: nickname.trim(), is_host: true }])
        .select()
        .single()

      if (playerError) throw playerError

      // 3. Update the party with the host_id
      const { data: updatedPartyData, error: updateError } = await supabase
        .from('parties')
        .update({ host_id: playerData.id })
        .eq('id', partyData.id)
        .select()
        .single()

      if (updateError) throw updateError

      // 4. Generate and insert 5 random rounds for this party
      const randomLocations = getRandomLocations(5)
      const roundsToInsert = randomLocations.map((loc, index) => ({
        party_id: partyData.id,
        round_number: index + 1,
        location_id: loc.id,
        lat: loc.lat,
        lng: loc.lng,
        location_name: loc.name
      }))

      const { error: roundsError } = await supabase
        .from('rounds')
        .insert(roundsToInsert)

      if (roundsError) throw roundsError

      setPlayer(playerData as Player)
      setParty(updatedPartyData as Party)

      toast({ title: "Party created!", description: `Share code ${partyCode} with your friends.` })
      router.push(`/lobby/${partyCode}`)

    } catch (error: any) {
      console.error(error)
      toast({ title: "Error creating party", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleCreate}>
        <CardHeader>
          <CardTitle>Create a Party</CardTitle>
          <CardDescription>Host a new game and invite friends.</CardDescription>
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
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading || !nickname.trim()}>
            {loading ? "Creating..." : "Create Party"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
