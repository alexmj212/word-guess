import React, { Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";

type ModalProps = {
  title: string;
  open: boolean;
  setOpen: (state: boolean) => void;
  isStatic?: boolean;
};

const Modal: React.FC<ModalProps> = ({ title, open, setOpen, isStatic = false, children }) => {
  const closeRef = useRef(null);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={setOpen} initialFocus={closeRef} static={isStatic}>
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Dialog.Overlay className="fixed inset-0 bg-neutral-900 bg-opacity-80 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="w-full sm:w-25 sm:max-w-lg inline-block align-bottom bg-white dark:bg-slate-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full">
              <div className="p-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex justify-between">
                      <Dialog.Title as="h3" className="text-2xl leading-10 font-medium">
                        {title}
                      </Dialog.Title>
                      <button className="button-base" onClick={() => setOpen(false)} ref={closeRef}>
                        <XIcon className="w-8 h-8"></XIcon>
                      </button>
                    </div>
                    <div className="mt-2">{children}</div>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default Modal;
