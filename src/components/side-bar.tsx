import { Search, Telescope } from "lucide-react";
import { useMemo, useState } from "react";
import { Sort, SortButton } from "./sort-button";
import { Element } from "@/interfaces/element";
import { ElementCardSideBarWrapper } from "./element-card";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/libs/utils";

export const SideBar = ({
  elements,
  isLoading,
}: {
  elements: Element[];
  isLoading: boolean;
}) => {
  const [sort, setSort] = useState(Sort.Time);
  const [isDiscoveries, setIsDiscoveries] = useState(false);
  const [word, setWord] = useState("");

  const onRotateSort = () => {
    switch (sort) {
      case Sort.Time:
        setSort(Sort.Name);
        break;
      case Sort.Name:
        setSort(Sort.Emoji);
        break;
      case Sort.Emoji:
        setSort(Sort.Time);
        break;
    }
  };

  const sortedElement = useMemo(() => {
    const sortedElement = [...elements];
    switch (sort) {
      case Sort.Time:
        return sortedElement;
      case Sort.Name:
        return sortedElement.sort((a, b) => a.text.localeCompare(b.text));
      case Sort.Emoji:
        return sortedElement.sort((a, b) => a.emoji.localeCompare(b.emoji));
    }
  }, [elements, sort]);

  const { setNodeRef } = useDroppable({
    id: "sidebar-area",
    data: {
      type: "sidebar",
    },
    disabled: isLoading,
  });

  return (
    <div
      className="col-span-3 border-l h-screen flex flex-col bg-gray-50/80 backdrop-blur-sm dark:bg-gray-900/80 border-gray-200 dark:border-gray-800"
      ref={setNodeRef}
    >
      <div className="shrink-0 p-4 border-b border-gray-200 dark:border-gray-800 space-y-4">
        <div className="flex h-10 gap-2">
          <button
            className={cn(
              "flex flex-1 gap-2 justify-center items-center rounded-lg transition-colors",
              "border border-gray-200 dark:border-gray-800",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              isDiscoveries && "bg-gray-100 dark:bg-gray-800"
            )}
            onClick={() => setIsDiscoveries(!isDiscoveries)}
          >
            <Telescope className="w-4 h-4" /> Discovered
          </button>
          <SortButton sort={sort} onClick={onRotateSort} />
        </div>
        <div className="flex items-center gap-2 relative">
          <Search className="absolute left-3 w-4 h-4 text-gray-400" />
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className={cn(
              "flex px-9 py-2 w-full rounded-lg",
              "bg-white dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-800",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "placeholder:text-gray-400"
            )}
            placeholder="Search elements..."
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="grid grid-cols-2 gap-3 p-4">
          {sortedElement
            .filter((v) => !isDiscoveries || (isDiscoveries && v.discovered))
            .filter(
              (v) => !word || v.text.includes(word) || v.emoji.includes(word)
            )
            .map((element) => (
              <ElementCardSideBarWrapper
                key={element.text}
                element={element}
                isLoading={isLoading}
              />
            ))}
        </div>
      </div>
      <style jsx global>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
          min-height: 40px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        @media (prefers-color-scheme: dark) {
          .overflow-y-auto::-webkit-scrollbar-thumb {
            background-color: rgba(75, 85, 99, 0.5);
          }
          .overflow-y-auto::-webkit-scrollbar-thumb:hover {
            background-color: rgba(75, 85, 99, 0.7);
          }
          .overflow-y-auto {
            scrollbar-color: rgba(75, 85, 99, 0.5) transparent;
          }
        }
      `}</style>
    </div>
  );
};
