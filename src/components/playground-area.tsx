"use client";
import { useEffect, useState, useRef } from "react";
import { Element, PlacedElement } from "@/interfaces/element";
import { defaultElement } from "../constants/default-element";
import { ElementCardDraggableWrapper } from "./element-card";
import { RotateCcw, Trash, ZoomIn, ZoomOut, Move } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import ChangeThemeButton from "./change-theme-button";
import Image from "next/image";

export const PlaygroundArea = ({
  placedElements,
  setPlacedElements,
  setElements,
  isLoading,
}: {
  placedElements: PlacedElement[];
  setPlacedElements: (v: PlacedElement[]) => void;
  setElements: (v: Element[]) => void;
  isLoading: boolean;
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const onClearPlacedElements = () => {
    setPlacedElements([]);
  };

  const onClearElements = () => {
    const userConfirmed = window.confirm(
      "Are you sure you want clear all the progress? ***You won't be able to recover them again***"
    );
    if (userConfirmed) {
      onClearPlacedElements();
      setElements(defaultElement);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 当按下左键或Alt+左键时开始拖动
    if (e.button === 0) {
      e.preventDefault(); // 防止选中文本
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({
        x: newX,
        y: newY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prevScale => Math.min(Math.max(0.5, prevScale * delta), 2));
    }
  };

  useEffect(() => {
    const container = document.getElementById("playground-area");
    if (!container) return;

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("wheel", handleWheel);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [isDragging, dragStart, handleMouseMove, handleWheel]);

  const { setNodeRef } = useDroppable({
    id: "playground-area",
    data: {
      type: "playground",
    },
    disabled: isLoading,
  });

  return (
    <div 
      className="col-span-9 h-full w-full relative overflow-hidden"
      ref={containerRef}
    >
      {/* 元素容器层 - 用于元素拖拽 */}
      <div 
        ref={setNodeRef}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: "center",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none"
        }}
      >
        <div style={{ 
          width: "100%", 
          height: "100%", 
          position: "relative",
        }}>
          {placedElements.map((element, index) => (
            <div key={index} style={{ pointerEvents: "auto" }}>
              <ElementCardDraggableWrapper
                element={element}
                isLoading={isLoading}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 底层拖拽层 - 用于画布拖拽 */}
      <div
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 0
        }}
      />

      {/* 控制按钮 */}
      <div className="absolute top-0 right-0 p-4 flex items-center gap-4" style={{ zIndex: 2 }}>
        <div className="cursor-pointer">
          <ChangeThemeButton />
        </div>
        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          onClick={() => setScale(prev => Math.min(prev * 1.1, 2))}
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          onClick={() => setScale(prev => Math.max(prev * 0.9, 0.5))}
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>
        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          onClick={() => {
            setPosition({ x: 0, y: 0 });
            setScale(1);
          }}
          title="Reset View"
        >
          <Move size={20} />
        </button>
        <div
          className="cursor-pointer hover:text-red-400"
          onClick={onClearPlacedElements}
          title="Clear Elements"
        >
          <Trash />
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 p-4 cursor-pointer hover:text-red-400"
        onClick={onClearElements}
        title="Reset Game"
        style={{ zIndex: 2 }}
      >
        <RotateCcw />
      </div>

      {/* 操作提示 */}
      <div 
        className="absolute bottom-0 right-0 p-4 text-sm text-gray-500 dark:text-gray-400"
        style={{ zIndex: 2 }}
      >
        <p>Left Click to pan</p>
        <p>Ctrl + Wheel to zoom</p>
      </div>

      <style jsx global>{`
        .dragging {
          cursor: grabbing !important;
        }
      `}</style>
    </div>
  );
};
