import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteEmployee, type Employee } from '../api/employees'

interface Props {
  employee: Employee
  onClose: () => void
  onDeleted: () => void
}

export default function DeleteEmployeeDialog({ employee, onClose, onDeleted }: Props) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => deleteEmployee(employee.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['options'] })
      onDeleted()
    },
  })

  return (
    <Dialog open onClose={onClose} aria-labelledby="delete-employee-title">
      <DialogTitle id="delete-employee-title">Delete employee?</DialogTitle>
      <DialogContent>
        {mutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Could not delete the employee. Please try again.
          </Alert>
        )}
        <DialogContentText>
          {employee.full_name} ({employee.email}) will be permanently deleted.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}
