import { X } from "lucide-react";

interface MobileCloseButtonProps {
  onClose: () => void;
}

export const MobileCloseButton = ({ onClose }: MobileCloseButtonProps) => (
  <button
    onClick={onClose}
    className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-50"
  >
    <X className="w-4 h-4 text-white" />
  </button>
);
