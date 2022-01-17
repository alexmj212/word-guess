import React from "react";

type ConfirmationDialogProps = {
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ onConfirm, onCancel, confirmText = "OK", children }) => {
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="my-4">{children}</div>
      <div className="flex flex-row flex-1 justify-center">
        <button className="button py-2" onClick={onCancel}>
          Cancel
        </button>
        <button className="button-action py-2" onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
