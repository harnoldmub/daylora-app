import { createContext, useContext } from "react";

type PublicEditContextValue = {
  canEdit: boolean;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
};

const PublicEditContext = createContext<PublicEditContextValue>({
  canEdit: false,
  editMode: false,
  setEditMode: () => null,
});

export function PublicEditProvider({
  value,
  children,
}: {
  value: PublicEditContextValue;
  children: React.ReactNode;
}) {
  return <PublicEditContext.Provider value={value}>{children}</PublicEditContext.Provider>;
}

export function usePublicEdit() {
  return useContext(PublicEditContext);
}

