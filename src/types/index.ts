export type * from "@/types/api";
export * from "@/types/auth";
export type * from "@/types/certificate";
export type * from "@/types/internship";
export type * from "@/types/portfolio";

/** Utility type: make selected keys optional. */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Utility type: value of an object or array. */
export type ValueOf<T> = T[keyof T];
