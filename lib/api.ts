import { ref, get, query, orderByChild, limitToLast } from "firebase/database";
import { database } from "./firebase";

export async function fetchFromFirebase<T>(
  path: string, 
  options?: { 
    orderBy?: string; 
    limit?: number 
  }
): Promise<T[]> {
  let dbRef = ref(database, path);
  
  if (options?.orderBy) {
    const q = query(dbRef, orderByChild(options.orderBy));
    if (options?.limit) {
      const limitedQ = query(q, limitToLast(options.limit));
      const snapshot = await get(limitedQ);
      if (!snapshot.exists()) return [];
      return Object.values(snapshot.val()) as T[];
    }
    const snapshot = await get(q);
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val()) as T[];
  }
  
  const snapshot = await get(dbRef);
  if (!snapshot.exists()) return [];
  return Object.values(snapshot.val()) as T[];
}
