import React from "react";

interface MessageDisplayProps {
  message: {
    type: "success" | "error";
    text: string;
  } | null;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      className={`mb-6 p-4 rounded-xl shadow-lg ${
        message.type === "success"
          ? "bg-green-100 border-l-4 border-green-500 text-green-700"
          : "bg-red-100 border-l-4 border-red-500 text-red-700"
      }`}
    >
      {message.text}
    </div>
  );
};

export default MessageDisplay;
