import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { setGlobalConfirm } from '../lib/notify'

interface ConfirmOptions {
  title?: string
  message: string
  okText?: string
  cancelText?: string
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

interface ConfirmDialogContextType {
  confirm: ConfirmFn
}

const ConfirmDialogContext = createContext<
  ConfirmDialogContextType | undefined
>(undefined)

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error(
      'useConfirmDialog must be used within ConfirmDialogProvider'
    )
  }
  return context
}

interface ConfirmState {
  isOpen: boolean
  title?: string
  message: string
  okText: string
  cancelText: string
  resolve?: (value: boolean) => void
}

/** Isolated dialog state — opening confirm only re-renders this subtree. */
function ConfirmDialogHost({
  confirmRef,
}: {
  confirmRef: React.MutableRefObject<ConfirmFn | undefined>
}) {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    okText: 'Confirm',
    cancelText: 'Cancel',
  })

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title,
        message: options.message,
        okText: options.okText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        resolve,
      })
    })
  }, [])

  useEffect(() => {
    confirmRef.current = confirm
    setGlobalConfirm(confirm)
  }, [confirm, confirmRef])

  const handleClose = useCallback((result: boolean) => {
    setState((prev) => {
      prev.resolve?.(result)
      return {
        ...prev,
        isOpen: false,
        resolve: undefined,
      }
    })
  }, [])

  return (
    <AlertDialog
      open={state.isOpen}
      onOpenChange={(open) => !open && handleClose(false)}
    >
      <AlertDialogContent>
        <div className="flex flex-col gap-5 text-center">
          {state.title && (
            <AlertDialogTitle className="text-xl">
              {state.title}
            </AlertDialogTitle>
          )}
          <AlertDialogDescription className="text-[var(--text-primary)] text-base font-medium">
            {state.message}
          </AlertDialogDescription>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleClose(false)}>
            {state.cancelText}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => handleClose(true)}>
            {state.okText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const confirmRef = useRef<ConfirmFn>()

  const contextValue = useMemo<ConfirmDialogContextType>(
    () => ({
      confirm: (options) =>
        confirmRef.current
          ? confirmRef.current(options)
          : Promise.resolve(false),
    }),
    []
  )

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <ConfirmDialogHost confirmRef={confirmRef} />
    </ConfirmDialogContext.Provider>
  )
}
