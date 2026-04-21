# 📱 iPhone Store — Frontend

Interface moderna estilo Apple para o sistema de gestão da loja de iPhones.

---

## 🚀 Início Rápido

```bash
cd frontend
npm install
cp .env.example .env   # configure VITE_API_URL
npm run dev            # http://localhost:3000
```

---

## 🏗️ Arquitetura

```
frontend/src/
├── App.jsx                       # Roteamento e providers
├── context/
│   └── AuthContext.jsx           # Estado global de autenticação
├── hooks/
│   └── useData.js                # React Query: todos os fetches/mutations
├── services/
│   └── api.js                    # Axios + interceptors (auth/refresh)
├── pages/
│   ├── LoginPage.jsx             # Tela de login
│   ├── DashboardPage.jsx         # Visão geral com gráficos
│   ├── ClientsPage.jsx           # Lista e busca de clientes
│   ├── ClientDetailPage.jsx      # Detalhe + histórico de OSs
│   ├── OrdersPage.jsx            # Lista de atendimentos com filtros
│   ├── NewOrderPage.jsx          # Formulário de novo atendimento
│   └── OrderDetailPage.jsx       # Detalhe com download do PDF
├── components/
│   ├── layout/
│   │   ├── Layout.jsx            # Shell principal (sidebar + topbar)
│   │   └── Sidebar.jsx           # Navegação lateral
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   ├── Table.jsx
│   │   └── StatCard.jsx
│   └── forms/
│       ├── ClientForm.jsx        # Formulário com validação de CPF + CEP
│       └── ServiceOrderForm.jsx  # Formulário com seletor de modelos iPhone
└── utils/
    ├── formatters.js             # CPF, phone, currency, date formatters
    └── validators.js             # CPF, IMEI validation algorithms
```

---

## 🎨 Design System

- **Fonte:** DM Sans (corpo) + DM Mono (IMEI, códigos)
- **Paleta:** Cinza Apple #1D1D1F, Azul #0071E3, Verde #30D158
- **Raio:** 12px (cards) / 8px (inputs, botões)
- **Sombra:** Suave multicamada, estilo macOS

---

## 📄 Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:3001/api/v1
```

---

## 🔑 Fluxo de Autenticação

```
Login → accessToken (8h) + refreshToken (7d) salvo em localStorage
Axios interceptor → injeta Bearer token em todas as requisições
401 → tenta refresh automático → falha → redireciona para /login
```

---

## 📋 Páginas

| Rota | Descrição |
|---|---|
| `/login` | Autenticação |
| `/` | Dashboard com estatísticas e gráficos |
| `/clients` | Lista de clientes com busca em tempo real |
| `/clients/:id` | Detalhes + histórico de atendimentos |
| `/orders` | Lista de OSs com filtros por status e tipo |
| `/orders/new` | Formulário completo de novo atendimento |
| `/orders/:id` | Detalhes + download do PDF de garantia |

---

## ✨ Funcionalidades por Tela

### Dashboard
- Receita total, mensal, OSs abertas, clientes
- Gráfico de barras de receita semanal (Recharts)
- Top 5 modelos mais vendidos
- Últimos atendimentos

### Cadastro de Cliente
- Máscara automática de CPF, telefone
- Validação de CPF em tempo real (algoritmo Receita Federal)
- Busca automática de endereço via CEP (ViaCEP)

### Novo Atendimento
- Seletor de modelos por série (iPhone 1 → 16 Pro Max)
- Máscara de valor em BRL com formatação automática
- Seleção múltipla de formas de pagamento
- Validação de IMEI (algoritmo de Luhn)
- Download automático do PDF após registro
