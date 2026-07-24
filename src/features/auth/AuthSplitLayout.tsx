import type { ReactNode } from 'react'

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen min-w-[1440px] overflow-hidden bg-background text-foreground">
      <div className="flex w-[720px] shrink-0 flex-col justify-between bg-primary p-16 text-primary-foreground">
        <div className="font-secondary text-3xl font-bold">Lumen</div>
        <div>
          <h1 className="mb-4 font-secondary text-5xl font-bold leading-tight">
            Share your
            <br />
            moments.
          </h1>
          <p className="max-w-md text-base opacity-80">
            A quieter place to post photos, follow the people you care about, and see what they're up to.
          </p>
        </div>
        <div className="text-sm opacity-60">© {new Date().getFullYear()} Lumen</div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto">
        <div className="w-full max-w-[420px] px-8 py-12">{children}</div>
      </div>
    </div>
  )
}
