import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 20;

export function usePaginatedAdvisories({ status, departmentId } = {}) {
  return useInfiniteQuery({
    queryKey: ["advisories", { status, departmentId }],
    queryFn: async ({ pageParam = 0 }) => {
      const startIndex = pageParam * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      let query = supabase
        .from("advisories")
        .select("*, departments(id, name, accent_color), profiles(full_name)")
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex);

      // Apply filters
      if (status && status !== "all") {
        query = query.eq("status", status);
      }
      if (departmentId && departmentId !== "all") {
        query = query.eq("department_id", departmentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        data: data || [],
        nextPage: data && data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
