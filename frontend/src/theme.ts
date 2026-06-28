import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3', // Blue (Material Design classic)
      light: '#6ec6ff',
      dark: '#0069c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#9c27b0', // Purple
      light: '#d05ce3',
      dark: '#6a0080',
      contrastText: '#fff',
    },
    background: {
      default: '#f5f7fb', // Sleek, light grey-blue background
      paper: '#ffffff',
    },
    text: {
      primary: '#263238', // Dark slate blue
      secondary: '#607d8b',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
      color: '#263238',
    },
    h6: {
      fontWeight: 500,
      color: '#263238',
    },
    subtitle2: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none', // Material Design 3 style (lowercase, clean)
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12, // Material Design 3 uses softer rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24, // Rounded pills for buttons
          padding: '8px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow:
            '0px 2px 8px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.05)',
          borderRadius: 12,
          '&:hover': {
            boxShadow:
              '0px 4px 16px rgba(0, 0, 0, 0.08), 0px 2px 4px rgba(0, 0, 0, 0.06)',
          },
          transition: 'box-shadow 0.2s ease-in-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;
