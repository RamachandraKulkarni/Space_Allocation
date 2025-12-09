import { Alert, AlertTitle, Chip, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import type { AllocationResult } from '../types';

type Props = {
  allocation?: AllocationResult | null;
};

export function DiagnosticsPanel({ allocation }: Props) {
  if (!allocation) {
    return null;
  }

  const hasIssues = allocation.diagnostics.length > 0 || allocation.unassignedStudios.length > 0;

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        borderRadius: 1,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Diagnostics
        </Typography>
        <Chip
          label={hasIssues ? 'Issues Found' : 'All Good'}
          size="small"
          color={hasIssues ? 'warning' : 'success'}
          sx={{ fontWeight: 500 }}
        />
      </Stack>
      {allocation.diagnostics.length === 0 ? (
        <Alert severity="success" sx={{ borderRadius: 1 }}>
          All studios fit within current constraints.
        </Alert>
      ) : (
        <List dense>
          {allocation.diagnostics.map((message, index) => (
            <ListItem key={`${message}-${index}`}>
              <ListItemText primary={message} />
            </ListItem>
          ))}
        </List>
      )}
      {allocation.unassignedStudios.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
          <AlertTitle sx={{ fontWeight: 600 }}>Unassigned Studios</AlertTitle>
          <List dense>
            {allocation.unassignedStudios.map((studio) => (
              <ListItem key={studio.id} disableGutters>
                <ListItemText primary={`${studio.id} (${studio.size} students)`} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
    </Paper>
  );
}
