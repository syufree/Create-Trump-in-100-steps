import { AlarmClock, ArrowDownAZ, Smile } from "lucide-react";
import { cn } from "@/libs/utils";

export enum Sort {
  Time,
  Name,
  Emoji,
}

export const SortButton = ({ sort, onClick }: { sort: Sort; onClick: () => void }) => {
  const baseClasses = cn(
    "flex flex-1 gap-2 justify-center items-center rounded-lg transition-colors",
    "border border-gray-200 dark:border-gray-800",
    "hover:bg-gray-100 dark:hover:bg-gray-800"
  );

  if (sort === Sort.Time) {
    return (
      <button onClick={onClick} className={baseClasses}>
        <AlarmClock className="w-4 h-4" /> Sort by Time
      </button>
    );
  } else if (sort === Sort.Name) {
    return (
      <button onClick={onClick} className={baseClasses}>
        <ArrowDownAZ className="w-4 h-4" /> Sort by Name
      </button>
    );
  } else if (sort === Sort.Emoji) {
    return (
      <button onClick={onClick} className={baseClasses}>
        <Smile className="w-4 h-4" /> Sort by Emoji
      </button>
    );
  }
};