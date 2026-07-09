import { useEffect, useState } from "react";

export function useAsync(task, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    let active = true;
    async function load() {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const data = await task();
        if (active) setState({ loading: false, data, error: "" });
      } catch (error) {
        if (active) setState({ loading: false, data: null, error: error.message || "Something went wrong" });
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [task, ...deps]);   // task is now included

  return state;
}