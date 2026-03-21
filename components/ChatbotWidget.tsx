"use client";

import { useMemo, useState } from "react";

type Step =
  | "intro"
  | "make"
  | "model"
  | "year"
  | "engine"
  | "part"
  | "loading"
  | "done";

type QuoteResult = {
  title?: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  partType: string;
  price: string;
  currency: string;
  inventoryQty?: number | null;
};

type QuoteApiResponse = {
  success: boolean;
  message: string;
  result?: QuoteResult;
};

type ChatMessage = {
  sender: "bot" | "user";
  text: string;
};

export default function ChatbotWidget() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "14160000000";
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER || "+1 416-000-0000";

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [partType, setPartType] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Hi 👋 Welcome to Lare Auto.",
    },
    {
      sender: "bot",
      text: "I can help you find your part price quickly.",
    },
    {
      sender: "bot",
      text: "Click Start and I’ll ask for your vehicle details.",
    },
  ]);

  const whatsappUrl = useMemo(() => {
    const text = encodeURIComponent(
      [
        "Hi, I need help with this part request:",
        `Make: ${make || "-"}`,
        `Model: ${model || "-"}`,
        `Year: ${year || "-"}`,
        `Engine: ${engine || "-"}`,
        `Part: ${partType || "-"}`,
      ].join("\n")
    );

    return `https://wa.me/${whatsappNumber}?text=${text}`;
  }, [whatsappNumber, make, model, year, engine, partType]);

  function addBotMessage(text: string) {
    setMessages((prev) => [...prev, { sender: "bot", text }]);
  }

  function addUserMessage(text: string) {
    setMessages((prev) => [...prev, { sender: "user", text }]);
  }

  function startChat() {
    addBotMessage("Please enter your vehicle make.");
    setStep("make");
  }

  function resetChat() {
    setStep("intro");
    setInput("");
    setIsLoading(false);

    setMake("");
    setModel("");
    setYear("");
    setEngine("");
    setPartType("");

    setMessages([
      {
        sender: "bot",
        text: "Hi 👋 Welcome to Lare Auto.",
      },
      {
        sender: "bot",
        text: "I can help you find your part price quickly.",
      },
      {
        sender: "bot",
        text: "Click Start and I’ll ask for your vehicle details.",
      },
    ]);
  }

  async function submitStep() {
    const value = input.trim();
    if (!value || isLoading) return;

    if (step === "make") {
      setMake(value);
      addUserMessage(value);
      addBotMessage("Please enter your vehicle model.");
      setInput("");
      setStep("model");
      return;
    }

    if (step === "model") {
      setModel(value);
      addUserMessage(value);
      addBotMessage("Please enter your vehicle year.");
      setInput("");
      setStep("year");
      return;
    }

    if (step === "year") {
      if (!/^\d{4}$/.test(value)) {
        addBotMessage("Please enter a valid 4-digit year, for example 2018.");
        return;
      }

      setYear(value);
      addUserMessage(value);
      addBotMessage("Please enter your engine, for example 2.0L I4.");
      setInput("");
      setStep("engine");
      return;
    }

    if (step === "engine") {
      setEngine(value);
      addUserMessage(value);
      addBotMessage("Please enter the part name, for example brake pads.");
      setInput("");
      setStep("part");
      return;
    }

    if (step === "part") {
      const finalPart = value;
      setPartType(finalPart);
      addUserMessage(finalPart);

      setInput("");
      setStep("loading");
      setIsLoading(true);

      try {
        const response = await fetch("/api/chatbot/quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            make,
            model,
            year: Number(year),
            engine,
            partType: finalPart,
          }),
        });

        const data: QuoteApiResponse = await response.json();

        if (!response.ok || !data.success || !data.result) {
          addBotMessage(
            data.message ||
              "Sorry, I could not find an exact match right now. Please contact us on WhatsApp and we’ll help you manually."
          );
          setStep("done");
          return;
        }

        const stockText =
          typeof data.result.inventoryQty === "number"
            ? `Stock: ${data.result.inventoryQty > 0 ? `${data.result.inventoryQty} available` : "Currently unavailable"}`
            : "";

        addBotMessage(
          [
            "Thank you. I found a match for your request.",
            data.result.title ? `Part: ${data.result.title}` : `Part: ${data.result.partType}`,
            `Vehicle: ${data.result.make} ${data.result.model} ${data.result.year} ${data.result.engine}`,
            `Price: ${data.result.price} ${data.result.currency}`,
            stockText,
            "Please note: taxes and delivery charges are extra.",
          ]
            .filter(Boolean)
            .join("\n")
        );

        setStep("done");
      } catch (error) {
        addBotMessage(
          "Something went wrong while checking the price. Please try again or contact us on WhatsApp."
        );
        setStep("done");
      } finally {
        setIsLoading(false);
      }
    }
  }

  const canType = ["make", "model", "year", "engine", "part"].includes(step);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="la-chatbot-fab"
        aria-label="Open Lare Auto chatbot"
      >
        Chat
      </button>

      {isOpen && (
        <div className="la-chatbot-panel">
          <div className="la-chatbot-header">
            <div>
              <div className="la-chatbot-title">Lare Auto Assistant</div>
              <div className="la-chatbot-subtitle">Fast part quote help</div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="la-chatbot-close"
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          <div className="la-chatbot-body">
            {messages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
                className={
                  message.sender === "user"
                    ? "la-chatbot-bubble la-chatbot-bubble-user"
                    : "la-chatbot-bubble la-chatbot-bubble-bot"
                }
              >
                {message.text.split("\n").map((line, lineIndex) => (
                  <div key={lineIndex}>{line}</div>
                ))}
              </div>
            ))}

            {step === "intro" && (
              <div className="la-chatbot-actions">
                <button type="button" onClick={startChat} className="la-chatbot-primary-btn">
                  Start
                </button>
              </div>
            )}

            {step === "loading" && (
              <div className="la-chatbot-bubble la-chatbot-bubble-bot">
                Checking price...
              </div>
            )}
          </div>

          {canType && (
            <div className="la-chatbot-input-wrap">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitStep();
                  }
                }}
                placeholder="Type here..."
                className="la-chatbot-input"
              />
              <button
                type="button"
                onClick={submitStep}
                className="la-chatbot-send-btn"
              >
                Send
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="la-chatbot-footer-actions">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="la-chatbot-primary-btn"
              >
                WhatsApp Us
              </a>

              <a href={`tel:${phoneNumber.replace(/\s+/g, "")}`} className="la-chatbot-secondary-btn">
                Call Us
              </a>

              <button type="button" onClick={resetChat} className="la-chatbot-secondary-btn">
                New Search
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}