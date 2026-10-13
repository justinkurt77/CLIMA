import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 50;

export function usePaginatedReports({ status, category, departmentId } = {}) {
  return useInfiniteQuery({
    queryKey: ["reports", { status, category, departmentId }],
    queryFn: async ({ pageParam = 0 }) => {
      const startIndex = pageParam * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      let query = supabase
        .from("reports")
        .select("*, categories(id, name, icon, department_id, departments(id, name, accent_color))")
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex);

      // Apply filters
      if (status && status !== "all") {
        query = query.eq("status", status);
      }
      if (category && category !== "all") {
        query = query.eq("category", category);
      }
      if (departmentId && departmentId !== "all") {
        // This filter would need to be applied through the category join
        // For now, we'll handle this client-side or through a view
        query = query.eq("categories.department_id", departmentId);
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
