import { X } from "lucide-react";

interface MobileCloseButtonProps {
  onClose: () => void;
}

export const MobileCloseButton = ({ onClose }: MobileCloseButtonProps) => (
  <button
    data-close-button
    onClick={(e) => {
      e.stopPropagation();
      onClose();
    }}
    className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-[60]"
  >
    <X className="w-4 h-4 text-white" />
  </button>
);
