'use server';

import { revalidatePath } from 'next/cache';

import {
  createAdminJob,
  deleteAdminJob,
  reorderAdminJobs,
  setAdminJobActive,
  updateAdminJob,
  type JobVacancyPayload,
} from '@/lib/services/admin/jobs';
import { getRequestContext } from '@/lib/services/admin/audit-metadata';

export type AdminFormState = { ok: boolean; error?: string };

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === 'on' || formData.get(key) === 'true';
}

function readJobVacancyPayload(formData: FormData): JobVacancyPayload {
  const title = readString(formData, 'title');
  const slug = readString(formData, 'slug');

  if (!title) {
    throw new Error('Tiêu đề tuyển dụng là bắt buộc.');
  }

  return {
    title,
    slug,
    description: readString(formData, 'description') || null,
    location: readString(formData, 'location') || null,
    salary_range: readString(formData, 'salary_range') || null,
    is_active: readBoolean(formData, 'is_active'),
  };
}

function revalidateJobs() {
  revalidatePath('/admin/jobs');
  revalidatePath('/admin/dashboard');
  revalidatePath('/tuyen-dung');
  revalidatePath('/');
}

export async function createJobAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const payload = readJobVacancyPayload(formData);
    const requestContext = await getRequestContext();
    const { error } = await createAdminJob(payload, requestContext);

    if (error) {
      if (error.includes('duplicate key value violates unique constraint')) {
        return { ok: false, error: 'Đường dẫn (slug) đã tồn tại. Vui lòng nhập đường dẫn khác.' };
      }
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể đăng tin tuyển dụng.' };
  }

  revalidateJobs();
  return { ok: true };
}

export async function updateJobAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const jobId = readString(formData, 'id');

    if (!jobId) {
      return { ok: false, error: 'Thiếu ID tin tuyển dụng.' };
    }

    const payload = readJobVacancyPayload(formData);
    const requestContext = await getRequestContext();
    const { error } = await updateAdminJob(jobId, payload, requestContext);

    if (error) {
      if (error.includes('duplicate key value violates unique constraint')) {
        return { ok: false, error: 'Đường dẫn (slug) đã tồn tại. Vui lòng nhập đường dẫn khác.' };
      }
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể cập nhật tin tuyển dụng.' };
  }

  revalidateJobs();
  return { ok: true };
}

export async function deleteJobAction(jobId: string): Promise<AdminFormState> {
  if (!jobId) {
    return { ok: false, error: 'Thiếu ID tin tuyển dụng.' };
  }

  try {
    const requestContext = await getRequestContext();
    const { error } = await deleteAdminJob(jobId, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể xóa tin tuyển dụng.' };
  }

  revalidateJobs();
  return { ok: true };
}

export async function toggleJobActiveAction(formData: FormData) {
  const jobId = readString(formData, 'id');
  const isActive = readString(formData, 'next_is_active') === 'true';

  if (!jobId) {
    throw new Error('Thiếu ID tin tuyển dụng.');
  }

  const requestContext = await getRequestContext();
  const { error } = await setAdminJobActive(jobId, isActive, requestContext);

  if (error) {
    throw new Error(error);
  }

  revalidateJobs();
}

export async function reorderJobsAction(orderedIds: string[]): Promise<AdminFormState> {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: false, error: 'Dữ liệu sắp xếp không hợp lệ.' };
  }

  try {
    const requestContext = await getRequestContext();
    const { error } = await reorderAdminJobs(orderedIds, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể cập nhật thứ tự hiển thị.' };
  }

  revalidateJobs();
  return { ok: true };
}
