// Type definitions for input-otp
declare module 'input-otp' {
  import * as React from 'react'

  // Define the basic context interface
  export interface InputOTPContext {
    slots: React.ReactNode[]
    empty: boolean
    [key: string]: any
  }

  // Define the OTPInput component
  export interface OTPInputProps {
    maxLength?: number
    children: React.ReactNode
    className?: string
    containerClassName?: string
    ref?: React.ForwardedRef<any>
  }

  // Define the OTPInputContext
  export interface OTPInputContextProps {
    value: string
    onChange: (value: string) => void
    maxLength: number
    slots: React.ReactNode[]
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

  // Export components and contexts
  export const InputOTPContext: React.Context<InputOTPContext>
  export const OTPInput: React.FC<OTPInputProps>
  export const OTPInputContext: React.Context<OTPInputContextProps>

  // Custom hook to use the context
  export function useInputOTPContext(): InputOTPContext
} 