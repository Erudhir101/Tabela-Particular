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

const AccordionItem = ({
  item,
  isSelected,
  onToggle,
}: {
  item: Procedimento;
  isSelected: boolean;
  onToggle: (item: Procedimento) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0 bg-white group">
      {/* Header / Trigger */}
      <div className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50">
        {/* Selection Area (Checkbox) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggle(item);
          }}
          className="cursor-pointer p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
              isSelected
                ? "bg-blue-500 border-blue-500 text-white shadow-sm scale-110"
                : "border-slate-300 bg-white group-hover:border-blue-300"
            }`}
          >
            {isSelected && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>

        {/* Title & Chevron (Click to Expand) */}
        <div
          className="flex-1 flex items-center justify-between cursor-pointer ml-3 select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span
            className={`font-medium text-sm transition-colors ${isOpen ? "text-blue-700" : "text-slate-700"}`}
          >
            {item.titulo || item.descricao}
          </span>
          <div
            className={`transition-transform duration-300 ease-out text-slate-400 p-1 rounded-full hover:bg-slate-100 ${
              isOpen ? "rotate-180 text-blue-500 bg-blue-50" : ""
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-sm text-slate-600 animate-fade-in space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Descrição
              </span>
              <p className="mt-1 text-slate-700 leading-relaxed">
                {item.descricao}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex flex-col bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Preço
                </span>
                <span className="font-semibold text-green-600">
                  {(typeof item.preco === "number"
                    ? item.preco
                    : parseFloat(String(item.preco).replace(/,/g, ""))
                  ).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>

              {item.prazo && (
                <div className="flex flex-col bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Prazo
                  </span>
                  <span className="font-semibold text-blue-600">
                    {item.prazo} dias
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function SelectionFilter() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Procedimento[]>([]);

  useEffect(() => {
    console.log("Supabase URL from env:", process.env.NEXT_PUBLIC_SUPABASE_URL);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">
            Carregando procedimentos...
          </p>
        </div>
      </div>
    );
  }

  // Preços calculados
  const precoCartao2X =
    selectedItems.length === 1 &&
    selectedItems[0].DESCRIÇÃO === "PLACENTA, CORDÃO E MEMBRANAS"
      ? 480
      : selectedItems.length >= 2
        ? 0.96 * totalValue
        : totalValue;

  const precoPix =
    selectedItems.length === 1 &&
    selectedItems[0].DESCRIÇÃO === "PLACENTA, CORDÃO E MEMBRANAS"
      ? 450
      : selectedItems.length >= 2
        ? 0.92 * totalValue
        : totalValue;

  const precoPixNaoAtendido =
    totalValue > 500 ? 0.75 * totalValue : 0.85 * totalValue;
  const precoCartao2XNaoAtendido =
    totalValue > 500 ? 0.75 * totalValue : 0.85 * totalValue;

  const prazoMaximo =
    selectedItems.length === 0
      ? 0
      : Math.max(
          ...selectedItems.map((item) =>
            Number.isNaN(Number(item.prazo)) ? 0 : Number(item.prazo),
          ),
        );

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
      {/* Coluna da Esquerda - Busca e Lista */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">🔍</span>
            Buscar Procedimentos
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Digite o nome do procedimento..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredItems.length > 0) {
                  toggleItem(filteredItems[0]);
                }
              }}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 hover:border-slate-300 bg-white/70 backdrop-blur-sm text-slate-800 placeholder:text-slate-400 pl-11"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              ⚡
            </span>
          </div>

          <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden max-h-125 overflow-y-auto custom-scrollbar shadow-sm bg-white">
            <div className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <AccordionItem
                  key={item.descricao}
                  item={item}
                  isSelected={selectedItems.includes(item)}
                  onToggle={toggleItem}
                />
              ))}
              {filteredItems.length === 0 && (
                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-2xl">
                    🔍
                  </div>
                  <p className="font-medium">Nenhum procedimento encontrado.</p>
                  <p className="text-xs mt-1 text-slate-400">
                    Tente buscar por outro termo
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Coluna da Direita - Resumo e Orçamento */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 p-2 flex items-center gap-2">
            Resumo do Orçamento
          </h2>

          <div className="space-y-4">
            {/* Cards de Preço */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">
                Preço Total
              </span>
              <span className="text-lg font-bold text-slate-800">
                {totalValue.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex flex-col">
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
                  Pagamento PIX
                </span>
                <span className="text-xl font-bold text-green-700">
                  {precoPix.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
                <span className="text-xs text-green-600 mt-1">
                  {selectedItems.length >= 2 ? "Desconto aplicado" : "À vista"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex flex-col">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                  Cartão 2x
                </span>
                <span className="text-xl font-bold text-blue-700">
                  {precoCartao2X.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            </div>

            <div className="my-6 border-t border-dashed border-slate-200"></div>

            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center">
                <span className="mr-2">⚠️</span> Convênios Não Atendidos
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700">Preço PIX:</span>
                  <span className="font-bold text-orange-800">
                    {precoPixNaoAtendido.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700">Cartão 2x:</span>
                  <span className="font-bold text-orange-800">
                    {precoCartao2XNaoAtendido.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-600 pt-2">
              <span>Quantidade:</span>
              <span className="font-medium bg-slate-100 px-2 py-1 rounded-full">
                {selectedItems.length} exames
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Prazo estimado:</span>
              <span className="font-medium bg-slate-100 px-2 py-1 rounded-full">
                {prazoMaximo} dias úteis
              </span>
            </div>

            <button
              onClick={generatePdf}
              disabled={selectedItems.length === 0}
              className="w-full mt-4 px-4 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Gerar PDF do Orçamento
            </button>
          </div>

          {/* Tags Selecionadas */}
          {selectedItems.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                Itens Selecionados
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedItems.map((item) => (
                  <span
                    key={item.descricao}
                    onClick={() => toggleItem(item)}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-red-100 hover:text-red-700 cursor-pointer transition-colors duration-200"
                  >
                    {item.descricao}
                    <span className="ml-1.5 font-bold text-lg leading-none">
                      ×
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto mb-10 text-center animate-fade-in-down">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
          <span className="bg-linear-to-r from-blue-900 via-blue-700 to-indigo-800 bg-clip-text text-transparent">
            Tabela Particular
          </span>
        </h1>
        <p className="text-slate-500 text-lg">
          Selecione os procedimentos para gerar um orçamento detalhado
        </p>
      </div>
      <SelectionFilter />
    </main>
  );
}
