export default function Home() {
  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center justify-center px-6 py-24"
    >
      <div className="max-w-2xl text-center space-y-6">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          The Woodlands, Texas
        </p>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-foreground">
          Woodlands Tai Chi
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Meditation in motion. A community school teaching Tai Chi in the
          lineage of Master George Ling Hu — free beginner classes, all ages
          welcome.
        </p>
        <p className="text-sm text-muted-foreground pt-8">
          Site under construction — phase 1 scaffold complete.
        </p>
      </div>
    </main>
  );
}
