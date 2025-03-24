"use client"

import * as React from "react"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorPopupProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  error?: Error | string
  details?: string
}

export function ErrorPopup({ 
  isOpen, 
  onClose, 
  title = "An error occurred", 
  error,
  details
}: ErrorPopupProps) {
  const errorMessage = error instanceof Error ? error.message : error

  if (!isOpen) return null;

  return (
    <div className="error-popup-container">
      <div className="error-popup-content">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-red-500">
            <XCircle className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        {errorMessage && (
          <div className="py-2 mb-2">
            {errorMessage}
          </div>
        )}
        
        {details && (
          <div className="py-2 mb-4 text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-[200px] font-mono">
            <strong>Details:</strong><br />
            {details}
          </div>
        )}
        
        <div className="flex justify-end">
          <Button onClick={onClose} variant="destructive">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// Context for managing the error popup state globally
interface ErrorPopupContextType {
  showError: (error: Error | string, title?: string, details?: string) => void
  hideError: () => void
}

const ErrorPopupContext = React.createContext<ErrorPopupContextType | undefined>(undefined)

export function ErrorPopupProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorState, setErrorState] = React.useState<{
    message?: Error | string
    title?: string
    details?: string
  }>({})

  const showError = React.useCallback((error: Error | string, title?: string, details?: string) => {
    console.log("Showing error popup:", { error, title, details });
    // Force body to have position relative to handle stacking context
    if (typeof document !== 'undefined') {
      document.body.style.position = 'relative';
    }
    setErrorState({ message: error, title, details })
    setIsOpen(true)
  }, [])

  const hideError = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <ErrorPopupContext.Provider value={{ showError, hideError }}>
      {children}
      <ErrorPopup
        isOpen={isOpen}
        onClose={hideError}
        title={errorState.title}
        error={errorState.message}
        details={errorState.details}
      />
    </ErrorPopupContext.Provider>
  )
}

export function useErrorPopup() {
  const context = React.useContext(ErrorPopupContext)
  
  if (context === undefined) {
    throw new Error("useErrorPopup must be used within an ErrorPopupProvider")
  }
  
  return context
} 