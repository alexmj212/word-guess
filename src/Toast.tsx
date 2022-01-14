import React, { useState } from "react";

export enum ToastTypes {
    DEFAULT = "bg-slate-300 dark:bg-slate-800",
    ERROR = "bg-red-400 dark:bg-red-700",
    WARN = "bg-yellow-400 dark:bg-yellow-700",
    SUCCESS = "bg-green-400 dark:bg-green-700"
}

type ToastProps = {
    type: ToastTypes;
    message: string;
}

const Toast: React.FC<ToastProps> = ({type, message}) => {
  return <div className={`button ${type}`}>{message}</div>;
};

export default Toast;
