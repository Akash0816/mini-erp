import {createRoot} from 'react-dom/client';import {HashRouter} from 'react-router-dom';
import {ThemeProvider,createTheme,CssBaseline} from '@mui/material';import {Provider} from './store';import App from './App';
const theme=createTheme({palette:{primary:{main:'#0b5bd3'},background:{default:'#f3f6fb'}},shape:{borderRadius:8}});
createRoot(document.getElementById('root')!).render(<ThemeProvider theme={theme}><CssBaseline/><HashRouter><Provider><App/></Provider></HashRouter></ThemeProvider>);
