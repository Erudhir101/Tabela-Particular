"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Canvg } from "canvg";

interface Procedimento {
  Lactobacillus: number;
  descricao: string;
  preco: number;
  prazo: number;
  especialidade: any;
  titulo: string;
  [key: string]: any;
}

export function SelectionFilter() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Procedimento[]>([]);

  useEffect(() => {
    const fetchProcedimentos = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("particular").select("*");

      if (error) {
        console.error("Error fetching data from Supabase:", error);
      } else if (data) {
        console.log("todas as datas", data);
        const uniqueData = [
          ...new Map(
            data.map((item) => [item.descricao.toLocaleLowerCase(), item]),
          ).values(),
        ];
        setProcedimentos(uniqueData);
      }
      setLoading(false);
    };

    fetchProcedimentos();
  }, []);

  const totalValue = selectedItems.reduce((acc, item) => {
    const price =
      typeof item.preco === "number"
        ? item.preco
        : parseFloat(String(item.preco).replace(/,/g, ""));
    return acc + (price || 0);
  }, 0);

  const generatePdf = async () => {
    const doc = new jsPDF();

    // --- SVG to PNG Conversion ---
    const svgString =
      '<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1155 1000"><path d="m577.3 0 577.4 1000H0z" fill="#000"/></svg>';
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const v = Canvg.fromString(ctx, svgString);
      await v.render();
      const pngDataUrl = canvas.toDataURL("image/png");
      doc.addImage(pngDataUrl, "PNG", 14, 10, 20, 18);
    }

    // Header Text
    doc.setFontSize(10);
    doc.text("Laboratório Lab", 40, 15);
    doc.text("Rua da Empresa, 123", 40, 20);
    doc.text("email@empresa.com", 40, 25);

    doc.setFontSize(16);
    doc.text("Orçamento de Procedimentos", 14, 40);

    const tableColumn = ["Descrição", "Preço (R$)"];
    const tableRows: (string | number)[][] = [];

    selectedItems.forEach((item) => {
      const itemData = [
        item.descricao,
        (typeof item.preco === "number"
          ? item.preco
          : parseFloat(String(item.preco).replace(/,/g, ""))
        ).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        }),
      ];
      tableRows.push(itemData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      foot: [
        [
          "Total",
          totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
        ],
      ],
      footStyles: { fontStyle: "bold" },
    });

    doc.save("orcamento-procedimentos.pdf");
  };

  const filteredItems = procedimentos.filter((item) =>
    item.descricao.toLowerCase().includes(query.toLowerCase()),
  );

  const toggleItem = (item: Procedimento) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
    setQuery("");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

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
              key={item.descricao}
              onClick={() => toggleItem(item)}
              className={`p-3 cursor-pointer hover:opacity-20 transition ${
                selectedItems.includes(item)
                  ? "bg-foreground text-background cursor-pointer"
                  : ""
              }`}
            >
              {item.descricao} {selectedItems.includes(item) && "✓"}
            </li>
          ))}
        </ul>
      </div>
      <div className="self-stretch p-5 flex flex-col gap-5 min-w-1/2 border rounded-md border-foreground">
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
          <span className="text-foreground font-bold mb-4">
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
          <h2 className="text-2xl text-bold bg-blue-600 p-2 rounded-sm text-center mb-2">
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
          <span className="text-foreground font-bold mb-4">
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
          <span className="text-foreground font-bold">
            Prazo para sair:
            {
              <span className="text-lg text-blue-500 font-normal px-2">
                {selectedItems.length === 0
                  ? 0
                  : Math.max(
                      ...selectedItems.map((item) =>
                        Number.isNaN(Number(item.prazo))
                          ? 0
                          : Number(item.prazo),
                      ),
                    )}
              </span>
            }
            Dias
          </span>
        </div>
        <button
          onClick={generatePdf}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed font-bold py-2 px-4 rounded"
          disabled={selectedItems.length === 0}
        >
          Gerar PDF
        </button>
        <div className="text-sm flex flex-col flex-wrap gap-2 mt-2">
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <span
                key={item.descricao}
                onClick={() => toggleItem(item)}
                className="flex justify-between bg-blue-100 text-blue-700 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-200 transition"
              >
                {item.descricao} {<span className="font-bold">×</span>}
              </span>
            ))
          ) : (
            <p className="text-xl text-gray-600 text-center italic">
              Não selecionado ainda.
            </p>
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
