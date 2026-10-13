import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 30;

export function usePaginatedHospitalRecords({ startDate, endDate, hospitalName } = {}) {
  return useInfiniteQuery({
    queryKey: ["hospital_records", { startDate, endDate, hospitalName }],
    queryFn: async ({ pageParam = 0 }) => {
      const startIndex = pageParam * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      let query = supabase
        .from("hospital_daily_records")
        .select("*")
        .order("record_date", { ascending: false })
        .range(startIndex, endIndex);

      // Apply filters
      if (startDate) {
        query = query.gte("record_date", startDate);
      }
      if (endDate) {
        query = query.lte("record_date", endDate);
      }
      if (hospitalName && hospitalName !== "all") {
        query = query.eq("hospital_name", hospitalName);
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
