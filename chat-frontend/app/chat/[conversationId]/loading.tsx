import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationLoading() {
  return (
    <div className="flex h-full flex-col" aria-label="Loading conversation">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-2.5 sm:px-4">
        <Skeleton className="skeleton-shimmer size-10 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="skeleton-shimmer h-3 w-1/3 rounded-sm" />
          <Skeleton className="skeleton-shimmer h-2.5 w-1/4 rounded-sm" />
        </div>
        <Skeleton className="skeleton-shimmer h-8 w-20 shrink-0 rounded-md" />
      </div>
      <div className="chat-canvas flex flex-1 flex-col gap-3 overflow-hidden p-4 sm:p-5">
        {Array.from({ length: 6 }).map((_, i) => {
          const mine = i % 2 === 0;
          return (
            <div
              key={i}
              className={`anim-fade-up flex ${mine ? "justify-end" : "justify-start"}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Skeleton
                className={`skeleton-shimmer h-12 rounded-lg ${
                  mine
                    ? "w-1/2 rounded-br-sm bg-acid/15"
                    : "w-2/5 rounded-bl-sm bg-card"
                }`}
              />
            </div>
          );
        })}
      </div>
      <div className="border-t border-border bg-card px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
        <Skeleton className="skeleton-shimmer h-[52px] w-full rounded-lg" />
      </div>
    </div>
  );
}
