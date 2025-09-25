# API Setup Guide

## 1. Environment Configuration

Thêm dòng sau vào file `.env` của bạn:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://transparent-charity-dao-be-production.up.railway.app
```

## 2. Sử dụng API trong Components

### Import hooks và types

```tsx
import { 
  useDonates, 
  useDonatesByProject, 
  useDonatesByDonor,
  useUser,
  useTransactions,
  useDashboardStats,
  useProposalAnalysis 
} from '@/hooks/useApi'
import { apiClient, type Donate, type User, type Transaction } from '@/lib/api'
```

### Ví dụ sử dụng trong Dashboard

```tsx
function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading dashboard</div>
  
  return (
    <div>
      <h1>Dashboard</h1>
      <div>Total Donated: ${stats?.totalDonated}</div>
      <div>Total Donors: {stats?.totalDonors}</div>
      <div>Total Projects: {stats?.totalProjects}</div>
      <div>Total Transactions: {stats?.totalTransactions}</div>
    </div>
  )
}
```

### Ví dụ sử dụng Donates List

```tsx
function DonatesList({ projectId }: { projectId?: string }) {
  const { data: donates, isLoading, error } = projectId 
    ? useDonatesByProject(projectId)
    : useDonates()
  
  if (isLoading) return <div>Loading donations...</div>
  if (error) return <div>Error loading donations</div>
  
  return (
    <div>
      <h2>Donations</h2>
      {donates?.map(donate => (
        <div key={donate.id}>
          <p>Donor: {donate.donor_wallet}</p>
          <p>Amount: ${donate.amount}</p>
          <p>Project: {donate.project_id}</p>
          <p>Date: {new Date(donate.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  )
}
```

### Ví dụ tạo user mới

```tsx
function CreateUser() {
  const createUser = useCreateUser()
  
  const handleSubmit = async (formData: any) => {
    try {
      const result = await createUser.mutateAsync({
        wallet: formData.wallet,
        name: formData.name,
        email: formData.email,
        kyc_status: 'pending',
        status: 'active',
      })
      
      if (result.success) {
        console.log('User created:', result.data)
      }
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### Ví dụ sử dụng User Profile

```tsx
function UserProfile({ wallet }: { wallet: string }) {
  const { data: user, isLoading } = useUser(wallet)
  
  if (isLoading) return <div>Loading user...</div>
  if (!user) return <div>User not found</div>
  
  return (
    <div>
      <h2>User Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Wallet: {user.wallet}</p>
      <p>KYC Status: {user.kyc_status}</p>
      <p>Status: {user.status}</p>
    </div>
  )
}
```

### Ví dụ sử dụng Proposal Analysis

```tsx
function ProposalAnalysis({ projectId }: { projectId: string }) {
  const { data: analysis, isLoading } = useProposalAnalysis(projectId)
  const analyzeProposal = useAnalyzeProposal()
  
  const handleAnalyze = async () => {
    await analyzeProposal.mutateAsync({
      project_id: projectId,
      title: "Project Title",
      description: "Project Description",
      target_amount: 10000,
      category: "charity"
    })
  }
  
  return (
    <div>
      <h2>AI Analysis</h2>
      {analysis ? (
        <div>
          <p>Score: {analysis.analysis_result.score}/100</p>
          <h3>Strengths:</h3>
          <ul>
            {analysis.analysis_result.strengths.map((strength, i) => (
              <li key={i}>{strength}</li>
            ))}
          </ul>
          <h3>Risks:</h3>
          <ul>
            {analysis.analysis_result.risks.map((risk, i) => (
              <li key={i}>{risk}</li>
            ))}
          </ul>
        </div>
      ) : (
        <button onClick={handleAnalyze}>Analyze Proposal</button>
      )}
    </div>
  )
}
```

## 3. API Endpoints

API client hỗ trợ các endpoints sau:

### Donates
- `GET /api/donates` - Lấy tất cả donate
- `GET /api/donates/donor/{donor_wallet}` - Lấy danh sách donate theo donor_wallet
- `GET /api/donates/project/{project_id}` - Lấy danh sách donate theo project_id

### Users
- `POST /api/users` - Tạo tài khoản mới
- `GET /api/users/{wallet}` - Lấy thông tin người dùng theo wallet address
- `PUT /api/users/{id}` - Chỉnh sửa thông tin người dùng
- `PATCH /api/users/{id}/kyc` - Cập nhật trạng thái KYC của người dùng
- `PATCH /api/users/{id}/status` - Toggle trạng thái người dùng (active ↔ block)

### Transactions
- `GET /api/transactions` - Lấy danh sách các giao dịch
- `GET /api/transactions/address/{from_address}` - Lấy tất cả giao dịch theo địa chỉ ví

### Analyzing (AI)
- `POST /api/proposals/analyze` - Phân tích đề xuất fundraising
- `GET /api/proposals/result/{project_id}` - Lấy kết quả AI đã phân tích theo project_id

## 4. Error Handling

Tất cả API calls đều trả về format:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
```

Hooks tự động xử lý error và retry logic. Bạn có thể check `error` state từ hooks để hiển thị thông báo lỗi.

## 5. Caching và Optimization

- Dữ liệu được cache tự động với React Query
- Stale time được set phù hợp cho từng loại dữ liệu
- Auto invalidation khi có mutations
- Retry logic cho các request thất bại

## 6. Testing API Connection

Sử dụng hook `useApiStatus()` để kiểm tra kết nối API:

```tsx
function ApiStatus() {
  const { data: isOnline } = useApiStatus()
  
  return (
    <div>
      API Status: {isOnline ? '🟢 Online' : '🔴 Offline'}
    </div>
  )
}
```
