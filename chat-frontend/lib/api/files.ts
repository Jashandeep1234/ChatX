"use client";

import axios from "axios";
import { getApiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";
import type { FileUploadResponse } from "@/types";

export interface UploadProgress {
  loaded: number;
  total?: number;
  percent: number;
}

export async function uploadFile(
  file: File,
  onProgress?: (p: UploadProgress) => void,
  signal?: AbortSignal
): Promise<FileUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const token = useAuthStore.getState().accessToken;
  // Use a raw axios call so we can stream progress events.
  const res = await axios.post<FileUploadResponse>(
    `${getApiClient().defaults.baseURL}/api/files/upload`,
    form,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal,
      onUploadProgress: (e) => {
        const total = e.total ?? file.size;
        const loaded = e.loaded;
        onProgress?.({
          loaded,
          total,
          percent: total ? Math.round((loaded / total) * 100) : 0,
        });
      },
    }
  );
  return res.data;
}
