import { api } from "@/services/api";
import type { Paginated } from "@/types/api";

/**
 * Example service module. Each backend resource gets its own
 * `<resource>.service.ts` file that owns the endpoint paths and exposes
 * typed functions consumed by hooks in `src/hooks` or `src/features`.
 */

export interface ExampleItem {
  id: string;
  name: string;
  createdAt: string;
}

export const exampleService = {
  list: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get<Paginated<ExampleItem>>("/examples", {
      params,
    });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ExampleItem>(`/examples/${id}`);
    return data;
  },

  create: async (payload: Pick<ExampleItem, "name">) => {
    const { data } = await api.post<ExampleItem>("/examples", payload);
    return data;
  },
};
