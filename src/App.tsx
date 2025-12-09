import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { DashboardPage } from './pages/DashboardPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00598c',
    },
    secondary: {
      main: '#ec6f2d',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DashboardPage />
    </ThemeProvider>
  );
}

export default App;
