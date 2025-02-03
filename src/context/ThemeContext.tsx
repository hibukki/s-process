import React, { createContext, useContext } from 'react'

type ThemeContextType = {
  isDarkMode: boolean
}

export const ThemeContext = createContext<ThemeContextType>({ isDarkMode: false })

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 