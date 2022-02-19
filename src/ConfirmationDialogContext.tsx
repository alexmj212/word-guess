import { useContext, useRef, useState } from "react";
import * as React from "react";
import Modal from "./Modal";

type ConfirmationModalInterface = {
  children?: React.ReactNode;
  confirmText: string;
  confirmButtonText: string;
};

interface ConfirmationModalContextInterface {
  showConfirmation: () => Promise<boolean>;
}

export const ConfirmationModalContext =
  React.createContext<ConfirmationModalContextInterface | null>(null);

const ConfirmationModalContextProvider = ({
  children,
  confirmText,
  confirmButtonText,
}: ConfirmationModalInterface) => {
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
      <Modal
        open={showConfirmationModal}
        setOpen={setShowConfirmationModal}
        title="Confirm"
      >
        <div className="flex flex-auto flex-col">
          <div className="flex flex-auto flex-row justify-center my-8">
            {confirmText}
          </div>
          <div className="flex flex-auto flex-row justify-end flex-1 space-x-4">
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

export const useConfirmationModalContext = () =>
  useContext(ConfirmationModalContext);
export default ConfirmationModalContextProvider;
