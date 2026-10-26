import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import EmployeesPage from './pages/EmployeesPage'

function App() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Salary Management
      </Typography>
      <EmployeesPage />
    </Container>
  )
}

export default App
