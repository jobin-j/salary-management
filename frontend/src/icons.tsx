import { createSvgIcon } from '@mui/material/utils'

// Paths from Material Icons (Apache 2.0), inlined to avoid depending on @mui/icons-material for a few icons.
export const EditIcon = createSvgIcon(
  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z" />,
  'Edit',
)

export const DeleteIcon = createSvgIcon(
  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-7l-1 1H5v2h14z" />,
  'Delete',
)
