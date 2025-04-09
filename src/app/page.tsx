"use client";
import { useEffect, useMemo, useState } from "react";
import { SideBar } from "../components/side-bar";
import { Element, PlacedElement } from "@/interfaces/element";
import { defaultElement, gameInstructions } from "../constants/default-element";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { PlaygroundArea } from "@/components/playground-area";
import { v4 as uuid } from "uuid";
import { ElementCard } from "@/components/element-card";
import axios from "axios";
import { HelpCircle } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [elements, setElements] = useState<Element[]>([]);
  const [placedElements, setPlacedElements] = useState<PlacedElement[]>([]);
  const [stepCount, setStepCount] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [activeElement, setActiveElement] = useState<Element | null>(null);
  const [activePlacedElement, setActivePlacedElement] = useState<PlacedElement | null>(null);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [showInstructions, setShowInstructions] = useState(false);
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);

  useEffect(() => {
    const handleWindowMouseMove = (event: any) => {
      setMouseCoords({
        x: event.clientX,
        y: event.clientY,
      });
    };
    window.addEventListener("mousemove", handleWindowMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
    };
  }, []);

  useEffect(() => {
    // 移除本地存储中的元素，总是使用默认元素
    localStorage.removeItem("elements");
    setElements(defaultElement);
  }, []);

  useEffect(() => {
    // 不再保存到本地存储
    // if (elements.length === 0) return;
    // localStorage.setItem("elements", JSON.stringify(elements));
  }, [elements]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    if (active.data.current.type === "element") {
      setActiveElement(event.active.data.current.element);
    } else if (active.data.current.type === "placed-element") {
      setActivePlacedElement(event.active.data.current.element);
    }
  };

  const checkTrump = (newElement: Element) => {
    if (newElement.text === 'trump' || newElement.emoji === '👨‍💼') {
      setGameStatus('won');
      setShowVictoryAnimation(true);
      // 3秒后隐藏动画
      setTimeout(() => {
        setShowVictoryAnimation(false);
      }, 3000);
      return true;
    }
    return false;
  };

  const checkGameOver = () => {
    if (stepCount >= 100) {
      setGameStatus('lost');
      return true;
    }
    return false;
  };

  const resetGame = () => {
    setElements(defaultElement);
    setPlacedElements([]);
    setStepCount(0);
    setGameStatus('playing');
  };

  const handleCombineElements = async (e1: PlacedElement, e2: PlacedElement | Element) => {
    if (checkGameOver()) return;

    if ("id" in e2) {
      setPlacedElements((prev) =>
        prev
          .filter((v) => v.id !== e2.id)
          .map((v) =>
            v.id === e1.id
              ? {
                  ...v,
                  isLoading: true,
                }
              : v
          )
      );
    } else {
      setPlacedElements((prev) =>
        prev.map((v) =>
          v.id === e1.id
            ? {
                ...v,
                isLoading: true,
              }
            : v
        )
      );
    }

    try {
      const { data } = await axios.get("/api/combine", {
        params: {
          word1: e1.text,
          word2: e2.text,
        },
      });

      setStepCount(prev => prev + 1);

      setPlacedElements((prev) =>
        prev.map((v) =>
          v.id === e1.id
            ? {
                ...data.element,
                id: uuid(),
                x: v.x,
                y: v.y,
                isLoading: false,
              }
            : v
        )
      );

      if (elements.every((element) => element.text !== data.element.text)) {
        setElements((prev) => [...prev, data.element]);
        checkTrump(data.element);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      window.alert("Something went wrong! Failed to combine elements: " + errorMessage);
      setPlacedElements((prev) =>
        prev.map((v) =>
          v.id === e1.id
            ? {
                ...v,
                isLoading: false,
              }
            : v
        )
      );
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    console.log("active", active);
    console.log("over", over);

    if (
      active.data.current.type === "placed-element" &&
      over &&
      over.data.current.type === "sidebar"
    ) {
      const element = active.data.current.element;
      const newPlacedElements = placedElements.filter(
        (v) => v.id !== element.id
      );
      setPlacedElements(newPlacedElements);
    } else if (
      active.data.current.type === "placed-element" &&
      over &&
      over.data.current.type === "placed-element"
    ) {
      handleCombineElements(
        over.data.current.element,
        active.data.current.element
      );
    } else if (active.data.current.type === "placed-element") {
      const element = active.data.current.element;
      const newPlacedElements = placedElements.map((v) =>
        v.id === element.id
          ? {
              ...element,
              x: element.x + event.delta.x,
              y: element.y + event.delta.y,
            }
          : v
      );
      setPlacedElements(newPlacedElements);
    }

    if (
      active.data.current.type === "element" &&
      over &&
      over.data.current.type === "playground"
    ) {
      const element = active.data.current.element;
      const placedElement = {
        ...element,
        id: uuid(),
        x: mouseCoords.x,
        y: mouseCoords.y,
      };
      setPlacedElements((prev) => [...prev, placedElement]);
    } else if (
      active.data.current.type === "element" &&
      over &&
      over.data.current.type === "placed-element"
    ) {
      handleCombineElements(
        over.data.current.element,
        active.data.current.element
      );
    }

    setActiveElement(null);
    setActivePlacedElement(null);
  };

  const isLoading = useMemo(() => {
    return placedElements.some((v) => v.isLoading);
  }, [placedElements]);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <main className="flex h-screen flex-col bg-gradient-to-br from-blue-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        {/* 胜利动画 */}
        {showVictoryAnimation && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
            <div className="text-center">
              <div className="animate-victory text-[200px]">👨‍💼</div>
              <h2 className="text-4xl font-bold text-white mt-8 animate-fade-in">
                Congratulations!
              </h2>
              <p className="text-xl text-white mt-4 animate-fade-in">
                You&apos;ve successfully created Trump!
              </p>
              <button
                onClick={resetGame}
                className="mt-8 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors animate-fade-in"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* 游戏规则提示框 */}
        {showInstructions && (
          <div className="absolute inset-0 w-full h-full flex items-start justify-end p-20 z-[9999] pointer-events-none">
            <div className="w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 pointer-events-auto">
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Game Rules
                  </h2>
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {gameInstructions}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="w-32"></div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg overflow-hidden border-2 border-blue-500 dark:border-blue-400">
              <Image
                src="/trump.png"
                alt="Trump"
                width={64}
                height={64}
                className="object-cover"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-100 dark:to-white bg-clip-text text-transparent">
              Create Trump in 100 Steps
            </h1>
          </div>
          <div className="flex items-center gap-4 w-32 justify-end">
            <div className="text-xl font-medium text-gray-600 dark:text-gray-300">
              Steps: {stepCount}/100
            </div>
            <button
              onClick={() => setShowInstructions(prev => !prev)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-12 flex-1 overflow-hidden">
          <div className="col-span-9 relative">
            <PlaygroundArea
              setElements={setElements}
              setPlacedElements={setPlacedElements}
              placedElements={placedElements}
              isLoading={isLoading}
            />
          </div>
          <SideBar elements={elements} isLoading={isLoading} />
        </div>

        {/* 只保留失败的情况 */}
        {gameStatus === 'lost' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl text-center max-w-md">
              <h2 className="text-2xl font-bold mb-4">
                🤔 Keep Trying!
              </h2>
              <p className="mb-4">
                You used all {stepCount} steps, but Trump is still waiting to be created.
              </p>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Don&apos;t give up! Try different combinations - there are multiple paths to create Trump. Hint: Start with basic elements and build up gradually.
              </p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </main>
      <DragOverlay dropAnimation={null}>
        {activeElement && <ElementCard element={activeElement} />}
        {activePlacedElement && <ElementCard element={activePlacedElement} />}
      </DragOverlay>

      <style jsx global>{`
        @keyframes victory {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(2) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(360deg);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-victory {
          animation: victory 1.5s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
          animation-delay: 1s;
          opacity: 0;
        }
      `}</style>
    </DndContext>
  );
}
