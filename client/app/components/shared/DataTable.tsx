"use client";

/**
 * DataTable — alias công khai của ERPTable (cùng một component).
 * Trang mới nên import DataTable; các trang cũ tiếp tục dùng ERPTable đều được.
 */
export { default, default as DataTable } from "./ERPTable";
export type { ERPTableColumn as DataTableColumn } from "./ERPTable";
