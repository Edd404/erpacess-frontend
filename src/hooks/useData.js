import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService, orderService, adminService } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ── Clients ───────────────────────────────────────────────────
export const useClients = (params) =>
  useQuery({ queryKey: ['clients', params], queryFn: () => clientService.list(params).then(r => r.data) });

export const useClient = (id) =>
  useQuery({ queryKey: ['clients', id], queryFn: () => clientService.get(id).then(r => r.data.data), enabled: !!id });

export const useClientHistory = (id) =>
  useQuery({ queryKey: ['client-history', id], queryFn: () => clientService.getHistory(id).then(r => r.data.data), enabled: !!id });

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

export const useOrderStats = (params = { period: '30' }) =>
  useQuery({ queryKey: ['orders-stats', params], queryFn: () => orderService.stats(params).then(r => r.data.data) });

export const useAdvancedStats = (params = { period: '30' }) =>
  useQuery({ queryKey: ['orders-advanced-stats', params], queryFn: () => orderService.advancedStats(params).then(r => r.data.data) });

export const useAuditLogs = (params) =>
  useQuery({ queryKey: ['audit', params], queryFn: () => orderService.auditLogs(params).then(r => r.data) });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: orderService.create,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders-stats'] });
      qc.invalidateQueries({ queryKey: ['orders-advanced-stats'] });
      toast.success(`Atendimento ${res.data.data.order_number} registrado! ${res.data.email_sent ? 'E-mail enviado ✉️' : ''}`);
      navigate('/orders');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao registrar atendimento.'),
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => orderService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders-stats'] });
      toast.success('Status atualizado!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao atualizar status.'),
  });
};

export const useDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => orderService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders-stats'] });
      qc.invalidateQueries({ queryKey: ['orders-advanced-stats'] });
      toast.success('Ordem excluída com sucesso.');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao excluir ordem.'),
  });
};

export const useUpdateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => orderService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders', id] });
      qc.invalidateQueries({ queryKey: ['orders-stats'] });
      qc.invalidateQueries({ queryKey: ['client-history'] });
      toast.success('Atendimento atualizado com sucesso!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao atualizar atendimento.'),
  });
};

// ── Admin hooks ───────────────────────────────────────────────
export const useAdminUsers = () =>
  useQuery({ queryKey: ['admin-users'], queryFn: () => adminService.listUsers().then(r => r.data.data) });

export const useAdminModels = () =>
  useQuery({ queryKey: ['admin-models'], queryFn: () => adminService.listModels().then(r => r.data.data) });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d) => adminService.createUser(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Usuário criado!'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao criar usuário.'),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminService.updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Usuário atualizado!'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao atualizar usuário.'),
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ id, password }) => adminService.resetPassword(id, password),
    onSuccess: () => toast.success('Senha redefinida!'),
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao redefinir senha.'),
  });
};

export const useCreateModel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d) => adminService.createModel(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-models'] }); toast.success('Modelo adicionado!'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao criar modelo.'),
  });
};

export const useUpdateModel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminService.updateModel(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-models'] }); toast.success('Modelo atualizado!'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao atualizar modelo.'),
  });
};

export const useDownloadPDF = () =>
  useMutation({
    mutationFn: async (id) => {
      const res = await orderService.downloadPDF(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `Garantia_${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success('PDF baixado!'),
    onError: () => toast.error('Erro ao gerar PDF.'),
  });
