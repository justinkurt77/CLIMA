import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 30;

export function usePaginatedBFPOps({ startDate, endDate, status, operationType } = {}) {
  return useInfiniteQuery({
    queryKey: ["bfp_operations", { startDate, endDate, status, operationType }],
    queryFn: async ({ pageParam = 0 }) => {
      const startIndex = pageParam * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      let query = supabase
        .from("bfp_operations")
        .select("*")
        .order("operation_date", { ascending: false })
        .range(startIndex, endIndex);

      // Apply filters
      if (startDate) {
        query = query.gte("operation_date", startDate);
      }
      if (endDate) {
        query = query.lte("operation_date", endDate);
      }
      if (status && status !== "all") {
        query = query.eq("status", status);
      }
      if (operationType && operationType !== "all") {
        query = query.eq("operation_type", operationType);
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
