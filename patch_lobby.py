import re

with open("src/app/lobby/[code]/page.tsx", "r") as f:
    content = f.read()

# Replace the subscriptions block
old_subscriptions = """    // Subscribe to new players joining
    const playerSubscription = supabase
      .channel(`party_${party.id}_players`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'players',
        filter: `party_id=eq.${party.id}`
      }, payload => {
        setPlayers([...useGameStore.getState().players, payload.new as Player])
        toast({ title: `${payload.new.nickname} joined the party!` })
      })
      .subscribe()

    // Subscribe to party status changes (game starting)
    const partySubscription = supabase
      .channel(`party_${party.id}_status`)
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
      supabase.removeChannel(playerSubscription)
      supabase.removeChannel(partySubscription)
    }"""

new_subscriptions = """    // Combine subscriptions into a single channel with a unique name to avoid conflicts during React Strict Mode re-mounts
    const channel = supabase
      .channel(`party_${party.id}_${Math.random().toString(36).substring(7)}`)
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
    }"""

# Need to escape special characters for re.sub or just use str.replace
if old_subscriptions not in content:
    raise RuntimeError("Expected subscriptions block not found in src/app/lobby/[code]/page.tsx")
content = content.replace(old_subscriptions, new_subscriptions, 1)

with open("src/app/lobby/[code]/page.tsx", "w") as f:
    f.write(content)
