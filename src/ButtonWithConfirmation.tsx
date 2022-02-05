import React from "react";
import { useConfirmationModalContext } from "./ConfirmationDialogContext";

type ButtonWithConfirmationType = {
  onClick: Function;
  className: string;
  children?: React.ReactNode;
};

export const ButtonWithConfirmation = ({ children, className, onClick }: ButtonWithConfirmationType) => {
  const modalContext = useConfirmationModalContext();

  const handleOnClick = async () => {
    const results = await modalContext?.showConfirmation();
    results && onClick();
  };

  return (
    <button className={className} onClick={handleOnClick}>
      {children}
    </button>
  );
};
