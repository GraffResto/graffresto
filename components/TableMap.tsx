"use client";

import { useState } from "react";
import { Armchair, Users } from "lucide-react";

export type RestaurantTable = {
  id: string;
  table_name: string;
  seats: number;
  zone: string | null;
  status: string;
  shape?: string | null;
  position_x?: number | null;
  position_y?: number | null;
  width?: number | null;
  height?: number | null;
  rotation?: number | null;
  color?: string | null;
};

type TableMapProps = {
  tables: RestaurantTable[];
  onSelectTable?: (table: RestaurantTable) => void;
};

export default function TableMap({ tables, onSelectTable }: TableMapProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const selectedTable = tables.find((table) => table.id === selectedTableId);

  function handleTableClick(table: RestaurantTable) {
    setSelectedTableId(table.id);
    if (onSelectTable) {
      onSelectTable(table);
    }
  }

  function getTableShape(table: RestaurantTable) {
    if (table.shape === "circle") {
      return "rounded-full";
    }
    return "rounded-2xl";
  }

  function getTableStyle(table: RestaurantTable) {
    const isSelected = selectedTableId === table.id;
    const isAvailable = table.status === "available";

    if (isSelected) {
      return "border-orange-500 bg-orange-500 text-white shadow-xl shadow-orange-200";
    }

    if (isAvailable) {
      return table.color ? "" : "border-blue-300 bg-blue-500 text-white hover:bg-blue-600";
    }

    return "cursor-not-allowed border-gray-300 bg-gray-600 text-gray-200 opacity-60";
  }

  return (
    <div className="rounded-[2rem] border border-orange-100 bg-[#151c27] p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Open Table Map</h2>
          <p className="mt-1 text-sm text-gray-400">
            Choose an available table from the interactive restaurant floor plan.
          </p>
        </div>

        <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white">
          Interactive Layout
        </div>
      </div>

      <div className="relative min-h-[480px] overflow-hidden rounded-3xl bg-[#1d2430] p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 text-xs text-gray-300">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-blue-500" />
              Available
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-gray-500" />
              Occupied/Booked
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-orange-500" />
              Selected
            </span>
          </div>
        </div>

        <div className="relative h-[420px] w-full overflow-auto rounded-2xl bg-[#161d29] p-4">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          {tables.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400 font-bold">
              No tables configured for this restaurant floor yet.
            </div>
          ) : (
            tables.map((table, index) => {
              const isAvailable = table.status === "available";
              const isSelected = selectedTableId === table.id;

              const positionX = table.position_x ?? (60 + (index % 4) * 140);
              const positionY = table.position_y ?? (50 + Math.floor(index / 4) * 120);
              const width = table.width ?? 100;
              const height = table.height ?? 100;
              const rotation = table.rotation ?? 0;

              return (
                <button
                  key={table.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleTableClick(table)}
                  style={{
                    left: positionX,
                    top: positionY,
                    width,
                    height,
                    backgroundColor: isSelected
                      ? "#f97316"
                      : isAvailable
                      ? table.color || "#38bdf8"
                      : "#6b7280",
                    transform: `rotate(${rotation}deg)`,
                  }}
                  className={`absolute flex flex-col items-center justify-center border-4 border-white/80 text-white shadow-md transition hover:scale-105 ${getTableShape(
                    table
                  )} ${getTableStyle(table)}`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <Armchair size={20} />
                    <span className="mt-0.5 text-xs font-semibold">
                      {table.seats} seats
                    </span>
                    <span className="text-base font-black">
                      {table.table_name}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-5 rounded-3xl bg-[#111827] p-4 text-white">
          {selectedTable ? (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-gray-400">Selected Table</p>
                <h3 className="mt-1 text-xl font-black text-orange-400">
                  {selectedTable.table_name} • {selectedTable.seats} seats
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  Zone: {selectedTable.zone || "Main Hall"}
                </p>
              </div>

              <div className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white">
                Table Selected
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Click any available table on the layout to select it for your reservation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}