import { lazy, Suspense, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import EmployeesPage from './pages/EmployeesPage'

// Loaded on first visit, which also keeps it out of the main bundle.
const InsightsPage = lazy(() => import('./pages/InsightsPage'))

type Page = 'employees' | 'insights'

function App() {
  const [page, setPage] = useState<Page>('employees')

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Salary Management
      </Typography>
      <Tabs value={page} onChange={(_, value: Page) => setPage(value)} sx={{ mb: 2 }}>
        <Tab label="Employees" value="employees" />
        <Tab label="Insights" value="insights" />
      </Tabs>
      {page === 'employees' && <EmployeesPage />}
      {page === 'insights' && (
        <Suspense
          fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress aria-label="Loading insights" />
            </Box>
          }
        >
          <InsightsPage />
        </Suspense>
      )}
    </Container>
  )
}

export default App
