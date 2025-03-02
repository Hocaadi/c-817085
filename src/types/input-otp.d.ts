// Type definitions for input-otp
declare module 'input-otp' {
  import * as React from 'react'

  // Define the basic context interface
  export interface InputOTPContext {
    slots: React.ReactNode[]
    empty: boolean
    [key: string]: any
  }

  // Define the provider props
  export interface InputOTPProviderProps {
    value?: string
    onChange?: (value: string) => void
    maxLength?: number
    children: React.ReactNode
  }

  // Define the provider component
  export function InputOTPProvider(props: InputOTPProviderProps): JSX.Element

  // Export the context for useInputOTPContext
  export const InputOTPContext: React.Context<InputOTPContext>

  // Custom hook to use the context
  export function useInputOTPContext(): InputOTPContext
} 