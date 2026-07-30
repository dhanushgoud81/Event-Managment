import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formApi } from '@/api/form.api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/api/axios';
import type { CreateFormFieldRequest, UpdateFormFieldRequest, ReorderFieldsRequest } from '@/types/form.types';

export function useFormFields(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'form-fields'],
    queryFn: () => formApi.listFormFields(eventId),
    enabled: !!eventId,
  });
}

export function useCreateFormField(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFormFieldRequest) => formApi.createFormField(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'form-fields'] });
      toast.success('Form field added successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateFormField(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFormFieldRequest }) =>
      formApi.updateFormField(eventId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'form-fields'] });
      toast.success('Form field updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteFormField(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => formApi.deleteFormField(eventId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'form-fields'] });
      toast.success('Form field deleted successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useReorderFormFields(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderFieldsRequest) => formApi.reorderFields(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'form-fields'] });
      toast.success('Form layout saved');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
