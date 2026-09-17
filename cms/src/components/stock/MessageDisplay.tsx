import React from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface MessageDisplayProps {
  message: {
    type: "success" | "error";
    text: string;
  } | null;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  if (!message) return null;

  const isSuccess = message.type === "success";
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const borderColor = isSuccess ? "border-green-200" : "border-red-200";
  const textColor = isSuccess ? "text-green-800" : "text-red-800";
  const iconColor = isSuccess ? "text-green-400" : "text-red-400";
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-6`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{message.text}</p>
        </div>
      </div>
    </div>
  );
};

export default MessageDisplay;
