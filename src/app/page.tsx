import { CreatePartyForm } from '@/components/CreatePartyForm'
import { JoinPartyForm } from '@/components/JoinPartyForm'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-center mb-10 text-slate-900">
          WorldGuessr Clone
        </h1>

        <div className="grid md:grid-cols-2 gap-8 items-start max-w-4xl mx-auto">
          <div className="flex flex-col space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-center">Host a Game</h2>
            <CreatePartyForm />
          </div>

          <div className="flex flex-col space-y-4 relative">
            <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 w-px h-64 bg-slate-200"></div>
            <h2 className="text-2xl font-semibold tracking-tight text-center">Join a Game</h2>
            <JoinPartyForm />
          </div>
        </div>
      </div>
    </main>
  )
}
