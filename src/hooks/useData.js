import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService, orderService, catalogService } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ── Clients ───────────────────────────────────────────────────
export const useClients = (params) =>
  useQuery({ queryKey: ['clients', params], queryFn: () => clientService.list(params).then(r => r.data) });

export const useClient = (id) =>
  useQuery({ queryKey: ['clients', id], queryFn: () => clientService.get(id).then(r => r.data.data), enabled: !!id });

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clientService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast.success('Cliente cadastrado com sucesso!'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao cadastrar cliente.'),
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => clientService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast.success('Cliente atualizado!'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao atualizar cliente.'),
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clientService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast.success('Cliente excluído.'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao excluir cliente.'),
  });
};

export const useLookupCEP = () =>
  useMutation({
    mutationFn: clientService.lookupCEP,
    onError: (err) => toast.error(err.response?.data?.error || 'CEP não encontrado.'),
  });

// ── Orders ────────────────────────────────────────────────────
export const useOrders = (params) =>
  useQuery({ queryKey: ['orders', params], queryFn: () => orderService.list(params).then(r => r.data) });

export const useOrder = (id) =>
  useQuery({ queryKey: ['orders', id], queryFn: () => orderService.get(id).then(r => r.data.data), enabled: !!id });

export const useOrderStats = (period = '30') =>
  useQuery({ queryKey: ['orders-stats', period], queryFn: () => orderService.stats(period).then(r => r.data.data) });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: orderService.create,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Atendimento ${res.data.data.order_number} registrado! ${res.data.email_sent ? 'E-mail enviado ✉️' : ''}`);
      // Download automático do PDF se gerado
      if (res.data.pdf_base64) {
        const bytes = atob(res.data.pdf_base64);
        const blob = new Blob([Uint8Array.from(bytes, c => c.charCodeAt(0))], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `Garantia_${res.data.data.order_number}.pdf`; a.click();
        URL.revokeObjectURL(url);
      }
      navigate('/orders');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao registrar atendimento.'),
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => orderService.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Status atualizado!'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao atualizar status.'),
  });
};

export const useDownloadPDF = () =>
  useMutation({
    mutationFn: async (id) => {
      const res = await orderService.downloadPDF(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Garantia_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success('PDF baixado com sucesso!'),
    onError: () => toast.error('Erro ao gerar PDF.'),
  });

// ── Catalog ───────────────────────────────────────────────────
export const useIPhoneModels = () =>
  useQuery({
    queryKey: ['iphone-models'],
    queryFn: () => catalogService.iphoneModels().then(r => r.data.data),
    staleTime: Infinity,
  });
