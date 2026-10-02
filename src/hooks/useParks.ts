import { useContext } from "react";
import { ParksContext, type ParksContextValue } from "@/contexts/ParksContext";

/** Reads the shared parks state; throws instead of returning a silent `undefined` outside a provider. */
export function useParks(): ParksContextValue {
  const value = useContext(ParksContext);
  if (value === null) {
    throw new Error("useParks must be used within a ParksProvider");
  }
  return value;
}
