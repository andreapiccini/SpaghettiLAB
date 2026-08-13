/** Honest placeholder for a screen `roadmap/app-v1` hasn't implemented yet — never fake data, just a clear "not built yet" state naming the task that will replace it. */
export function ScreenStub({ title, task }: { readonly title: string; readonly task: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <h1 className="font-heading text-xl font-semibold text-ink">{title}</h1>
      <p className="font-body text-sm text-ink-faint">Non ancora implementata — vedi {task} in roadmap/app-v1.</p>
    </div>
  );
}
