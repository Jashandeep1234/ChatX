import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      className="chat-canvas flex flex-1 flex-col gap-3 p-4 sm:p-5"
      aria-label="Loading"
    >
      {Array.from({ length: 8 }).map((_, i) => {
        const mine = i % 2 === 0;
        return (
          <div
            key={i}
            className={`anim-fade-up flex ${mine ? "justify-end" : "justify-start"}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`flex flex-col gap-1.5 ${mine ? "items-end" : "items-start"}`}>
              {!mine ? (
                <Skeleton className="skeleton-shimmer h-2.5 w-16 rounded-sm" />
              ) : null}
              <Skeleton
                className={`skeleton-shimmer h-12 rounded-lg ${
                  mine
                    ? "w-1/2 rounded-br-sm bg-acid/15"
                    : "w-2/5 rounded-bl-sm bg-card"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
