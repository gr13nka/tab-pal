import { StorageProvider } from "@/core/storage/StorageProvider";
import { AppRouter } from "./router";

export function App() {
  return (
    <StorageProvider>
      <AppRouter />
    </StorageProvider>
  );
}
