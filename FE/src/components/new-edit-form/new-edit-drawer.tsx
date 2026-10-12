'use client';

import { Button, ButtonProps, Drawer, DrawerProps } from '@mui/material';
import React, { createContext, forwardRef, useCallback, useContext, useMemo, useState } from 'react';

type DrawerContextType = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

type DrawerTriggerProps = ButtonProps;
type DrawerContentProps = DrawerProps;

type NewEditDrawerProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
};

const DrawerContext = createContext<DrawerContextType | null>(null);

function NewEditDrawer({
  children,
  open: controlledOpen,
  onOpen: controlledOnOpen,
  onClose: controlledOnClose,
}: NewEditDrawerProps) {
  const [internalOpen, setInternalOpen] = useState<boolean>(false);

  const isControlled = typeof controlledOpen === 'boolean';
  const open = isControlled ? controlledOpen : internalOpen;

  const onOpen = useCallback(() => {
    if (controlledOnOpen) {
      controlledOnOpen();
    }
    if (!isControlled) {
      setInternalOpen(true);
    }
  }, [controlledOnOpen, isControlled]);

  const onClose = useCallback(() => {
    if (controlledOnClose) {
      controlledOnClose();
    }
    if (!isControlled) {
      setInternalOpen(false);
    }
  }, [controlledOnClose, isControlled]);

  const value = useMemo(() => ({ open, onOpen, onClose }), [open, onOpen, onClose]);

  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

const DrawerTrigger = forwardRef<HTMLButtonElement, DrawerTriggerProps>(function DrawerTrigger(
  { onClick, ...props },
  ref
) {
  const context = useContext(DrawerContext);
  if (!context) throw new Error('DrawerTrigger must be used within NewEditDrawer');
  const { onOpen } = context;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    onOpen();
  };

  return <Button ref={ref} {...props} onClick={handleClick} />;
});

function DrawerContent(props: DrawerContentProps) {
  const context = useContext(DrawerContext);
  if (!context) throw new Error('DrawerContent must be used within NewEditDrawer');
  const { open, onClose } = context;
  return <Drawer {...props} open={open} onClose={onClose} />;
}

function useNewEditDrawer() {
  return useContext(DrawerContext);
}

export default NewEditDrawer;
export { DrawerTrigger, DrawerContent, useNewEditDrawer };

