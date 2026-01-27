"use client";
// import Papa from "papaparse";
import procedimentosJson from "./tabela-procedimentos.json";
import { useState } from "react";

/*
"Lactobacillus": 1,
"DESCRIÇÃO": "BIOPSIA DE ENDOMETRIO",
"PREÇO": 275,
"DESCRIÇÃO INTERNA": "Avaliar se foi solicitado IMUNO-HISTOQUÍMICA",
"PRAZOS": "",
"EXAME (PARCEIROS)": "BIOPSIA DE ENDOMETRIO",
"DESCRIÇÃO (PARCEIROS)": "Avaliar se foi solicitado IMUNO-HISTOQUÍMICA",
"não exibir para clinica": "",
"ESPECIALIDADE": "GINECO",
*/
export function SelectionFilter() {
  const [procedimentos] = useState(procedimentosJson);
  const [query, setQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<typeof procedimentosJson>(
    [],
  );

  const totalValue = selectedItems.reduce((acc, item) => {
    const price =
      typeof item.PREÇO === "number"
        ? item.PREÇO
        : parseFloat(item.PREÇO.replace(/,/g, ""));
    return acc + (price || 0);
  }, 0);

  const filteredItems = procedimentos.filter((item) =>
    item.DESCRIÇÃO.toLowerCase().includes(query.toLowerCase()),
  );

  const toggleItem = (item: (typeof procedimentosJson)[0]) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
    setQuery("");
  };

  return (
    <div className="p-10 mx-auto gap-5 flex flex-col sm:flex-row sm:items-center">
      <div className="flex-1 min-w-1/2">
        <input
          type="text"
          placeholder="Digite o Procedimento..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filteredItems.length > 0) {
              toggleItem(filteredItems[0]);
            }
          }}
          className="border p-2 w-full rounded shadow-sm text-foreground"
        />

        <ul className="text-sm mt-4 border rounded-md divide-y overflow-hidden">
          {filteredItems.map((item) => (
            <li
              key={item.Lactobacillus}
              onClick={() => toggleItem(item)}
              className={`p-3 cursor-pointer hover:opacity-20 transition ${
                selectedItems.includes(item)
                  ? "bg-foreground text-background cursor-pointer"
                  : ""
              }`}
            >
              {item.DESCRIÇÃO} {selectedItems.includes(item) && "✓"}
            </li>
          ))}
        </ul>
      </div>
      <div className="self-stretch p-5 flex flex-col gap-5 min-w-1/2 border border-foreground">
        <div className="flex flex-col justify-between">
          <span className="text-foreground font-bold">
            Preço Total:
            {
              <span className="text-lg text-green-500 font-normal pl-2">
                {totalValue}
              </span>
            }
          </span>
          <span className="text-foreground font-bold">
            Preço Cartão 2X:
            {
              <span className="text-lg text-green-500 font-normal pl-2">
                {selectedItems.length === 1 &&
                selectedItems[0].DESCRIÇÃO === "PLACENTA, CORDÃO E MEMBRANAS"
                  ? 480
                  : selectedItems.length >= 2
                    ? 0.96 * totalValue
                    : totalValue}
              </span>
            }
          </span>
          <span className="text-foreground font-bold">
            Preço PIX:
            {
              <span className="text-lg text-green-500 font-normal pl-2">
                {selectedItems.length === 1 &&
                selectedItems[0].DESCRIÇÃO === "PLACENTA, CORDÃO E MEMBRANAS"
                  ? 450
                  : selectedItems.length >= 2
                    ? 0.92 * totalValue
                    : totalValue}
              </span>
            }
          </span>
          <h2 className="text-2xl text-bold bg-blue-600">
            Convênios Não Atendidos pelo LAB
          </h2>
          <span className="text-foreground font-bold">
            Preço PIX:
            {
              <span className="text-lg text-green-500 font-normal pl-2">
                {totalValue > 500 ? 0.75 * totalValue : 0.85 * totalValue}
              </span>
            }
          </span>
          <span className="text-foreground font-bold">
            Preço Cartão 2X:
            {
              <span className="text-lg text-green-500 font-normal pl-2">
                {totalValue > 500 ? 0.75 * totalValue : 0.85 * totalValue}
              </span>
            }
          </span>
          <span className="text-foreground font-bold">
            Quantidade de Exames:
            {
              <span className="text-lg text-blue-500 font-normal pl-2">
                {selectedItems.length}
              </span>
            }
          </span>
        </div>
        <div className="text-sm flex flex-col flex-wrap gap-2 mt-2">
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <span
                key={item.Lactobacillus}
                onClick={() => toggleItem(item)}
                className="flex justify-between bg-blue-100 text-blue-700 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-200 transition"
              >
                {item.DESCRIÇÃO} {<span className="font-bold">×</span>}
              </span>
            ))
          ) : (
            <p className="text-gray-400 italic">Não selecionado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start mt-3">
      <h1 className="text-4xl font-bold mb-15">Tabela Particular</h1>
      <SelectionFilter />
    </main>
  );
}
