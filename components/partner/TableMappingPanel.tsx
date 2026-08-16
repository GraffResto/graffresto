"use client";

import React, { useState } from "react";
import { Layers, CheckCircle2, Save, Link2, Sparkles, AlertCircle } from "lucide-react";
import { db, doc, updateDoc } from "@/lib/firebase";

interface SpatialNodeBinding {
  nodeName: string;
  mappedTableNumber: string;
  seats: number;
}

interface TableMappingPanelProps {
  restaurantId: string;
  discoveredNodes?: string[];
  posTables?: { id: string; name: string; seats: number }[];
}

export default function TableMappingPanel({
  restaurantId,
  discoveredNodes = [
    "Table_01",
    "Table_02",
    "Table_03",
    "Table_04",
    "Table_05",
    "Booth_01",
    "Booth_02",
    "VIP_Table_01",
  ],
  posTables = [
    { id: "t1", name: "Table 1 (Main Hall)", seats: 4 },
    { id: "t2", name: "Table 2 (Main Hall)", seats: 4 },
    { id: "t3", name: "Table 3 (Main Hall)", seats: 6 },
    { id: "t4", name: "Table 4 (Terrace)", seats: 2 },
    { id: "t5", name: "Table 5 (VIP)", seats: 8 },
    { id: "t6", name: "Table 6 (Terrace)", seats: 4 },
  ],
}: TableMappingPanelProps) {
  const [bindings, setBindings] = useState<Record<string, string>>({
    Table_01: "t1",
    Table_02: "t2",
    Table_03: "t3",
    Table_04: "t4",
    Table_05: "t5",
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  function handleSelectMapping(nodeName: string, tableId: string) {
    setBindings((prev) => ({
      ...prev,
      [nodeName]: tableId,
    }));
  }

  async function handleSaveMappings() {
    setSaving(true);
    setSaveSuccess(false);

    try {
      if (restaurantId) {
        const restRef = doc(db, "restaurants", restaurantId);
        await updateDoc(restRef, {
          spatial_table_mappings: bindings,
          updated_at: new Date().toISOString(),
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving spatial table mappings:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">3D Spatial Node Mapping Utility</h3>
            <p className="text-xs text-slate-500 font-medium">
              Map extracted GLB 3D scene nodes to physical POS table IDs
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveMappings}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 disabled:opacity-50 transition"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save Mappings"}
        </button>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-600">
          <CheckCircle2 size={16} />
          <span>Spatial table node mappings saved to Firestore successfully!</span>
        </div>
      )}

      {/* Dual Column Mapper */}
      <div className="space-y-3">
        <div className="grid grid-cols-12 bg-slate-50 p-3.5 rounded-2xl text-[10px] font-black uppercase text-slate-400">
          <div className="col-span-5">Extracted 3D Mesh Node</div>
          <div className="col-span-2 text-center">Binding</div>
          <div className="col-span-5">Physical POS Table</div>
        </div>

        {discoveredNodes.map((nodeName) => (
          <div
            key={nodeName}
            className="grid grid-cols-12 items-center p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition text-xs font-bold"
          >
            {/* Left: 3D Scene Graph Node */}
            <div className="col-span-5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="font-mono text-slate-900">{nodeName}</span>
            </div>

            {/* Middle Icon */}
            <div className="col-span-2 flex justify-center text-slate-400">
              <Link2 size={16} />
            </div>

            {/* Right: Dropdown of POS Tables */}
            <div className="col-span-5">
              <select
                value={bindings[nodeName] || ""}
                onChange={(e) => handleSelectMapping(nodeName, e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
              >
                <option value="">-- Select POS Table --</option>
                {posTables.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name} ({pt.seats} seats)
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
