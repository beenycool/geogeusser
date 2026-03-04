import { create } from 'zustand'

export interface Player {
  id: string;
  nickname: string;
  score: number;
  is_host: boolean;
}

export interface Party {
  id: string;
  code: string;
  status: 'waiting' | 'playing' | 'finished';
  current_round: number;
  total_rounds: number;
  host_id: string;
}

export interface Round {
  id: string;
  round_number: number;
  location_id: string;
  lat: number;
  lng: number;
  location_name: string;
}

export interface Guess {
  id: string;
  player_id: string;
  lat: number;
  lng: number;
  distance: number;
  score: number;
}

interface GameState {
  player: Player | null;
  party: Party | null;
  players: Player[];
  currentRound: Round | null;
  guesses: Guess[];
  setPlayer: (player: Player) => void;
  setParty: (party: Party) => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => boolean;
  setCurrentRound: (round: Round) => void;
  setGuesses: (guesses: Guess[]) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  player: null,
  party: null,
  players: [],
  currentRound: null,
  guesses: [],
  setPlayer: (player) => set({ player }),
  setParty: (party) => set({ party }),
  setPlayers: (players) => set({ players }),
  addPlayer: (player) => {
    let added = false;
    set((state) => {
      if (state.players.some(p => p.id === player.id)) {
        return { players: state.players };
      }
      added = true;
      return { players: [...state.players, player] };
    });
    return added;
  },
  setCurrentRound: (round) => set({ currentRound: round }),
  setGuesses: (guesses) => set({ guesses }),
  resetGame: () => set({ player: null, party: null, players: [], currentRound: null, guesses: [] })
}))
