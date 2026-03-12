import { createContext, useState } from "react"
import type { ReactNode } from "react"

interface AuthContextType {
  user: any | null;
  setUser: (user: any) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null)

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}