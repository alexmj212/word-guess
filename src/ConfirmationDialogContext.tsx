import React, { useContext, useRef, useState } from "react";
import Modal from "./Modal";

type ConfirmationModalInterface = {
  children?: React.ReactNode;
  confirmText: string;
  confirmButtonText: string;
};

interface ConfirmationModalContextInterface {
  showConfirmation: () => Promise<boolean>;
}

export const ConfirmationModalContext = React.createContext<ConfirmationModalContextInterface | null>(null);

const ConfirmationModalContextProvider = ({ children, confirmText, confirmButtonText }: ConfirmationModalInterface) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const resolver = useRef<(v: boolean) => void>();

  const handleShow = () => {
    setShowConfirmationModal(true);

    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  };

  const handleOk = () => {
    setShowConfirmationModal(false);
    resolver.current && resolver.current(true);
  };

  const handleCancel = () => {
    setShowConfirmationModal(false);
    resolver.current && resolver.current(false);
  };

  return (
    <ConfirmationModalContext.Provider value={{ showConfirmation: handleShow }}>
      {children}
      <Modal open={showConfirmationModal} setOpen={setShowConfirmationModal} title="Confirm">
        <div className="flex flex-col justify-center items-center">
          <div className="my-4">{confirmText}</div>
          <div className="flex flex-row flex-1 justify-center space-x-4">
            <button className="button py-2" onClick={handleCancel}>
              Cancel
            </button>
            <button className="button-negative py-2" onClick={handleOk}>
              {confirmButtonText}
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmationModalContext.Provider>
  );
};

export const useConfirmationModalContext = () => useContext(ConfirmationModalContext);
export default ConfirmationModalContextProvider;
