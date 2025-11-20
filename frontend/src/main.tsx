import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from "./App"
import { ThemeProvider } from './components/ui/theme-provider'
import './global.css'

const queryClient = new QueryClient()


const container = document.querySelector('#root')
if (container) {
			const root = createRoot(container)
			root.render(
				<StrictMode>
					<QueryClientProvider client={queryClient}>
						<ReactQueryDevtools initialIsOpen={false} />
						<BrowserRouter>
						<ThemeProvider>
							<App />
						</ThemeProvider>
						</BrowserRouter>
					</QueryClientProvider>
				</StrictMode>
			)
		}