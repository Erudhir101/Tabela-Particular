"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Optimized Cell Component to prevent typing lag
const EditableCell = ({
  initialValue,
  onSave,
}: {
  initialValue: string;
  onSave: (val: string) => void;
}) => {
  const [value, setValue] = useState(initialValue);

  // Sync with external changes (like when data is re-fetched)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== initialValue) onSave(value);
      }}
      className="w-full px-2 py-1 bg-transparent border-none focus:ring-2 focus:ring-blue-500/30 rounded text-sm text-slate-700"
    />
  );
};

export default function GoogleCsvPage() {
  const [data, setData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [shouldScroll, setShouldScroll] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (shouldScroll && tableContainerRef.current) {
      tableContainerRef.current.scrollTop =
        tableContainerRef.current.scrollHeight;
      setShouldScroll(false);
    }
  }, [data, shouldScroll]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/google-sheets");
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = useCallback(
    (rowIndex: number, colIndex: number, value: string) => {
      setData((prevData) => {
        const newData = [...prevData];
        newData[rowIndex][colIndex + 2] = value;
        return newData;
      });
    },
    [],
  );

  const saveChanges = async (currentData?: string[][]) => {
    const dataToSave = currentData || data;
    setSaving(true);
    try {
      const res = await fetch("/api/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: dataToSave }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addRow = async () => {
    if (!data || data.length === 0) return;

    const numCols = data[0]?.length || 7;
    console.log("tamanho ", data.length);
    const newRow = Array(numCols).fill("");

    const newData = [...data, newRow];

    setData(newData);
    setShouldScroll(true);
    await saveChanges(newData);
  };

  const deleteSelectedRows = async () => {
    if (selectedRows.length === 0) return;
    console.log(selectedRows);
    if (
      !confirm(
        `Tem certeza que deseja excluir ${selectedRows.length} linha(s)?`,
      )
    )
      return;

    // Filter out the selected indices
    const newData = data.filter((_, index) => !selectedRows.includes(index));

    setData(newData);
    setSelectedRows([]);
    await saveChanges(newData);
  };

  const toggleRowSelection = (index: number) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayData = data.slice(4);
  const headerRow = data[3] || [];

  return (
    <main className="h-full bg-slate-100 py-6 px-4 sm:px-6 lg:px-8 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h1 className="text-3xl font-bold text-slate-800">
            Pardini Atualizado (Real-time)
          </h1>
          <div className="flex items-center gap-3">
            {selectedRows.length > 0 && (
              <button
                onClick={deleteSelectedRows}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <span>🗑️</span>
                Excluir ({selectedRows.length})
              </button>
            )}
            <button
              onClick={addRow}
              disabled={saving}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Adicionar Linha"}
            </button>
            <button
              onClick={() => saveChanges()}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 shrink-0">
            <p className="text-red-700">Erro: {error}</p>
            <p className="text-xs text-red-500 mt-1">
              Verifique se as variáveis de ambiente
              GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY e GOOGLE_SHEET_ID
              estão configuradas.
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
          <div
            ref={tableContainerRef}
            className="overflow-auto flex-1 custom-scrollbar"
          >
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200">
                  {/* Selection column header without checkbox */}
                  <th className="px-4 py-3 w-10 bg-slate-50 border-r border-slate-200">
                    <span className="sr-only">Selecionar</span>
                  </th>
                  {headerRow.slice(2).map((header, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-0 bg-slate-50"
                    >
                      {header || `Coluna ${i + 3}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayData.map((row, rowIndex) => {
                  const actualIndex = rowIndex + 4; // Offset to match the original data index
                  return (
                    <tr
                      key={actualIndex}
                      className={`transition-colors ${selectedRows.includes(actualIndex) ? "bg-blue-50/50" : "hover:bg-blue-50/30"}`}
                    >
                      <td className="px-4 py-1 text-center border-r border-slate-100">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(actualIndex)}
                          onChange={() => toggleRowSelection(actualIndex)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      {row.slice(2).map((cell, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-2 py-1 border-r border-slate-100 last:border-0"
                        >
                          <EditableCell
                            initialValue={cell}
                            onSave={(val) =>
                              handleCellChange(actualIndex, colIndex, val)
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
